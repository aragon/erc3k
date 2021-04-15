import ClientInterface from '../clients/lib/ClientInterface'
import GraphQLClient from '../clients/graphql/GraphQLClient'
import { DAO_FACTORY_ADDRESS, TOKEN_STORAGE_PROOF_ADDRESS, GOVERN_REGISTRY_ADDRESS } from './ConfigDefaults'

export interface ConfigurationObject {
  governURL?: string
  daoFactoryAddress?: string
  tokenStorageProof?: string
  governRegistry?: string
}

let defaultConfig: Configuration
const governURL = 'https://govern.backend.aragon.org'

/**
 * @class Configuration
 */
export default class Configuration {
  /**
   * Holds the validated configuration object
   *
   * @var config
   *
   * @private
   */
  private config: {
    governURL: string;
    client: ClientInterface
    daoFactoryAddress: string
    tokenStorageProof: string
    governRegistry: string
  }

  /**
   * @param {Object} config
   *
   * @constructor
   */
  constructor(config: any) {
    this.setConfig(config)
  }

  /**
   * TODO: Use a ConfigurationError object
   *
   * Does set and parse the given configuration object
   *
   * @method setConfig
   *
   * @returns {void}
   *
   * @private
   */
  private setConfig(config: any): void {
    if (!config.governURL) {
      throw new Error('Missing Govern server URL!')
    }

    if (!config.daoFactoryAddress) {
      throw new Error('Missing Dao factory address!')
    }

    this.config = {
      governURL: config.governURL,
      client: new GraphQLClient(config.governURL),
      daoFactoryAddress: config.daoFactoryAddress,
      tokenStorageProof: config.tokenStorageProof,
      governRegistry: config.governRegistry
    }
  }

  /**
   * Getter for governURL
   *
   * @var governURL
   *
   * @returns {string}
   *
   * @public
   */
  get governURL(): string {
    return this.config.governURL
  }

  /**
   * Getter for client property
   *
   * @var client
   *
   * @returns {ClientInterface}
   *
   * @public
   */
  get client(): ClientInterface {
    return this.config.client
  }

  /**
   * Getter for daoFactoryAddress property
   *
   * @var daoFactoryAddress
   *
   * @returns {string}
   *
   * @public
   */
   get daoFactoryAddress(): string {
    return this.config.daoFactoryAddress
  }

  /**
   * Getter for tokenStorageProof property
   *
   * @var tokenStorageProof
   *
   * @returns {string}
   *
   * @public
   */
   get tokenStorageProof(): string {
    return this.config.tokenStorageProof
  }

  /**
   * Getter for governRegistry property
   *
   * @var governRegistry
   *
   * @returns {string}
   *
   * @public
   */
   get governRegistry(): string {
    return this.config.governRegistry
  }


  /**
   * Static setter/factory method of the Configuration class
   *
   * @method set
   *
   * @param {ConfigurationObject} config
   *
   * @returns {void}
   *
   * @public
   */
  static set(config?: ConfigurationObject): void {
    if (!config) {
      config = {}
    }

    if (!config.governURL) {
      config.governURL = governURL
    }

    if (!config.daoFactoryAddress) {
      config.daoFactoryAddress = DAO_FACTORY_ADDRESS
    }

    if (!config.tokenStorageProof) {
      config.tokenStorageProof = TOKEN_STORAGE_PROOF_ADDRESS
    }

    if (!config.governRegistry) {
      config.governRegistry = GOVERN_REGISTRY_ADDRESS
    }

    defaultConfig = new Configuration(config)
  }

  /**
   * Static getter for the defaultConfig (used in the public API layer)
   *
   * @method get
   *
   * @returns {Configuration}
   *
   * @public
   */
  static get(): Configuration {
    if (typeof defaultConfig !== 'undefined') {
      return defaultConfig
    }

    Configuration.set()

    return defaultConfig
  }
}
