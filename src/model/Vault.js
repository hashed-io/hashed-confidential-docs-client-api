const { EventEmitter } = require('events')
const { Keyring } = require('@polkadot/keyring')
const { u8aToHex, u8aWrapBytes } = require('@polkadot/util')
const { blake2AsHex, mnemonicGenerate, signatureVerify } = require('@polkadot/util-crypto')
const { Crypto } = require('@smontero/hashed-crypto')
const { PasswordGeneratedKeyCipher, PrivateKeyCipher, SignatureGeneratedKeyCipher } = require('@smontero/generated-key-cipher-providers')
const { Polkadot } = require('../service')
// const { LocalStorageKey } = require('../const')

const PASSWORD_REGEX = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,}$/
const _keyring = new Keyring()
class Vault extends EventEmitter {
  constructor ({
    polkadot,
    confidentialDocsApi,
    ipfs,
    faucet,
    keyExporter
  }) {
    super()
    this._polkadot = polkadot
    this._confidentialDocsApi = confidentialDocsApi
    this._ipfs = ipfs
    this._faucet = faucet
    this._keyExporter = keyExporter
    this._crypto = new Crypto()
    this._vault = null
    this._wallet = null
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
    this.lock()
    const {
      vault
    } = await _getVault({
      _this: this,
      signer,
      ssoProvider,
      ssoUserId,
      password
    })
    // this._vault = vault
    // console.log('vault: ', vault)
    const {
      privateKey,
      publicKey
    } = vault
    this._docCipher = _createDocCipher({ _this: this, privateKey, publicKey })
  }

  /**
   * Exports the private key used to cipher the vault
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
    await this.assertHasVault({
      ssoProvider,
      ssoUserId
    })
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

  async updatePassword ({
    ssoProvider,
    ssoUserId,
    newPassword,
    oldPassword
  }) {
    // eslint-disable-next-line eqeqeq
    if (oldPassword == newPassword) {
      throw new Error('new password should be different from old')
    }
    await this._updatePassword({
      ssoProvider,
      ssoUserId,
      newPassword,
      oldPassword
    })
  }

  async recoverVault ({
    ssoProvider,
    ssoUserId,
    newPassword,
    privateKey
  }) {
    await this._updatePassword({
      ssoProvider,
      ssoUserId,
      newPassword,
      privateKey
    })
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
    if (!this.isUnlocked()) {
      return
    }
    // this._vault = null
    this._wallet = null
    this._docCipher = null
    this.emit('lock')
    // localStorage.removeItem(LocalStorageKey.VAULT_CONTEXT)
  }

  isUnlocked () {
    return !!this._wallet
  }

  assertIsUnlocked () {
    if (!this.isUnlocked()) {
      throw new Error('The vault is locked')
    }
  }

  async assertHasVault ({
    signer = null,
    ssoProvider = null,
    ssoUserId = null
  }) {
    if (!await this.hasVault({
      signer,
      ssoProvider,
      ssoUserId
    })) {
      throw new Error('The user does not have a vault')
    }
  }

  getWallet () {
    this.assertIsUnlocked()
    return this._wallet
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
    // console.log('publicKey: ', publicKey)
    if (!signer) {
      vault.mnemonic = _generateMnemonic()
      signer = _createKeyPair(vault.mnemonic)
      // TODO: Need a faucet to provide balance to the account so that it can call extrinsics
    }
    _configureWallet(this, signer)
    await this._faucet.send(this.getAddress())
    await this._storeVault({
      userId,
      vault,
      cipher,
      signer
    })
    return {
      vault,
      signer
    }
  }

  async _storeVault ({ userId, vault, cipher }) {
    const cipheredVault = await cipher.cipher({ payload: vault })
    // console.log('cipheredVault1: ', cipheredVault)
    // console.log('signer: ', _getAddress(signer))
    const cid = await this._ipfs.add(cipheredVault)
    await this._confidentialDocsApi.setVault({
      userId,
      publicKey: vault.publicKey,
      cid
    })
  }

  async _updatePassword ({
    ssoProvider,
    ssoUserId,
    newPassword,
    oldPassword = null,
    privateKey = null

  }) {
    await this.assertHasVault({
      ssoProvider,
      ssoUserId
    })
    this.lock()
    const {
      vault,
      userIdBase,
      userId
    } = await _getVault({
      _this: this,
      ssoProvider,
      ssoUserId,
      password: oldPassword,
      privateKey
    })
    const cipher = _getCipher({
      password: _generatePassword({
        password: newPassword,
        userIdBase
      })
    })
    const signer = _createKeyPair(vault.mnemonic)
    await this._storeVault({
      userId,
      vault,
      cipher,
      signer
    })
    this.lock()
  }

  async _decipherVault (vaultDetails, cipher, signer = null) {
    const fullCipheredPayload = await this._ipfs.cat(vaultDetails.cid)
    // console.log('cipheredVault', fullCipheredPayload)
    const vault = await cipher.decipher({ fullCipheredPayload })
    if (!signer) {
      signer = _createKeyPair(vault.mnemonic)
    }
    _configureWallet(this, signer)
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
    return this._wallet.getAddress()
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
  if (!PASSWORD_REGEX.test(password)) {
    throw Error('The password must be at least 8 characters long, and contain at least one lowercase letter, one uppercase letter, one numeric digit, and one special character')
  }
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
  password = null,
  privateKey = null
}) {
  if (signer) {
    return new SignatureGeneratedKeyCipher({
      signFn: async (address, message) => {
      },
      address: _getAddress(signer)
    })
  }
  if (password) {
    return new PasswordGeneratedKeyCipher({
      password
    })
  }
  if (privateKey) {
    return new PrivateKeyCipher({
      privateKey
    })
  }
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
  password = null,
  privateKey = null

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
    password,
    privateKey
  })
  const vaultDetails = await _this._findVault(userId)

  const {
    vault,
    signer: sgnr
  } = vaultDetails
    ? await _this._decipherVault(vaultDetails, cipher, signer)
    : await _this._createVault(userId, cipher, signer)

  return {
    userIdBase,
    userId,
    cipher,
    vault,
    signer: sgnr
  }
}

function _createDocCipher ({
  _this,
  privateKey,
  publicKey
}) {
  _this.once('lock', () => {
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

function _createWallet ({
  _this,
  signer
}) {
  _this.once('lock', () => {
    signer = null
  })
  return {
    async callTx ({
      polkadot,
      palletName,
      extrinsicName,
      params,
      txResponseHandler,
      sudo = false
    }) {
      this.assertIsUnlocked()
      params = params || []
      // console.log('callTx: ', extrinsicName, signer, params)
      let finalSigner = signer
      if (!Polkadot.isKeyringPair(signer)) {
        finalSigner = this.getAddress()
        await polkadot.setWeb3Signer(finalSigner)
      }
      // console.log('callTx params', params)
      let unsub
      // eslint-disable-next-line no-async-promise-executor
      return new Promise(async (resolve, reject) => {
        try {
          const tx = polkadot.tx()
          let call = tx[palletName][extrinsicName](...params)
          if (sudo) {
            call = tx.sudo.sudo(call)
          }
          unsub = await call.signAndSend(finalSigner, (e) => txResponseHandler(e, resolve, reject, unsub))
        } catch (e) {
          reject(e)
        }
      })
    },
    async sign ({ polkadot, payload }) {
      const data = u8aToHex(u8aWrapBytes(payload))
      if (Polkadot.isKeyringPair(signer)) {
        return u8aToHex(signer.sign(data))
      } else {
        const injector = await polkadot._getInjector(signer)
        return injector.signer.signRaw({
          address: signer,
          data,
          type: 'bytes'
        }).signature
      }
    },
    verifySignature ({ payload, signature }) {
      return signatureVerify(payload, signature, this.getAddress())
    },
    getAddress () {
      this.assertIsUnlocked()
      return _getAddress(signer)
    },
    assertIsUnlocked () {
      if (!this.isUnlocked()) {
        throw new Error('Signer is locked')
      }
    },
    isUnlocked () {
      return !!signer
    }
  }
}

function _configureWallet (_this, signer) {
  _this._wallet = _createWallet({ _this, signer })
  _this._polkadot.setWallet(_this._wallet)
}
