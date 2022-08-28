/* eslint-disable no-new */

jest.setTimeout(20000)

global.window = { addEventListener () {} }
// global.document = {}
global.File = class {}
const { hexToU8a, u8aToHex } = require('@polkadot/util')
const { NativeVaultAuthProvider } = require('../../src/model/auth-providers')
const Util = require('../support/Util')
const util = new Util()

let polkadot = null
beforeEach(async () => {
  await util.restartNode()
  polkadot = await util.setupPolkadot()
})

afterEach(async () => {
  await polkadot.disconnect()
  await util.killNode()
})

describe('Test cipher/decipher', () => {
  test('Test cipher/decipher', async () => {
    const keyringPair = util.getKeypair('//Alice')
    console.log('keyringPair', keyringPair)
    const authProvider = new NativeVaultAuthProvider({
      authName: 'native',
      accountMetadata: { address: keyringPair.address, type: 'sr25519' },
      decrypter: getDecrypter(keyringPair)
    })
    const payload = { prop1: 'prop1', prop2: 4 }
    const ciphered = await authProvider.cipher(payload)
    console.log('ciphered:', ciphered)
    const deciphered = await authProvider.decipher(ciphered)
    console.log('deciphered:', deciphered)
    expect(deciphered).toEqual(payload)
  })
})

function getDecrypter (keyringPair) {
  return {
    async decrypt (decryptPayload) {
      const { encrypted } = decryptPayload
      return {
        decrypted: u8aToHex(keyringPair.decrypt(hexToU8a(encrypted)))
      }
    }
  }
}
