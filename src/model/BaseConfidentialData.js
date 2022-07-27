
/**
 * Provides the functionality for managing own's user private data
 */
class BaseConfidentialData {
  constructor ({
    confidentialDocsApi,
    ipfs,
    vault
  }) {
    this._confidentialDocsApi = confidentialDocsApi
    this._ipfs = ipfs
    this._vault = vault
  }

  _cipher () {
    return this._vault.getDocCipher()
  }

  _signer () {
    return this._vault.getSigner()
  }

  _address () {
    return this._vault.getAddress()
  }

  _api () {
    return this._confidentialDocsApi
  }
}

module.exports = BaseConfidentialData
