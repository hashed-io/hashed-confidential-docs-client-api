
class BaseVaultAuthProvider {
  constructor ({
    authName,
    userId,
    keyExporter
  }) {
    if (!authName) {
      throw new Error('authName parameter is required')
    }
    if (!userId) {
      throw new Error('userId parameter is required')
    }
    this.authName = authName
    this.userId = userId
    this._keyExporter = keyExporter
  }

  /**
   * Returns the base used to generate the user id
   *
   * @returns {string} the user id base
   */
  getUserIdBase () {
    return `${this.authName}-${this.userId}`
  }

  /**
   * Checks whether the user identified by this auth provider is the same as
   * the one identified by the passed in vault auth provider
   *
   * @param {Object} vaultAuthProvider
   *
   * @returns {boolean} whether they refer to the same user
   */
  isSameUser (vaultAuthProvider) {
    return this.authName === vaultAuthProvider.authName && this.userId === vaultAuthProvider.userId
  }

  /**
   * This method should be overridden by "native" VaultAuthProviders such as one
   * using the polkadot wallet, and it should return the singer obj or address of
   * the logged in user, so that a new singer is not created for the user when creating
   * the vault
   *
   * @returns {Signer|string} signer object or address to be use for signing transactions
   */
  getSigner () {
    return null
  }

  /**
   * @desc Initializes this instance, should be called before calling
   * cipher/decipher methods
   */
  async init () {}

  /**
   * This method should be overridden by VaultAuthProviders that require to do some processing
   * after it is confirmed that the vault has been successfully stored
   */
  async onVaultStored () {}

  /**
   * Ciphers the vault
   *
   * @param {Object} vault to cipher
   *
   * @returns {string} hex encoded ciphered vault
   */
  async cipher (vault) {
    throw new Error('Subclass must override the cipher method')
  }

  /**
   * Deciphers vault
   *
   * @param {string} cipheredVault hex encoded ciphered vault
   *
   * @returns {Object} vault
   */
  async decipher (cipheredVault) {
    throw new Error('Subclass must override the decipher method')
  }

  /**
   * Exports the private key used to cipher the vault
   *
   * @throws {Error} if no key exporter is provided
   */
  async exportKey () {
    if (!this._keyExporter) {
      throw new Error('A key exporter must be provided')
    }
    return this._exportKey()
  }

  async _exportKey () {
    throw new Error('Subclass must override the _exportKey method')
  }
}

module.exports = BaseVaultAuthProvider
