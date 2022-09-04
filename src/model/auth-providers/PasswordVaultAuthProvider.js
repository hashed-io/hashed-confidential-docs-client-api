const { PasswordGeneratedKeyCipher } = require('@smontero/generated-key-cipher-providers')
const BaseJWTVaultAuthProvider = require('./BaseJWTVaultAuthProvider')

const PASSWORD_REGEX = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,}$/

// Provides the vault auth channel for a user login in using
// username and password
class PasswordVaultAuthProvider extends BaseJWTVaultAuthProvider {
  /**
   * @desc Create a PasswordVaultAuthProvider instance
   *
   * @param {String} authName the name to identify this auth channel
   * @param {String} jwt the JSON Web Token
   * @param {Object} decodedJWT the decodedJWT
   * @param {String} password
   *
   * @return {Object}
   */
  constructor ({
    authName,
    jwt,
    decodedJWT,
    password
  }) {
    super({
      authName,
      jwt,
      decodedJWT
    })
    if (!PASSWORD_REGEX.test(password)) {
      throw Error('The password must be at least 8 characters long, and contain at least one lowercase letter, one uppercase letter, one numeric digit, and one special character')
    }
    this._cipher = _createCipher({
      _this: this,
      password
    })
  }

  /**
   * Ciphers the vault
   *
   * @param {Object} vault to cipher
   *
   * @returns {string} hex encoded ciphered vault
   */
  async cipher (vault) {
    return this._cipher.cipher(vault)
  }

  /**
   * Deciphers vault
   *
   * @param {string} cipheredVault hex encoded ciphered vault
   *
   * @returns {Object} vault
   */
  async decipher (cipheredVault) {
    return this._cipher.decipher(cipheredVault)
  }

  async _exportKey () {
    return this._cipher.exportKey()
  }
}

/**
   * @desc Create a PasswordVaultAuthProvider instance
   *
   * @param {String} authName the name to identify this auth channel
   * @param {String} jwt the JSON Web Token
   * @param {String} faucetServerUrl the url for the hashed faucet server
   * @param {String} password
   *
   * @return {PasswordVaultAuthProvider}
   */
async function createPasswordVaultAuthProvider ({
  authName,
  jwt,
  faucetServerUrl,
  password
}) {
  const decodedJWT = await BaseJWTVaultAuthProvider.verifyJWT({
    authName,
    jwt,
    faucetServerUrl
  })
  return new PasswordVaultAuthProvider({
    authName,
    jwt,
    decodedJWT,
    password
  })
}

module.exports = createPasswordVaultAuthProvider

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
