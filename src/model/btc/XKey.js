const { BIP32Factory } = require('bip32')
const bip39 = require('bip39')
const ecc = require('tiny-secp256k1')
const btc = require('bitcoinjs-lib')
const xpubConverter = require('xpub-converter')

const derivationPath = "m/48'/0'/0'/2'"

class XKey {
  static generateMnemonic () {
    return bip39.generateMnemonic()
  }

  constructor ({
    mnemonic = null,
    network
  }) {
    this._mnemonic = mnemonic || XKey.generateMnemonic()
    this._network = network
    const seed = bip39.mnemonicToSeedSync(this._mnemonic)
    const bip32 = BIP32Factory(ecc)
    this._master = bip32.fromSeed(seed, network)
    this._derived = bip32.fromSeed(seed, network).derivePath(derivationPath)
  }

  mnemonic () {
    return this._mnemonic
  }

  master () {
    return this._master
  }

  derived () {
    return this._derived
  }

  fullXPUBMultisig () {
    return this._fullXPUB(this._network === btc.networks.bitcoin ? 'Zpub' : 'Vpub')
  }

  fullXPUB () {
    return this._fullXPUB()
  }

  _fullXPUB (keyFormat) {
    return `[${this._master.fingerprint.toString('hex')}${derivationPath.substring(1)}]${this._xpub(keyFormat)}`
  }

  _xpub (keyFormat) {
    let xpub = this._derived.neutered().toBase58()
    if (keyFormat) {
      xpub = xpubConverter(xpub, keyFormat)
    }
    return xpub
  }
}

module.exports = XKey
