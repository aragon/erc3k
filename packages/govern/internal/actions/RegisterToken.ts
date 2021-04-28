import { CensusErc20Api } from 'dvote-js'
import { BigNumber } from 'ethers'
import { Contract } from '@ethersproject/contracts'
import { JsonRpcSigner } from '@ethersproject/providers'
import { TransactionResponse } from '@ethersproject/abstract-provider'
import { TOKEN_STORAGE_PROOF_ADDRESS } from '../configuration/ConfigDefaults'

//@TODO: Move this
export const TOKEN_STORAGE_PROOF_ABI = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'ercTokenAddress',
        type: 'address',
      },
    ],
    name: 'isRegistered',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'tokenAddress',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'balanceMappingPosition',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'blockNumber',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: 'blockHeaderRLP',
        type: 'bytes',
      },
      {
        internalType: 'bytes',
        name: 'accountStateProof',
        type: 'bytes',
      },
      {
        internalType: 'bytes',
        name: 'storageProof',
        type: 'bytes',
      },
    ],
    name: 'registerToken',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
]

export const registerToken = async (
  signer: JsonRpcSigner,
  Token: Contract
): Promise<TransactionResponse | undefined> => {
  const deployer = await signer.getAddress()
  const blockNumber = await signer.provider.getBlockNumber()
  console.log('this is the deployer ', deployer)
  const balance = await Token.balanceOf(deployer)

  // console.log('Balance: ', balance.value.toString())
  console.log('Balance: ', balance)
  console.log('Block number: ', blockNumber)

  let results = {
    blockHeaderRLP: '',
    accountProofRLP: '',
    storageProofsRLP: '',
  }

  let indexSlot
  console.log("Let's look for the balance mapping slot ")
  for (let i = 0; i < 10; i++) {
    const hasIndex = Number.isInteger(indexSlot)
    if (hasIndex) continue
    const balanceSlot = CensusErc20Api.getHolderBalanceSlot(deployer, i)

    try {
      const result = await CensusErc20Api.generateProof(
        Token.address,
        [balanceSlot],
        blockNumber,
        signer.provider as any,
        { verify: true }
      )

      if (result == null || !result.proof) continue
      results = result as any
      const onChainBalance = BigNumber.from(result.proof.storageProof[0].value)

      if (!onChainBalance.eq(balance)) {
        console.warn(
          'The proved balance does not match the on-chain balance:',
          result.proof.storageProof[0].value,
          'vs',
          balance.toHexString()
        )
      }

      indexSlot = i
    } catch (e) {
      console.log('This is the error ', e.message)
      console.log('Result not found on index ', i)
    }
  }

  if (Number.isInteger(indexSlot)) {
    const TokenStorageProof = new Contract(
      TOKEN_STORAGE_PROOF_ADDRESS,
      TOKEN_STORAGE_PROOF_ABI,
      signer
    )
    console.log('Registering token...')
    const result = TokenStorageProof.registerToken(
      Token.address,
      indexSlot,
      blockNumber,
      Buffer.from(results.blockHeaderRLP.replace('0x', ''), 'hex'),
      Buffer.from(results.accountProofRLP.replace('0x', ''), 'hex'),
      Buffer.from(results.storageProofsRLP[0].replace('0x', ''), 'hex'),
      {
        gasLimit: 10_000_000,
      }
    )

    return result
  }
}
