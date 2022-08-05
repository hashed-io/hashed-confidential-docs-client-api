const { EventEmitter } = require('events')
const { Keyring } = require('@polkadot/keyring')
const { blake2AsHex, mnemonicGenerate } = require('@polkadot/util-crypto')
const { Crypto } = require('@smontero/hashed-crypto')
const { PasswordGeneratedKeyCipher, SignatureGeneratedKeyCipher } = require('@smontero/generated-key-cipher-providers')
const { Polkadot } = require('../service')
// const { LocalStorageKey } = require('../const')

class Vault extends EventEmitter {
  constructor ({
    confidentialDocsApi,
    faucet,
    ipfs
  }) {
    super()
    this._confidentialDocsApi = confidentialDocsApi
    this._faucet = faucet
    this._ipfs = ipfs
    this._crypto = new Crypto()
    this._keyring = new Keyring()
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
    this._assertUserDetails({
      signer,
      ssoProvider,
      ssoUserId
    })
    if (this.isUnlocked()) {
      this.lock()
    }
    const { userIdBase, userId } = this._generateUserId({
      signer,
      ssoProvider,
      ssoUserId
    })
    if (password) {
      password = `${password}@${userIdBase}`
    }
    console.log('password: ', password)
    const cipher = this._getCipher({
      signer,
      password
    })
    const vaultDetails = await this._findVault(userId)

    const {
      vault,
      signer: sgnr
    } = vaultDetails
      ? await this._decipherVault(vaultDetails, cipher, signer)
      : await this._createVault(userId, cipher, signer)

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
    this._assertUserDetails({
      signer,
      ssoProvider,
      ssoUserId
    })
    const { userId } = this._generateUserId({
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
      vault.mnemonic = this._generateMnemonic()
      signer = this._createKeyPair(vault.mnemonic)
      // TODO: Need a faucet to provide balance to the account so that it can call extrinsics
    }
    await this._faucet.send(this._getAddress(signer))
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

  _generateMnemonic () {
    return mnemonicGenerate()
  }

  async _decipherVault (vaultDetails, cipher, signer = null) {
    const fullCipheredPayload = await this._ipfs.cat(vaultDetails.cid)
    console.log('cipheredVault', fullCipheredPayload)
    const vault = await cipher.decipher({ fullCipheredPayload })
    if (!signer) {
      signer = this._createKeyPair(vault.mnemonic)
    }
    return {
      vault,
      signer
    }
  }

  _createKeyPair (mnemonic) {
    return this._keyring.addFromUri(mnemonic, {}, 'sr25519')
  }

  _getCipher ({
    signer = null,
    password = null
  }) {
    return signer
      ? new SignatureGeneratedKeyCipher({
        signFn: async (address, message) => {
          console.log('address', address)
          console.log('message', message)
          let signature = await this._confidentialDocsApi.signMessage(message, address)
          console.log('signature1: ', signature)
          signature = await this._confidentialDocsApi.signMessage(message, address)
          console.log('signature2: ', signature)
          signature = await this._confidentialDocsApi.signMessage(message, address)
          console.log('signature3: ', signature)
          return signature
        },
        address: this.getAddress(signer)
      })
      : new PasswordGeneratedKeyCipher({
        password
      })
  }

  async _hasVault (userId) {
    return !!await this._findVault(userId)
  }

  async _findVault (userId) {
    return this._confidentialDocsApi.findVault(userId)
  }

  _generateUserId ({
    signer = null,
    ssoProvider = null,
    ssoUserId = null
  }) {
    let prefix = ssoProvider
    let suffix = ssoUserId
    if (signer) {
      prefix = 'native'
      suffix = this.getAddress(signer)
    }
    const userIdBase = `${prefix}-${suffix}`
    return {
      userIdBase,
      userId: blake2AsHex(userIdBase)
    }
  }

  getAddress () {
    this.assertIsUnlocked()
    return Polkadot.getAddress(this._signer)
  }

  _getAddress (signer) {
    return Polkadot.getAddress(signer)
  }

  _assertUserDetails ({
    signer,
    ssoProvider,
    ssoUserId
  }) {
    if (signer == null && (ssoProvider == null || ssoUserId == null)) {
      throw new Error('if signer is not provided, ssoProvider and ssoUserId must be provided')
    }
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
