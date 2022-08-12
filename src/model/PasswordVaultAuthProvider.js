const { PasswordGeneratedKeyCipher } = require('@smontero/generated-key-cipher-providers')
const BaseVaultAuthProvider = require('./BaseVaultAuthProvider')

const PASSWORD_REGEX = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,}$/

class PasswordVaultAuthProvider extends BaseVaultAuthProvider {
  constructor ({
    authName,
    userId,
    password
  }) {
    super({
      authName,
      userId
    })
    if (!PASSWORD_REGEX.test(password)) {
      throw Error('The password must be at least 8 characters long, and contain at least one lowercase letter, one uppercase letter, one numeric digit, and one special character')
    }
    this._cipher = _createCipher({
      _this: this,
      password
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

module.exports = PasswordVaultAuthProvider

function _createCipher ({
  _this,
  password
}) {
  const cphr = new PasswordGeneratedKeyCipher({
    password: `${password}@${_this.getUserIdBase()}`
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
