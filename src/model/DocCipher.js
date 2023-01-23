const { Crypto } = require('@smontero/hashed-crypto')

class DocCipher {
  /**
   * @desc Create document cipher instance
   *
   * @param {Vault} vault class
   * @param {Group} group class
   */
  constructor ({
    vault,
    group
  }) {
    this._vault = vault
    this._group = group
    this._crypto = new Crypto()
    this._ciphers = {}
    vault.once('lock', () => {
      this._defaultCipher = null
      this._ciphers = {}
    })
  }

  async cipher ({
    payload,
    actorAddress = null
  }) {
    const cipher = await this._getCipher(actorAddress)
    return cipher.cipher({
      payload
    })
  }

  async decipher ({
    fullCipheredPayload,
    actorAddress = null
  }) {
    const cipher = await this._getCipher(actorAddress)
    return cipher.decipher({
      fullCipheredPayload
    })
  }

  async cipherFor ({
    payload,
    publicKey,
    actorAddress = null
  }) {
    const cipher = await this._getCipher(actorAddress)
    return cipher.cipherFor({
      payload,
      publicKey
    })
  }

  async decipherFrom ({
    fullCipheredPayload,
    publicKey,
    actorAddress = null
  }) {
    const cipher = await this._getCipher(actorAddress)
    return cipher.decipherFrom({
      fullCipheredPayload,
      publicKey
    })
  }

  isUnlocked () {
    return this._defaultCipher != null
  }

  /**
   * @desc Sets the default cipher
   *
   * @param {String} address of the user account
   * @param {String} publicKey of the cipher key pair
   * @param {String} privateKey of the cipher key pair
   */
  setDefaultCipher ({
    address,
    publicKey,
    privateKey
  }) {
    this._ciphers = {}
    this._defaultCipher = this._setCipher({
      address,
      publicKey,
      privateKey
    })
  }

  async _getCipher (groupAddress) {
    await this._vault.assertIsUnlocked()
    if (!groupAddress) {
      return this._defaultCipher
    }
    if (!this.hasCipher(groupAddress)) {
      const groupMember = await this._group.getGroupMemberWithPayload(groupAddress, this._vault.getAddress())
      const payload = await this._cipher().decipherFrom({
        fullCipheredPayload: groupMember.cipheredPayload,
        publicKey: groupMember.authorizerPublicKey
      })
      this._setCipher({
        groupAddress,
        ...payload
      })
    }
    return this._ciphers[groupAddress]
  }

  generateKeyPair () {
    return this._crypto.generateKeyPair()
  }

  hasCipher (address) {
    return !!this._ciphers[address]
  }

  _setCipher ({
    address,
    publicKey,
    privateKey
  }) {
    const cipher = createCipher({
      publicKey,
      privateKey,
      vault: this._vault,
      crypto: this._crypto
    })
    this._ciphers[address] = cipher
    return cipher
  }
}

function createCipher ({
  privateKey,
  publicKey,
  vault,
  crypto
}) {
  vault.once('lock', () => {
    privateKey = null
  })
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

module.exports = DocCipher
