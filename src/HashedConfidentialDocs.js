const { ModalActionConfirmer } = require('./model/action-confirmer')
const { DocCipher, Group, OwnedData, SharedData, Vault } = require('./model')
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
   * @param {boolean} btcUseTestnet whether the bitcoin testnet should be used
   *
   * @return {Object} instance of hashed confidential docs
   */
  constructor ({
    ipfsURL,
    ipfsAuthHeader,
    polkadot,
    faucet,
    btcUseTestnet = false,
    actionConfirmer = null
  }) {
    actionConfirmer = actionConfirmer || new ModalActionConfirmer()
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
      actionConfirmer,
      btcUseTestnet
    })
    this._group = new Group({
      confidentialDocsApi: this._confidentialDocsApi,
      ipfs: this._ipfs,
      vault: this._vault
    })
    const docCipher = new DocCipher({
      vault: this._vault,
      group: this._group
    })
    this._vault.setDocCipher(docCipher)
    this._ownedData = null
    this._sharedData = null
  }

  /**
   * @desc Logs in the user to hashed confidential docs
   * @param {Object} vaultAuthProvider the vault auth channel that identifies the user and
   * enables the ciphering/deciphering of the vault @see model/Base
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
   * @desc Returns the group object
   *
   * @return {Object} group object @see Group
   */
  group () {
    this._vault.assertIsUnlocked()
    return this._group
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

  /**
   * Returns the btc object that enables btc related actions
   * @returns {BTC} @see models/btc/BTC
   * @throws {Error} if the vault is locked
   */
  btc () {
    this._vault.assertIsUnlocked()
    return this.vault().getBTC()
  }
}

module.exports = HashedConfidentialDocs
