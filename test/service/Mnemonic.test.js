
jest.setTimeout(70000)

// global.document = {}
const { BIP32Factory } = require('bip32')
const bip39 = require('bip39')
const ecc = require('tiny-secp256k1')
const btc = require('bitcoinjs-lib')
const xpubConverter = require('xpub-converter')

const bip32 = BIP32Factory(ecc)

describe('Test Mnemonic functionality', () => {
  // test('Generate/Import new Mnemonic', async () => {
  //   const mnemonic1 = new Mnemonic()
  //   expect(Mnemonic.isValid(mnemonic1.toString())).toBe(true)
  //   const mnemonic2 = new Mnemonic(mnemonic1.toString())
  //   expect(Mnemonic.isValid(mnemonic2.toString())).toBe(true)
  //   expect(mnemonic2.toString()).toBe(mnemonic1.toString())
  // })
  // test('Generate XPRIV/XPUB', async () => {
  //   const mnemonic1 = new Mnemonic()
  //   console.log(mnemonic1.xpriv().toString())
  //   console.log(mnemonic1.xpriv().toString())
  //   console.log(mnemonic1.xpriv("m/48'/0'/0'/3'").toString())
  //   console.log(mnemonic1.xpub().toString())
  //   console.log(mnemonic1.xpub().toString())
  //   console.log(mnemonic1.xpub().depth)
  //   console.log(mnemonic1.xpub().fingerPrint.toString('hex'))

  //   console.log(mnemonic1.xpub("m/48'/0'/0'/3'").toString())
  //   const xpriv = mnemonic1.xpriv()
  //   const xpub = xpriv.deriveChild(1).hdPublicKey
  //   console.log(xpub.toString())
  //   console.log('d', xpub.depth)
  //   const xpub2 = xpriv.hdPublicKey.deriveChild(1)
  //   console.log(xpub2.toString())
  //   console.log('d2', xpub.depth)
  //   console.log('d3', mnemonic1.xpub("m/48'/0'/0'/3'").depth)
  //   console.log(mnemonic1.xpub("m/48'/0'/0'/3'").fingerPrint.toString('hex'))
  // })

  // test('Generate/Import new Mnemonic', async () => {
  //   const script = new bitcore.Script('wsh(sortedmulti(2,tpubD9zJG3Z4c9LLBCTeEcq64yFtVtfDHffWspDxKLY3apTbu4ocjFoD4vXz4XV2tfMAEQ8p9Km6CiEHBYqVhhG3qPPEcBZqPnwYuWx9RVmiVLz/0/*,tpubDA5kZcnunRMnATJYbo9ar5CR5zFCs5SsHmP69noNWEFwyhSPnCDmuwUND3qAvsqyBwUtm2BGurKz5nFvACpHkFzwvmupdsbznAFMNypghFB/0/*))#3xvsph9g')
  //   console.log(script.isMultisigOut())
  // })

  test('Generate/Import new Mnemonic', async () => {
    // const mnemonic = bip39.generateMnemonic()
    const mnemonic2 = 'over whip setup elephant program cost absurd around myth twist discover raw'
    console.log(mnemonic2)
    const seed2 = bip39.mnemonicToSeedSync(mnemonic2)
    const nodeMaster2 = bip32.fromSeed(seed2, btc.networks.testnet)
    const nodeMaster2m = bip32.fromSeed(seed2, btc.networks.bitcoin)
    const node2 = nodeMaster2.derivePath("m/48'/0'/0'/2'")
    const node2m = nodeMaster2m.derivePath("m/48'/0'/0'/2'")
    const xpub2 = node2.neutered().toBase58()
    const xpub2m = node2m.neutered().toBase58()
    console.log(node2.toBase58())
    console.log(xpub2)
    console.log(xpub2m)
    console.log(xpubConverter(xpub2, 'Vpub'))
    console.log(xpubConverter(xpub2m, 'Zpub'))
    console.log('fpm2:', nodeMaster2.fingerprint.toString('hex'))
    console.log('fpm2m:', nodeMaster2m.fingerprint.toString('hex'))
    console.log('fp2:', node2.fingerprint.toString('hex'))
    console.log('pfp2:', node2.parentFingerprint)
    const mnemonic = 'lift genius camp follow soccer march either salute wrist warfare wheel smoke'
    console.log(mnemonic)
    expect(bip39.validateMnemonic(mnemonic)).toBe(true)
    const base64seed = bip39.mnemonicToSeedSync(mnemonic).toString('base64')
    console.log(base64seed)
    const seed = bip39.mnemonicToSeedSync(mnemonic)
    const nodeMaster = bip32.fromSeed(seed, btc.networks.testnet)
    const node = nodeMaster.derivePath("m/48'/0'/0'/2'")
    const xpriv = node.toBase58()
    console.log(xpriv)
    const xpub = node.neutered().toBase58()
    console.log('fp1:', node.fingerprint.toString('hex'))
    console.log('fpm:', nodeMaster.fingerprint.toString('hex'))
    console.log(node.depth)
    console.log(node.identifier.toString('hex'))
    console.log(node.index)
    console.log(xpub)
    console.log(xpubConverter(xpub, 'Vpub'))
    console.log('pfpm: ', nodeMaster.parentFingerprint)
    console.log('pfp1: ', node.parentFingerprint)
    console.log('pfp1: ', node.deriveHardened(0).parentFingerprint)
    const psbtText = 'cHNidP8BAH0BAAAAAdXuu3IED9S60Omnf/WHLT+J8qrhpYogZ74/weQP3wYtAAAAAAD9////ApdKAAAAAAAAIgAgVgpgVYN7cpdeGpYqj/SqPJ9xSRC/NfCV1WBN9a6PjcAQJwAAAAAAABYAFN/MoQ/TWYyv1JKSJ8O//Qzl2aeXAAAAAAABAOoCAAAAAAEBpD4rrrXl2igLagnrYYoFg7eHapxeOhJn4FlsvVaF9KAAAAAAAP7///8CMHUAAAAAAAAiACAKskUgXIRuFNk+kXVu0ROvvrP6eoH0mdb/JazQsruP5PiISgAAAAAAFgAUNAY1ixp3MRBepRuRYLdXa6r6jeQCRzBEAiBnLFY6GsOYaE0jOnUPPabL62WJDhuTQgYUB8XOShMdbgIgFoiB4ntE9FEtfUZzlnCMBh91liI1ffBYyCOQwSx+ZWYBIQKRXTNQp5ekscMjVNhM5ya7vCem67bFjmzuByZ33RAGsYdJJAABASswdQAAAAAAACIAIAqyRSBchG4U2T6RdW7RE6++s/p6gfSZ1v8lrNCyu4/kAQVHUiECU2CGOnnwKuB1Yjadth7xInlcMd/A9NjrNDJbXVUdkBchAzL0FNWhnvnH1VRk4m5VNNQg+YlFWeUdEzd7yxHxGyLZUq4iBgJTYIY6efAq4HViNp22HvEieVwx38D02Os0MltdVR2QFxz5zUhcMAAAgAAAAIAAAACAAgAAgAAAAAAAAAAAIgYDMvQU1aGe+cfVVGTiblU01CD5iUVZ5R0TN3vLEfEbItkcqLRVVTAAAIAAAACAAAAAgAIAAIAAAAAAAAAAAAAiAgKXkSekytkdeEL5hKx9yHbmVYxTnwACtpyPIYSoKKn36Bz5zUhcMAAAgAAAAIAAAACAAgAAgAEAAAAAAAAAIgIC+zpfQojN0RQ0AwXD8FhQljskX2TPELmbE5u2tstKXGEcqLRVVTAAAIAAAACAAAAAgAIAAIABAAAAAAAAAAAA'
    const signer1 = btc.Psbt.fromBase64(psbtText)

    const inputs = signer1.data.inputs
    for (const input of inputs) {
      console.log('nonWitnessUTXO: ', input.nonWitnessUtxo)
      console.log('witnessScript: ', input.witnessScript)
      console.log(signer1.data.inputs)
      // console.log('witnessScript: ', btc.script.toStack(input.nonWitnessUtxo))
    }

    const outputs = signer1.data.outputs
    for (const output of outputs) {
      console.log('pubkey: ', output)
    }

    console.log('master finger print: ', signer1.data.inputs[0].bip32Derivation[0].masterFingerprint.toString('hex'))
    console.log('path: ', signer1.data.inputs[0].bip32Derivation[0].path)
    console.log(signer1.inputHasHDKey(0, nodeMaster))
    console.log('version: ', signer1.version)
    // signer1.signInputHD(0, node)
    await signer1.signAllInputsHDAsync(nodeMaster)
    // signer1.signAllInputs(node)
    console.log('signed by signer1: ', signer1.toBase64())
    expect(psbtText).not.toBe(signer1.toBase64())

    const signer2 = btc.Psbt.fromBase64(psbtText)
    signer2.signAllInputsHD(nodeMaster2)
    // signer1.signAllInputs(node)
    console.log('signed by signer2: ', signer2.toBase64())
    expect(psbtText).not.toBe(signer2.toBase64())
    expect(signer1.toBase64()).not.toBe(signer2.toBase64())
  })
})
