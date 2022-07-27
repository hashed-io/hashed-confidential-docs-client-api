const { OwnedData, SharedData, Vault } = require('./model')
const { ConfidentialDocsApi, IPFS, Polkadot } = require('./service')

/**
 * Provides access to all the hashed private server functionality
 */
class HashedConfidentialDocs {
  /**
   * @desc Create a hashed private instance
   *
   * @param {Object} opts
   * @param {String} opts.ipfsURL the ipfs endpoint to use
   * @param {String} opts.privateURI the hashed private server endpoint
   * @param {function} opts.signFn async function that receives an address and message as parameters and returns the signed message
   * @return {Object} instance of hashed private
   */
  constructor (opts) {
    this._opts = opts
    const {
      ipfsURL,
      chainURI,
      appName,
      faucet
    } = opts
    this._ipfs = new IPFS({
      url: ipfsURL
    })
    this._polkadot = new Polkadot(chainURI, appName)
    this._confidentialDocsApi = new ConfidentialDocsApi(this._polkadot, () => {})
    this._vault = new Vault({
      confidentialDocsApi: this._confidentialDocsApi,
      ipfs: this._ipfs,
      faucet
    })

    this._ownedData = null
    this._sharedData = null
  }

  /**
   * @desc Logs in the user to the hashed private server
   *
   * @param {String} address of the user account to use
   * @param {String} opts.privateURI the hashed private server endpoint
   * @param {function} opts.signFn async function that receives an address and message as parameters and returns the signed message
   * @throws error in case the login fails
   */
  async login ({
    signer = null,
    ssoProvider = null,
    ssoUserId = null,
    password = null

  }) {
    await this._polkadot.connect()
    await this._vault.unlock({
      signer,
      ssoProvider,
      ssoUserId,
      password
    })
    const params = {
      confidentialDocsApi: this._confidentialDocsApi,
      ipfs: this._ipfs,
      vault: this._vault
    }
    this._ownedData = new OwnedData(params)
    this._sharedData = new SharedData(params)
  }

  /**
   * @desc Logs the user out of the hashed private server
   *
   * @throws error in case the logout fails
   */
  async logout () {
    await this._vault.lock()
    this._ownedData = null
    this._sharedData = null
  }

  /**
   * @desc Indicates whether the user is logged in
   *
   * @return {boolean} whether the user is logged in
   */
  isLoggedIn () {
    return this._vault.isUnlocked()
  }

  /**
   * @desc Returns the ownedData object
   *
   * @return {Object} ownedData object @see OwnedData
   */
  ownedData () {
    this._vault.assertIsUnlocked()
    return this._ownedData
  }

  /**
   * @desc Returns the sharedData object
   *
   * @return {Object} sharedData object @see SharedData
   */
  sharedData () {
    this._vault.assertIsUnlocked()
    return this._sharedData
  }

  address () {
    this._vault.assertIsUnlocked()
    return this._vault.getAddress()
  }
}

module.exports = HashedConfidentialDocs
