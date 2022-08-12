const { PrivateKeyCipher } = require('@smontero/generated-key-cipher-providers')
const BaseVaultAuthProvider = require('./BaseVaultAuthProvider')

class GoogleVaultAuthProvider extends BaseVaultAuthProvider {
  constructor ({
    authName,
    userId
  }) {
    super({
      authName,
      userId
    })

    this._cipher = _createCipher({
      _this: this
    })
  }

  async cipher (vault) {
    return this._cipher.cipher(vault)
  }

  async decipher (cipheredVault) {
    return this._cipher.decipher(cipheredVault)
  }

  async _exportKey () {
    return this._cipher.exportKey()
  }
}

module.exports = GoogleVaultAuthProvider

function _createCipher ({
  _this,
  privateKey
}) {
  const cphr = new PrivateKeyCipher({
    privateKey
  })

  return {
    async cipher (vault) {
      return cphr.cipher({ payload: vault })
    },
    async decipher (vault) {
      return cphr.decipher({ fullCipheredPayload: vault })
    },
    async exportKey () {
      return _this._keyExporter.export(cphr.privateKey())
    }
  }
}
