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

  getUserIdBase () {
    return `${this.authName}-${this.userId}`
  }

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

  async init () {}

  async cipher (vault) {
    throw new Error('Subclass must override the cipher method')
  }

  async decipher (cipheredVault) {
    throw new Error('Subclass must override the decipher method')
  }

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
