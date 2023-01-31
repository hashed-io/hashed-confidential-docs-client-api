
const btcjs = require('bitcoinjs-lib')
const bip39 = require('bip39')
const { EventEmitter } = require('events')
const { Keyring } = require('@polkadot/keyring')
const { blake2AsHex, mnemonicGenerate } = require('@polkadot/util-crypto')
const { Crypto } = require('@smontero/hashed-crypto')
const { VaultWallet } = require('../model/wallet')
const { createBTC, createXKey } = require('../model/btc')
// const { LocalStorageKey } = require('../const')

const _keyring = new Keyring()
class Vault extends EventEmitter {
  constructor ({
    polkadot,
    confidentialDocsApi,
    ipfs,
    faucet,
    actionConfirmer,
    btcUseTestnet = false
  }) {
    super()
    this._polkadot = polkadot
    this._confidentialDocsApi = confidentialDocsApi
    this._ipfs = ipfs
    this._faucet = faucet
    this._btcUseTestnet = btcUseTestnet
    this._crypto = new Crypto()
    this._vault = null
    this._wallet = null
    this._docCipher = null
    this._btc = null
    this._actionConfirmer = actionConfirmer
  }

  /**
   * Unlocks the user vault and retrieves the users secret data,
   * if a vault does not exist a vault is created
   * @param {Object} vaultAuthProvider the vault auth channel that identifies the user and
   * enables the ciphering/deciphering of the vault @see model/Base
   * @throws error in case the login fails
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
    console.log('vault: ', JSON.stringify(vault, null, 4))
    const {
      privateKey,
      publicKey,
      btcMnemonic
    } = vault
    this._docCipher = _createDocCipher({ _this: this, privateKey, publicKey })
    this._btc = createBTC({
      vault: this,
      xkey: await createXKey({
        mnemonic: btcMnemonic,
        network: this._btcUseTestnet ? btcjs.networks.testnet : btcjs.networks.bitcoin
      })
    })
  }

  /**
   * Updates the vault auth channel user to access the vault
   * ex. this can be used to update the user password
   * @param {Object} oldVaultAuthProvider the current vault auth channel
   * @param {Object} newVaultAuthProvider the new vault auth channel
   */
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

  /**
   * Checks whether the user has a vault
   *
   * @param {Object} vaultAuthProvider the vault auth channel that identifies the user and
   * enables the ciphering/deciphering of the vault @see model/BaseVaultAuthProvider
   *
   * @returns {boolean} whether the user already has a vault
   */
  async hasVault (vaultAuthProvider) {
    return this._hasVault(_generateUserId(vaultAuthProvider))
  }

  /**
   * Locks the vault
   */
  lock () {
    if (!this.isUnlocked()) {
      return
    }
    // this._vault = null
    this._wallet = null
    this._docCipher = null
    this._btc = null
    this.emit('lock')
    // localStorage.removeItem(LocalStorageKey.VAULT_CONTEXT)
  }

  /**
   * Indicates whether the vault is locked
   * @returns {boolean} whether the vault is locked
   */
  isUnlocked () {
    return !!this._wallet
  }

  /**
   * Asserts that the vault is unlocked
   * @throws {Error} if the vault is locked
   */
  assertIsUnlocked () {
    if (!this.isUnlocked()) {
      throw new Error('The vault is locked')
    }
  }

  /**
   * Asserts that the user has a vault
   * @param {Object} vaultAuthProvider the vault auth channel that identifies the user and
   * enables the ciphering/deciphering of the vault @see model/BaseVaultAuthProvider
   * @throws {Error} if the vault is locked
   */
  async assertHasVault (vaultAuthProvider) {
    if (!await this.hasVault(vaultAuthProvider)) {
      throw new Error('The user does not have a vault')
    }
  }

  /**
   * Returns the vault wallet that enables the calling of txs and signing
   * as the vault user
   * @returns {VaultWallet} @see models/wallet/VaultWallet
   * @throws {Error} if the vault is locked
   */
  getWallet () {
    this.assertIsUnlocked()
    return this._wallet
  }

  /**
   * Returns the document cipher that enables the ciphering/deciphering of docs
   * @returns {VaultWallet} @see models/wallet/VaultWallet
   * @throws {Error} if the vault is locked
   */
  getDocCipher () {
    this.assertIsUnlocked()
    return this._docCipher
  }

  /**
   * Returns the btc object that enables btc related actions
   * @returns {BTC} @see models/btc/BTC
   * @throws {Error} if the vault is locked
   */
  getBTC () {
    this.assertIsUnlocked()
    return this._btc
  }

  /**
   * Returns the address of the vault user
   * @returns {string} users address
   * @throws {Error} if the vault is locked
   */
  getAddress () {
    this.assertIsUnlocked()
    return this._wallet.getAddress()
  }

  async _patchVault ({
    userId,
    vaultAuthProvider,
    vault
  }) {
    // console.log('Vault: ', vault)
    let requiresPatching = false
    vault = vault || {}
    if (!vault.privateKey) {
      const { privateKey, publicKey } = this._crypto.generateKeyPair()
      vault = {
        ...vault,
        privateKey,
        publicKey
      }
      requiresPatching = true
    }

    // console.log('publicKey: ', publicKey)
    let signer = vaultAuthProvider.getSigner()
    let shouldFaucetFunds = false
    if (!signer) {
      if (!vault.mnemonic) {
        vault.mnemonic = _generateMnemonic()
        if (!vaultAuthProvider.jwt) {
          throw new Error('Currently the faucet only supports jwt based auth channels')
        }
        requiresPatching = true
        shouldFaucetFunds = true
      }
      signer = _createKeyPair(vault.mnemonic)
    }
    if (!vault.btcMnemonic) {
      vault.btcMnemonic = bip39.generateMnemonic()
      requiresPatching = true
    }
    _configureWallet(this, signer)
    if (shouldFaucetFunds) {
      const {
        jwt,
        authName
      } = vaultAuthProvider
      const signature = await this._polkadot.sign({
        payload: jwt
      })
      await this._faucet.send({
        authName,
        address: this.getAddress(),
        jwt,
        signature
      })
    }

    if (requiresPatching) {
      await this._storeVault({
        userId,
        vault,
        vaultAuthProvider
      })
    }
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
    return vaultAuthProvider.decipher(fullCipheredPayload)
  }

  async _hasVault (userId) {
    return !!await this._findVault(userId)
  }

  async _findVault (userId) {
    return this._confidentialDocsApi.findVault(userId)
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
  let vault = null
  let signer = null
  if (vaultDetails) {
    vault = await _this._decipherVault(vaultDetails, vaultAuthProvider)
  }
  ({
    vault,
    signer
  } = await _this._patchVault({
    vault,
    userId,
    vaultAuthProvider
  }))

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
  vault,
  signer
}) {
  return new VaultWallet({
    vault,
    signer
  })
}

function _configureWallet (_this, signer) {
  _this._wallet = _createWallet({ vault: _this, signer })
  _this._polkadot.setWallet(_this._wallet)
}
