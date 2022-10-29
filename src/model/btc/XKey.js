const { BIP32Factory } = require('bip32')
const bip39 = require('bip39')
const secp256k1 = require('tiny-secp256k1')
const btc = require('bitcoinjs-lib')
const xpubConverter = require('xpub-converter')

const derivationPath = "m/48'/0'/0'/2'"

class XKey {
  constructor ({
    mnemonic = null,
    network,
    ecc
  }) {
    this._mnemonic = mnemonic || bip39.generateMnemonic()
    this.network = network
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
    return this._fullXPUB(this.network === btc.networks.bitcoin ? 'Zpub' : 'Vpub')
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

async function createXKey ({
  mnemonic = null,
  network
}) {
  const ecc = await secp256k1
  return new XKey({
    mnemonic,
    network,
    ecc
  })
}

module.exports = createXKey
