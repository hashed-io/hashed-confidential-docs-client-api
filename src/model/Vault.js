const { EventEmitter } = require('events')
const { Keyring } = require('@polkadot/keyring')
const { u8aToHex, u8aWrapBytes } = require('@polkadot/util')
const { blake2AsHex, mnemonicGenerate, signatureVerify } = require('@polkadot/util-crypto')
const { Crypto } = require('@smontero/hashed-crypto')
const { Polkadot } = require('../service')
// const { LocalStorageKey } = require('../const')

const _keyring = new Keyring()
class Vault extends EventEmitter {
  constructor ({
    polkadot,
    confidentialDocsApi,
    ipfs,
    faucet,
    actionConfirmer
  }) {
    super()
    this._polkadot = polkadot
    this._confidentialDocsApi = confidentialDocsApi
    this._ipfs = ipfs
    this._faucet = faucet
    this._crypto = new Crypto()
    this._vault = null
    this._wallet = null
    this._docCipher = null
    this._actionConfirmer = actionConfirmer
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
  async unlock (vaultAuthProvider) {
    this.lock()
    const {
      vault
    } = await _getVault({
      _this: this,
      vaultAuthProvider
    })
    // this._vault = vault
    // console.log('vault: ', vault)
    const {
      privateKey,
      publicKey
    } = vault
    this._docCipher = _createDocCipher({ _this: this, privateKey, publicKey })
  }

  async updateVaultAuthProvider (oldVaultAuthProvider, newVaultAuthProvider) {
    if (!oldVaultAuthProvider.isSameUser(newVaultAuthProvider)) {
      throw new Error('old and new providers do not refer to the same user')
    }
    await this.assertHasVault(oldVaultAuthProvider)
    this.lock()
    const {
      vault,
      userId
    } = await _getVault({
      _this: this,
      vaultAuthProvider: oldVaultAuthProvider
    })
    await this._storeVault({
      userId,
      vault,
      vaultAuthProvider: newVaultAuthProvider
    })
    this.lock()
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
  async hasVault (vaultAuthProvider) {
    return this._hasVault(_generateUserId(vaultAuthProvider))
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

  async assertHasVault (vaultAuthProvider) {
    if (!await this.hasVault(vaultAuthProvider)) {
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

  async _createVault (userId, vaultAuthProvider) {
    const { privateKey, publicKey } = this._crypto.generateKeyPair()
    const vault = {
      privateKey,
      publicKey
    }
    // console.log('publicKey: ', publicKey)
    let signer = vaultAuthProvider.getSigner()
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
      vaultAuthProvider
    })
    return {
      vault,
      signer
    }
  }

  async _storeVault ({ userId, vault, vaultAuthProvider }) {
    const cipheredVault = await vaultAuthProvider.cipher(vault)
    // console.log('cipheredVault1: ', cipheredVault)
    // console.log('signer: ', _getAddress(signer))
    const cid = await this._ipfs.add(cipheredVault)
    await this._confidentialDocsApi.setVault({
      userId,
      publicKey: vault.publicKey,
      cid
    })
    await vaultAuthProvider.onVaultStored()
  }

  async _decipherVault (vaultDetails, vaultAuthProvider) {
    const fullCipheredPayload = await this._ipfs.cat(vaultDetails.cid)
    // console.log('cipheredVault', fullCipheredPayload)
    const vault = await vaultAuthProvider.decipher(fullCipheredPayload)
    let signer = vaultAuthProvider.getSigner()
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

function _generateUserId (vaultAuthProvider) {
  return blake2AsHex(vaultAuthProvider.getUserIdBase())
}

function _createKeyPair (mnemonic) {
  return _keyring.addFromUri(mnemonic, {}, 'sr25519')
}

function _generateMnemonic () {
  return mnemonicGenerate()
}

async function _getVault ({
  _this,
  vaultAuthProvider
}) {
  const userId = _generateUserId(vaultAuthProvider)
  const vaultDetails = await _this._findVault(userId)

  const {
    vault,
    signer
  } = vaultDetails
    ? await _this._decipherVault(vaultDetails, vaultAuthProvider)
    : await _this._createVault(userId, vaultAuthProvider)

  return {
    userId,
    vault,
    signer
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

      return new Promise((resolve, reject) => {
        const onConfirm = async () => {
          try {
            const result = await _callTx({
              _this: this,
              polkadot,
              palletName,
              extrinsicName,
              signer,
              params,
              txResponseHandler,
              sudo
            })
            resolve(result)
          } catch (error) {
            reject(error)
          }
        }
        const onCancel = (reason) => {
          reject(new Error(reason))
        }
        _this._actionConfirmer.confirm({
          palletName,
          extrinsicName,
          params,
          address: this.getAddress()
        },
        onConfirm,
        onCancel
        )
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

async function _callTx ({
  _this,
  polkadot,
  palletName,
  extrinsicName,
  signer,
  params,
  txResponseHandler,
  sudo = false
}) {
  _this.assertIsUnlocked()
  params = params || []
  // console.log('callTx: ', extrinsicName, signer, params)
  let finalSigner = signer
  if (!Polkadot.isKeyringPair(signer)) {
    finalSigner = _this.getAddress()
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
}

function _configureWallet (_this, signer) {
  _this._wallet = _createWallet({ _this, signer })
  _this._polkadot.setWallet(_this._wallet)
}
