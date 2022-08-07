const { EventEmitter } = require('events')
const { Keyring } = require('@polkadot/keyring')
const { blake2AsHex, mnemonicGenerate } = require('@polkadot/util-crypto')
const { Crypto } = require('@smontero/hashed-crypto')
const { PasswordGeneratedKeyCipher, SignatureGeneratedKeyCipher } = require('@smontero/generated-key-cipher-providers')
const { Polkadot } = require('../service')
// const { LocalStorageKey } = require('../const')

const _keyring = new Keyring()
class Vault extends EventEmitter {
  constructor ({
    confidentialDocsApi,
    ipfs,
    faucet,
    keyExporter
  }) {
    super()
    this._confidentialDocsApi = confidentialDocsApi
    this._ipfs = ipfs
    this._faucet = faucet
    this._keyExporter = keyExporter
    this._crypto = new Crypto()
    this._vault = null
    this._signer = null
    this._docCipher = null
  }

  /**
   * Unlocks the user vault and retrieves the users secret data,
   * if the user has logged in using a polkadot wallet the signer must be provided,
   * if the user has logged in using single sign on the ssoProvider, ssoUserId and password must be provided
   * if a vault does not exist a vault is created
   * @param {Keyring} [signer] the substrate account related signer
   * @param {String} [ssoProvider] the single sign on user id required if using sso
   * @param {String} [ssoUserId] the single sign on user id required if using sso
   * @param {String} [password] the password used to generate the vault cipher key required when
   * using single sign on
   */
  async unlock ({
    signer = null,
    ssoProvider = null,
    ssoUserId = null,
    password = null

  }) {
    if (this.isUnlocked()) {
      this.lock()
    }

    const {
      vault,
      signer: sgnr
    } = await _getVault({
      _this: this,
      signer,
      ssoProvider,
      ssoUserId,
      password
    })
    // this._vault = vault
    // console.log('vault: ', vault)
    this._signer = sgnr
    this._docCipher = this._createDocCipher(vault)

    if (sgnr.lock) {
      this.once('lock', () => {
        sgnr.lock()
      })
    }
  }

  /**
   * Unlocks the user vault and retrieves the users secret data,
   * if the user has logged in using a polkadot wallet the signer must be provided,
   * if the user has logged in using single sign on the ssoProvider, ssoUserId and password must be provided
   * if a vault does not exist a vault is created
   * @param {Keyring} [signer] the substrate account related signer
   * @param {String} [ssoProvider] the single sign on user id required if using sso
   * @param {String} [ssoUserId] the single sign on user id required if using sso
   * @param {String} [password] the password used to generate the vault cipher key required when
   * using single sign on
   */
  async exportVaultKey ({
    ssoProvider,
    ssoUserId,
    password

  }) {
    const {
      cipher
    } = await _getVault({
      _this: this,
      ssoProvider,
      ssoUserId,
      password
    })
    await this._keyExporter.export(cipher.privateKey())
  }

  /**
   * Checks whether the user has a vault
   * if the user has logged in using a polkadot wallet the signer must be provided,
   * if the user has logged in using single sign on the ssoProvider and ssoUserId must be provided
   *
   * @param {Keyring} [signer] the substrate account related signer
   * @param {String} [ssoProvider] the single sign on user id required if using sso
   * @param {String} [ssoUserId] the single sign on user id required if using sso
   *
   * @returns
   */
  async hasVault ({
    signer = null,
    ssoProvider = null,
    ssoUserId = null
  }) {
    _assertUserDetails({
      signer,
      ssoProvider,
      ssoUserId
    })
    const { userId } = _generateUserId({
      signer,
      ssoProvider,
      ssoUserId
    })
    return this._hasVault(userId)
  }

  lock () {
    // this._vault = null
    this._signer = null
    this._docCipher = null
    this.emit('lock')
    // localStorage.removeItem(LocalStorageKey.VAULT_CONTEXT)
  }

  isUnlocked () {
    return !!this._signer
  }

  assertIsUnlocked () {
    if (!this.isUnlocked()) {
      throw new Error('The vault is locked')
    }
  }

  getSigner () {
    this.assertIsUnlocked()
    return this._signer
  }

  getDocCipher () {
    this.assertIsUnlocked()
    return this._docCipher
  }

  async _createVault (userId, cipher, signer = null) {
    const { privateKey, publicKey } = this._crypto.generateKeyPair()
    const vault = {
      privateKey,
      publicKey
    }
    console.log('publicKey: ', publicKey)
    if (!signer) {
      vault.mnemonic = _generateMnemonic()
      signer = _createKeyPair(vault.mnemonic)
      // TODO: Need a faucet to provide balance to the account so that it can call extrinsics
    }
    await this._faucet.send(_getAddress(signer))
    const { rawPayload, type } = await this._crypto.getRawPayload(vault)
    const cipheredVault = await cipher.cipher({ payload: rawPayload, type })
    console.log('cipheredVault1: ', cipheredVault)
    const cid = await this._ipfs.add(cipheredVault)
    await this._confidentialDocsApi.setVault({
      signer,
      userId,
      publicKey,
      cid
    })
    return {
      vault,
      signer
    }
  }

  _createDocCipher ({
    privateKey,
    publicKey
  }) {
    const vault = this
    vault.once('lock', () => {
      privateKey = null
    })
    const crypto = new Crypto()
    return {
      async cipher ({
        payload
      }) {
        this.assertIsUnlocked()
        return crypto.cipher({
          payload,
          privateKey
        })
      },
      async decipher ({
        fullCipheredPayload
      }) {
        this.assertIsUnlocked()
        return crypto.decipher({
          fullCipheredPayload,
          privateKey
        })
      },

      async cipherFor ({
        payload,
        publicKey
      }) {
        this.assertIsUnlocked()
        return crypto.cipherShared({
          payload,
          privateKey,
          publicKey
        })
      },

      async decipherFrom ({
        fullCipheredPayload,
        publicKey
      }) {
        this.assertIsUnlocked()
        return crypto.decipherShared({
          fullCipheredPayload,
          privateKey,
          publicKey
        })
      },
      getPublicKey () {
        this.assertIsUnlocked()
        return publicKey
      },
      assertIsUnlocked () {
        if (!this.isUnlocked()) {
          throw new Error('Document cipher is locked')
        }
      },
      isUnlocked () {
        return !!privateKey
      }
    }
  }

  async _decipherVault (vaultDetails, cipher, signer = null) {
    const fullCipheredPayload = await this._ipfs.cat(vaultDetails.cid)
    console.log('cipheredVault', fullCipheredPayload)
    const vault = await cipher.decipher({ fullCipheredPayload })
    if (!signer) {
      signer = _createKeyPair(vault.mnemonic)
    }
    return {
      vault,
      signer
    }
  }

  async _hasVault (userId) {
    return !!await this._findVault(userId)
  }

  async _findVault (userId) {
    return this._confidentialDocsApi.findVault(userId)
  }

  getAddress () {
    this.assertIsUnlocked()
    return _getAddress(this._signer)
  }

  // _getContext () {
  //   this.assertIsUnlocked()
  //   return this._loadContext()
  // }

  // _loadContext () {
  //   if (!this._vault) {
  //     this._vault = localStorage.getItem(LocalStorageKey.VAULT_CONTEXT)
  //   }
  //   return this._vault
  // }
}

module.exports = Vault

function _getAddress (signer) {
  return Polkadot.getAddress(signer)
}

function _generatePassword ({
  password,
  userIdBase
}) {
  return `${password}@${userIdBase}`
}

function _generateUserId ({
  signer = null,
  ssoProvider = null,
  ssoUserId = null
}) {
  let prefix = ssoProvider
  let suffix = ssoUserId
  if (signer) {
    prefix = 'native'
    suffix = _getAddress(signer)
  }
  const userIdBase = `${prefix}-${suffix}`
  return {
    userIdBase,
    userId: blake2AsHex(userIdBase)
  }
}

function _getCipher ({
  signer = null,
  password = null
}) {
  return signer
    ? new SignatureGeneratedKeyCipher({
      signFn: async (address, message) => {
      },
      address: _getAddress(signer)
    })
    : new PasswordGeneratedKeyCipher({
      password
    })
}

function _createKeyPair (mnemonic) {
  return _keyring.addFromUri(mnemonic, {}, 'sr25519')
}

function _generateMnemonic () {
  return mnemonicGenerate()
}

function _assertUserDetails ({
  signer,
  ssoProvider,
  ssoUserId
}) {
  if (signer == null && (ssoProvider == null || ssoUserId == null)) {
    throw new Error('if signer is not provided, ssoProvider and ssoUserId must be provided')
  }
}

async function _getVault ({
  _this,
  signer = null,
  ssoProvider = null,
  ssoUserId = null,
  password = null

}) {
  _assertUserDetails({
    signer,
    ssoProvider,
    ssoUserId
  })
  const { userIdBase, userId } = _generateUserId({
    signer,
    ssoProvider,
    ssoUserId
  })
  if (password) {
    password = _generatePassword({
      password,
      userIdBase
    })
  }
  const cipher = _getCipher({
    signer,
    password
  })
  const vaultDetails = await _this._findVault(userId)

  const {
    vault,
    signer: sgnr
  } = vaultDetails
    ? await _this._decipherVault(vaultDetails, cipher, signer)
    : await _this._createVault(userId, cipher, signer)

  return {
    cipher,
    vault,
    signer: sgnr
  }
}
