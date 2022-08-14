const { PrivateKeyCipher } = require('@smontero/generated-key-cipher-providers')
const { Crypto } = require('@smontero/hashed-crypto')
const BaseVaultAuthProvider = require('./BaseVaultAuthProvider')

const METADATA_FILE_NAME = 'hcd.metadata'
const CURRENT_KEY_NAME = 'currentKey'
const PENDING_KEY_NAME = 'pendingKey'
class GoogleVaultAuthProvider extends BaseVaultAuthProvider {
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

  async cipher (vault) {
    return this._cipher.cipher(vault)
  }

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
    async decipher (vault) {
      return cphr.decipher({ fullCipheredPayload: vault })
    },
    async exportKey () {
      return _this._keyExporter.export(cphr.privateKey())
    },
    async onVaultStored () {
      if (isPendingKey) {
        appProperties[CURRENT_KEY_NAME] = appProperties[PENDING_KEY_NAME]
        appProperties[PENDING_KEY_NAME] = null
        return _this._drive.updateFile(file)
      }
    }
  }
}
