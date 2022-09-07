const { PrivateKeyCipher } = require('@smontero/generated-key-cipher-providers')
const { Crypto } = require('@smontero/hashed-crypto')
const BaseJWTVaultAuthProvider = require('./BaseJWTVaultAuthProvider')

const METADATA_FILE_NAME = 'hcd.metadata'
const CURRENT_KEY_NAME = 'currentKey'
const PENDING_KEY_NAME = 'pendingKey'

// Provides the vault auth channel for a user login in using
// sign in with google
class GoogleVaultAuthProvider extends BaseJWTVaultAuthProvider {
  /**
   * @desc Create a GoogleVaultAuthProvider instance
   *
   * @param {String} authName the name to identify this auth channel
   * @param {String} jwt the JSON Web Token
   * @param {Object} decodedJWT the decodedJWT
   * @param {Object} metadataFile the metadata file stored in the users drive
   * @param {boolean} createNew should be used when there is an existing key that wants to be updated
   * @param {Object} googleDrive instance of the google drive service class @see service/GoogleDrive
   *
   * @return {Object}
   */
  constructor ({
    authName,
    jwt,
    decodedJWT,
    metadataFile,
    createNew = false,
    googleDrive
  }) {
    super({
      authName,
      jwt,
      decodedJWT
    })
    this._createNew = createNew
    // this._drive = new GoogleDrive(new Google({ gapi, clientId: googleClientId }))
    this._drive = googleDrive
    this._cipher = _createCipher({
      _this: this,
      file: metadataFile
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
}

/**
   * @desc Create a GoogleVaultAuthProvider instance
   *
   * @param {String} authName the name to identify this auth channel
   * @param {String} jwt the JSON Web Token
   * @param {String} faucetServerUrl the url for the hashed faucet server
   * @param {boolean} createNew should be used when there is an existing key that wants to be updated
   * @param {Object} googleDrive instance of the google drive service class @see service/GoogleDrive
   *
   * @return {GoogleVaultAuthProvider}
   */
async function createGoogleVaultAuthProvider ({
  authName,
  jwt,
  faucetServerUrl,
  googleDrive,
  createNew = false
}) {
  const decodedJWT = await BaseJWTVaultAuthProvider.verifyJWT({
    authName,
    jwt,
    faucetServerUrl
  })

  const metadataFile = await _getMetadataFile({
    createNew,
    googleDrive,
    email: decodedJWT.email
  })

  return new GoogleVaultAuthProvider({
    authName,
    jwt,
    decodedJWT,
    metadataFile,
    googleDrive,
    createNew
  })
}

module.exports = createGoogleVaultAuthProvider

async function _getMetadataFile ({
  createNew,
  googleDrive,
  email
}) {
  await googleDrive.init(email)
  let file = await _fetchMetadataFile(googleDrive)
  if (!file) {
    if (createNew) {
      throw new Error('There is no current key, the createNew parameter should be used when there is an existing key that wants to be updated')
    }
    file = {
      name: METADATA_FILE_NAME,
      parents: ['appDataFolder'],
      appProperties: {}
    }
  }
  const appProperties = file.appProperties
  if (!file.fileId || (createNew && !appProperties[PENDING_KEY_NAME])) {
    appProperties[PENDING_KEY_NAME] = (new Crypto()).generateKeyPair().privateKey
    const op = file.fileId ? 'updateFile' : 'createFile'
    const { id } = await googleDrive[op](file)
    file.fileId = id
  }
  return file
}

async function _fetchMetadataFile (googleDrive) {
  const file = await googleDrive.getFileByName({
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
