import { utils, BigNumber } from 'ethers';
import { ETHERSCAN_API_KEY } from './constants';
import { ActionItem } from 'utils/types';
import { ActionType } from '@aragon/govern';

// TODO: discuss with Giorgi to move this to a standalone library so that
// this module can be shared by Court as it's currently a duplicate of
// https://github.com/aragon/protocol-dashboard/blob/develop/src/utils/abi-utils.js

type DecodedData = {
  functionName: string;
  inputData: any;
};

const COMPLEX_TYPES = new Set(['array', 'tuple']);

/**
 * Format number and BigNumber as string and return other values as is
 *
 * @param value the value to be decoded
 * @returns
 */
function decodeValue(value: any): any {
  if (typeof value === 'number' || BigNumber.isBigNumber(value)) {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return value.map(decodeValue);
  }
  return value;
}

/**
 * structures the decoded calldata in a concise way.
 *
 * @param {string} name the name of the element
 * @param {object} input abi's component
 * @param {any} value the actual parameter value user called
 * @param {object} accum the final decoded result
 * @returns {void}
 */
function decodeInput(name: string, input: any, value: any, accum: any) {
  if (!accum[name]) accum[name] = {};

  if (input.arrayChildren) {
    accum[name] = {};
    value.map((item: any, index: number) => {
      let key = `${index + 1}th element`;
      if (input.arrayChildren) {
        key += `(${input.arrayChildren.baseType})`;
      }
      accum[name][key] = {};
      decodeInput(key, input.arrayChildren, item, accum[name]);
    });
    return;
  }

  if (input.type === 'tuple') {
    input.components.forEach((component: any, index: number) => {
      decodeInput(`${component.name}(${component.baseType})`, component, value[index], accum[name]);
    });
    return;
  }

  accum[name] = decodeValue(value);
}

/**
 * AbiHandler class provides functions to retrieve ABI from etherscan
 *  and decode transaction data using ABI
 */
export default class AbiHandler {
  private readonly network: string;
  private readonly baseUrl: string;
  private cache: Record<string, any>;

  constructor(networkName: string) {
    this.network = networkName.toLowerCase();
    this.baseUrl = `https://api${
      this.network === 'mainnet' ? '' : `-${this.network}`
    }.etherscan.io/api?apikey=${ETHERSCAN_API_KEY}`;
    this.cache = {};
  }

  /**
   * Get the verified contract abi from etherscan
   *
   * @param address the contract address
   * @returns {string|null} the contract abi
   */
  async get(address: string): Promise<string | null> {
    if (this.cache[address]) {
      return this.cache[address];
    }

    const endpoint = `${this.baseUrl}&module=contract&action=getabi&address=${address}`;

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const json = await response.json();
        if (json.message === 'OK') {
          if (AbiHandler.isValidAbi(json.result) === true) {
            this.cache[address] = json.result;
            return json.result;
          }
        }
      }
    } catch (e) {
      // swallow error
    }
    return null;
  }

  /**
   * Decode transaction data given the contract abi and transaction.data
   *
   * @param {string} abi contract abi
   * @param {string} data encoded data
   * @returns {DecodedData|null} decoded data
   */
  static decode(abi: string, data: string): DecodedData | null {
    try {
      const iface = new utils.Interface(abi);
      const sigHash = data.substring(0, 10);
      const decodedData = iface.decodeFunctionData(sigHash, data);
      const functionABI = iface.getFunction(sigHash);

      const functionName = functionABI.name;
      const onlyNamedResult = decodedData.reduce((accum, value, index) => {
        const input = functionABI.inputs[index];

        decodeInput(`Argument #${index + 1} (${input.baseType})`, input, value, accum);

        return accum;
      }, {});

      return { functionName, inputData: onlyNamedResult };
    } catch (err) {
      console.log(err, 'err');
    }
    return null;
  }

  /**
   * Check if the given abi is in valid abi format
   *
   * @param {string} abi contract abi
   * @returns {true|false} true if the abi is of valid format
   */
  static isValidAbi(abi: string): boolean {
    try {
      const parsedAbi = JSON.parse(abi);
      if (Array.isArray(parsedAbi) && parsedAbi.length > 0) {
        return true;
      }
    } catch (e) {}

    return false;
  }

  /**
   * map an array of values (if not provided, use empty string) to ActionItem format
   *
   * @param {string} signature function signature from abi
   * @param {string} contractAddress contract address
   * @param {array} values to be encoded into action
   * @returns
   */
  static mapToAction(signature: string, contractAddress: string, values: any): ActionItem {
    const fragment = utils.Fragment.from(signature) as utils.FunctionFragment;
    const abiInterface = new utils.Interface([`${signature}`]);
    const inputs = fragment.inputs.map((item, i) => ({
      name: item.name,
      type: item.format(utils.FormatTypes.full),
      baseType: item.baseType,
      value: values && values[i] ? values[i] : '',
    }));
    const sighash = abiInterface.getSighash(fragment);
    const action: ActionItem = {
      sighash,
      signature,
      contractAddress,
      name: fragment.name,
      inputs,
      payable: fragment.payable,
      payableAmount: '',
    };

    return action;
  }

  /**
   * Encode action data to be passed to the Govern Queue for scheduling
   * @param actions data to be encoded
   * @returns ActionType[] array of actions with encoded calldata
   */
  static encodeActions(actions: ActionItem[]): ActionType[] {
    const encodedActions = actions.map((item) => {
      const { sighash, signature, contractAddress, inputs = [] } = item;
      const abiInterface = new utils.Interface([`${signature}`]);
      const functionParameters = inputs.map((input) => {
        return COMPLEX_TYPES.has(input.baseType) ? JSON.parse(input.value) : input.value;
      });

      const payableAmount = item.payable && item.payableAmount ? item.payableAmount : '0';
      const calldata = abiInterface.encodeFunctionData(sighash, functionParameters);
      const data: ActionType = {
        to: contractAddress,
        value: utils.parseEther(payableAmount),
        data: calldata,
      };
      return data;
    });

    return encodedActions;
  }
}
