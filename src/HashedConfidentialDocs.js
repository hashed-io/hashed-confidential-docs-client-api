const { BrowserDownloadKeyExporter, OwnedData, SharedData, Vault } = require('./model')
const { ConfidentialDocsApi, IPFS } = require('./service')

/**
 * Provides access to all the hashed confidential docs functionality
 */
class HashedConfidentialDocs {
  /**
   * @desc Create a hashed confidential docs instance
   *
   * @param {String} ipfsURL the ipfs endpoint to use
   * @param {String} [opts.ipfsAuthHeader] the ipfs authentication header if required
   * @param {Object} polkadot An instance of the polkadot class @see service/Polkadot
   * @param {Object} faucet faucet instance object to use to fund newly created accounts @see model/BaseFaucet
   *
   * @return {Object} instance of hashed confidential docs
   */
  constructor ({
    ipfsURL,
    ipfsAuthHeader,
    polkadot,
    faucet
  }) {
    this._ipfs = new IPFS({
      url: ipfsURL,
      authHeader: ipfsAuthHeader
    })
    this._polkadot = polkadot
    this._confidentialDocsApi = new ConfidentialDocsApi(this._polkadot, () => {})
    this._vault = new Vault({
      polkadot,
      confidentialDocsApi: this._confidentialDocsApi,
      ipfs: this._ipfs,
      faucet,
      keyExporter: new BrowserDownloadKeyExporter()
    })

    this._ownedData = null
    this._sharedData = null
  }

  /**
   * @desc Logs in the user to hashed confidential docs
   * if the user has logged in using a polkadot wallet the signer must be provided,
   * if the user has logged in using single sign on the ssoProvider, ssoUserId and password must be provided
   *
   * @param {Keyring} [signer] the substrate account related signer
   * @param {String} [ssoProvider] the single sign on user id required if using sso
   * @param {String} [ssoUserId] the single sign on user id required if using sso
   * @param {String} [password] the password used to generate the vault cipher key required when
   * using single sign on
   * @throws error in case the login fails
   */
  async login (vaultAuthProvider) {
    await this._polkadot.connect()
    await this.logout()
    await this._vault.unlock(vaultAuthProvider)
    const params = {
      confidentialDocsApi: this._confidentialDocsApi,
      ipfs: this._ipfs,
      vault: this._vault
    }
    this._ownedData = new OwnedData(params)
    this._sharedData = new SharedData(params)
  }

  /**
   * @desc Logs the user out of hashed confidential docs
   *
   * @throws error in case the logout fails
   */
  async logout () {
    if (this.isLoggedIn()) {
      await this._vault.lock()
    }
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

  /**
   * @desc Returns the address of the logged in user
   *
   * @return {String} logged in user's address
   */
  address () {
    this._vault.assertIsUnlocked()
    return this._vault.getAddress()
  }

  /**
   * @desc Returns the vault instance
   *
   * @return {Object} vault
   */
  vault () {
    return this._vault
  }
}

module.exports = HashedConfidentialDocs
