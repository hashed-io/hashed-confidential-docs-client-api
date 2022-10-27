
jest.setTimeout(70000)

const bip39 = require('bip39')
const btc = require('bitcoinjs-lib')

const { XKey } = require('../../../src/model/btc')

describe('Test XKey functionality', () => {
  test('Generate/Import new XKey', async () => {
    assertKeyGenerationAndImport(btc.networks.bitcoin)
    assertKeyGenerationAndImport(btc.networks.testnet)
  })

  test('FullXPUB format', async () => {
    const mnemonic = 'over whip setup elephant program cost absurd around myth twist discover raw'
    const xkeyMainnet = new XKey({
      mnemonic,
      network: btc.networks.bitcoin
    })
    expect(xkeyMainnet.fullXPUB()).toBe("[f9cd485c/48'/0'/0'/2']xpub6EuYgeFXgUgqpRVE63ooLBMKAAo2N1GV8ocLqU3hVhFWx3oy4RNwJxmTLZRD64iMjcG7t7X4aca2tgsv4s2hP7i1uE2Z3ki4Bp8tXyZoCNG")
    expect(xkeyMainnet.fullXPUBMultisig()).toBe("[f9cd485c/48'/0'/0'/2']Zpub75UARDKoYoLAwb2qhRr2aRt8Du8BTbw5HJJTKX71dUqggS1LL96LeCwfBgHreKF6nMZiFeiJP9fdnRiooV1g85BtUNXocyp2czY3u4UEyNR")

    const xkeyTestnet = new XKey({
      mnemonic,
      network: btc.networks.testnet
    })
    expect(xkeyTestnet.fullXPUB()).toBe("[f9cd485c/48'/0'/0'/2']tpubDFHBCt5DPkeJ6Dg5YEntY6ggVHtgMPmYgSCeC26qqc1QhLUg8eE2TQSHabVzcZfbXWo2Vh2w7iQ5asNXTiswGZAJxpmrjHNHmmjJHu85dzs")
    expect(xkeyTestnet.fullXPUBMultisig()).toBe("[f9cd485c/48'/0'/0'/2']Vpub5n97CYe8x5AFYQGNMzhXk5W7Y2YPh7y5crDaBwXU7TLAU2kRKWS69xK76rTWegdR9o6VFkL4YWFSFHGYvhMcw8TV11k7HLY5Y6HULk4e5Qm")
  })
})

function assertKeyGenerationAndImport (network) {
  const xkey1 = new XKey({ network })
  expect(bip39.validateMnemonic(xkey1.mnemonic())).toBe(true)
  const xkey2 = new XKey({ mnemonic: xkey1.mnemonic(), network })
  expect(bip39.validateMnemonic(xkey2.mnemonic())).toBe(true)
  expect(xkey1.mnemonic()).toBe(xkey2.mnemonic())
  expect(xkey1.fullXPUBMultisig()).toBe(xkey2.fullXPUBMultisig())
  expect(xkey1.fullXPUB()).toBe(xkey2.fullXPUB())
}
