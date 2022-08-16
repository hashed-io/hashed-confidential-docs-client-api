const { PrivateKeyCipher } = require('@smontero/generated-key-cipher-providers')
const { Crypto } = require('@smontero/hashed-crypto')
const BaseVaultAuthProvider = require('./BaseVaultAuthProvider')

const METADATA_FILE_NAME = 'hcd.metadata'
const CURRENT_KEY_NAME = 'currentKey'
const PENDING_KEY_NAME = 'pendingKey'

// Provides the vault auth provider for a user login in using
// sign in with google
class GoogleVaultAuthProvider extends BaseVaultAuthProvider {
  /**
   * @desc Create a GoogleVaultAuthProvider instance
   *
   * @param {String} authName the name to identify this auth provider
   * @param {String} userId the google user id
   * @param {String} email the users email
   * @param {boolean} createNew should be used when there is an existing key that wants to be updated
   * @param {Object} googleDrive instance of the google drive service class @see service/GoogleDrive
   *
   * @return {Object}
   */
  constructor ({
    authName,
    userId,
    email,
    createNew = false,
    googleDrive
  }) {
    super({
      authName,
      userId
    })
    this._createNew = createNew
    this._email = email
    // this._drive = new GoogleDrive(new Google({ gapi, clientId: googleClientId }))
    this._drive = googleDrive
    this._cipher = null
  }

  /**
   * @desc Initializes this instance, should be called before calling
   * cipher/decipher methods
   */
  async init () {
    await this._drive.init(this._email)
    let file = await this._getMetadataFile()
    if (!file) {
      if (this._createNew) {
        throw new Error('There is no current key, the createNew parameter should be used when there is an existing key that wants to be updated')
      }
      file = {
        name: METADATA_FILE_NAME,
        parents: ['appDataFolder'],
        appProperties: {}
      }
    }
    const appProperties = file.appProperties
    if (!file.fileId || (this._createNew && !appProperties[PENDING_KEY_NAME])) {
      appProperties[PENDING_KEY_NAME] = (new Crypto()).generateKeyPair().privateKey
      const op = file.fileId ? 'updateFile' : 'createFile'
      const { id } = await this._drive[op](file)
      file.fileId = id
    }
    this._cipher = _createCipher({
      _this: this,
      file
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

  async onVaultStored () {
    return this._cipher.onVaultStored()
  }

  async _exportKey () {
    return this._cipher.exportKey()
  }

  async _getMetadataFile () {
    const file = await this._drive.getFileByName({
      name: METADATA_FILE_NAME,
      fields: 'id, appProperties',
      spaces: 'appDataFolder'
    })
    if (file) {
      file.fileId = file.id
      delete file.id
    }
    return file
  }
}

module.exports = GoogleVaultAuthProvider

function _createCipher ({
  _this,
  file
}) {
  const {
    appProperties
  } = file
  const isPendingKey = !appProperties[CURRENT_KEY_NAME] || _this._createNew
  const privateKey = isPendingKey ? appProperties[PENDING_KEY_NAME] : appProperties[CURRENT_KEY_NAME]
  const cphr = new PrivateKeyCipher({
    privateKey
  })

  return {
    async cipher (vault) {
      return cphr.cipher({ payload: vault })
    },
    async decipher (cipheredVault) {
      const vault = await cphr.decipher({ fullCipheredPayload: cipheredVault })
      await this._confirmKey()
      return vault
    },
    async exportKey () {
      return _this._keyExporter.export(cphr.privateKey())
    },
    async onVaultStored () {
      return this._confirmKey()
    },
    async _confirmKey () {
      if (isPendingKey) {
        appProperties[CURRENT_KEY_NAME] = appProperties[PENDING_KEY_NAME]
        appProperties[PENDING_KEY_NAME] = null
        return _this._drive.updateFile(file)
      }
    }
  }
}
