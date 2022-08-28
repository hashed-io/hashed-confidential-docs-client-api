const { Keyring } = require('@polkadot/keyring')
const { hexToU8a, u8aToHex, stringToU8a, hexToString } = require('@polkadot/util')
const { decodeAddress } = require('@polkadot/util-crypto')
const BaseVaultAuthProvider = require('./BaseVaultAuthProvider')

// Provides the vault auth provider for a user native wallet
class NativeVaultAuthProvider extends BaseVaultAuthProvider {
  /**
   * @desc Create a NativeVaultAuthProvider instance
   *
   * @param {String} authName the name to identify this auth provider
   * @param {String} address the users ss-58 encoded address
   * @param {InjectedDecrypter} decrypter the wallet extension provided decrypter
   *
   * @return {Object}
   */
  constructor ({
    authName,
    accountMetadata,
    decrypter
  }) {
    super({
      authName,
      userId: accountMetadata.address
    })
    this._accountMetadata = accountMetadata
    this._decrypter = decrypter
  }

  /**
   * Ciphers the vault
   *
   * @param {Object} vault to cipher
   *
   * @returns {object} hex encoded ciphered vault
   */
  async cipher (vault) {
    const payload = stringToU8a(JSON.stringify(vault))
    return u8aToHex(new Keyring().encrypt(payload, this.getPublicKey(this._accountMetadata.address), this._accountMetadata.type))
  }

  /**
   * Deciphers vault
   *
   * @param {string} cipheredVault hex encoded ciphered vault
   *
   * @returns {Object} vault
   */
  async decipher (cipheredVault) {
    console.log('u8a payload', hexToU8a(cipheredVault))
    const {
      decrypted
    } = await this._decrypter.decrypt({ address: this._accountMetadata.address, encrypted: cipheredVault })
    return JSON.parse(hexToString(decrypted))
  }

  getPublicKey (address) {
    const pubKey = decodeAddress(address)
    return u8aToHex(pubKey)
  }
}

module.exports = NativeVaultAuthProvider
