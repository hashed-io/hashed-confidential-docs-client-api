
jest.setTimeout(20000)

global.window = { addEventListener () {} }
// global.document = {}
global.File = class {}
const { LocalAccountFaucet, Vault } = require('../../src/model')
const { BalancesApi, ConfidentialDocsApi } = require('../../src/service')
const Util = require('../support/Util')

let confidentialDocsApi = null
let signer1 = null
let polkadot = null
let vault = null
const util = new Util()

beforeAll(async () => {
  polkadot = await util.setupPolkadot()
  confidentialDocsApi = new ConfidentialDocsApi(polkadot, () => {})
  const balancesApi = new BalancesApi(polkadot, () => {})
  const faucet = new LocalAccountFaucet({
    balancesApi,
    signer: util.getKeypair('//Alice'),
    amount: 100000000
  })
  vault = new Vault({
    confidentialDocsApi,
    ipfs: util.setupIPFS(),
    faucet
  })

  // vault._generateMnemonic = jest.fn()

  // console.log(confidentialDocsApi)
  signer1 = util.getKeypair('//Alice')
  console.log(signer1.address)
})

afterAll(async () => {
  await polkadot.disconnect()
})

beforeEach(async () => {
  await confidentialDocsApi.killStorage(signer1)
})

describe('Test Vault model class', () => {
  // test('vault lock/unlock signature works', async () => {
  //   expect(vault.isUnlocked()).toBe(false)
  //   expect(await vault.hasVault({
  //     signer: signer1
  //   })).toBe(false)

  //   await vault.unlock({
  //     signer: signer1
  //   })
  //   expect(vault.isUnlocked()).toBe(true)
  //   expect(await vault.hasVault({
  //     signer: signer1
  //   })).toBe(true)
  //   expect(vault.getSigner()).toEqual(signer1)
  //   expect(vault.getDocCipher()).toBeInstanceOf(DocCipher)

  //   await vault.lock()
  //   expect(vault.isUnlocked()).toBe(false)
  //   expect(await vault.hasVault({
  //     signer: signer1
  //   })).toBe(true)

  //   await vault.unlock({
  //     signer: signer1
  //   })
  //   expect(vault.isUnlocked()).toBe(true)
  //   expect(await vault.hasVault({
  //     signer: signer1
  //   })).toBe(true)
  //   expect(vault.getSigner()).toEqual(signer1)
  //   expect(vault.getDocCipher()).toBeInstanceOf(DocCipher)
  // })
  test('vault lock/unlock password works', async () => {
    // vault._generateMnemonic.mockReturnValueOnce('//Alice')
    const userDetails = util.getSSOUserDetails(1)
    expect(vault.isUnlocked()).toBe(false)
    expect(await vault.hasVault(userDetails)).toBe(false)

    await vault.unlock(userDetails)
    expect(vault.isUnlocked()).toBe(true)
    expect(await vault.hasVault(userDetails)).toBe(true)
    let docCipher = vault.getDocCipher()
    expect(docCipher.isUnlocked()).toBe(true)
    let signer = vault.getSigner()
    expect(signer.isLocked).toBe(false)
    const signerAddress = vault.getSigner().address

    await vault.lock()
    expect(vault.isUnlocked()).toBe(false)
    expect(docCipher.isUnlocked()).toBe(false)
    expect(signer.isLocked).toBe(true)
    expect(await vault.hasVault(userDetails)).toBe(true)

    await vault.unlock(userDetails)
    expect(vault.isUnlocked()).toBe(true)
    expect(docCipher.isUnlocked()).toBe(false)
    expect(signer.isLocked).toBe(true)
    docCipher = vault.getDocCipher()
    expect(docCipher.isUnlocked()).toBe(true)
    signer = vault.getSigner()
    expect(signer.isLocked).toBe(false)
    expect(await vault.hasVault(userDetails)).toBe(true)
    expect(vault.getSigner().address).toEqual(signerAddress)
  })

  test('vault unlock should fail for invalid user details', async () => {
    expect.assertions(3)
    try {
      const userDetails = {
        ssoUserId: '1232323',
        password: 'Str15n$g3'
      }
      await vault.unlock(userDetails)
    } catch (error) {
      expect(error.message).toContain('if signer is not provided, ssoProvider and ssoUserId must be provided')
    }
    try {
      const userDetails = {
        ssoProvider: 'google',
        password: 'Str15n$g3'
      }
      await vault.unlock(userDetails)
    } catch (error) {
      expect(error.message).toContain('if signer is not provided, ssoProvider and ssoUserId must be provided')
    }
    try {
      const userDetails = {
        ssoProvider: 'google',
        ssoUserId: '1232323',
        password: 'Str1'
      }
      await vault.unlock(userDetails)
    } catch (error) {
      expect(error.message).toContain('The password must be at least 8 characters long, and contain at least one lowercase letter, one uppercase letter, one numeric digit, and one special character')
    }
  })
})
