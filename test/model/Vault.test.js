
jest.setTimeout(20000)

global.window = { addEventListener () {} }
// global.document = {}
global.File = class {}
const { LocalAccountFaucet, RememberKeyExporter, Vault } = require('../../src/model')
const { BalancesApi, ConfidentialDocsApi } = require('../../src/service')
const Util = require('../support/Util')

let confidentialDocsApi = null
let signer1 = null
let polkadot = null
let vault = null
const keyExporter = new RememberKeyExporter()
const util = new Util()

beforeAll(async () => {
  polkadot = await util.setupPolkadot()
  confidentialDocsApi = new ConfidentialDocsApi(polkadot, () => {})
  const balancesApi = new BalancesApi(polkadot._api, () => {})
  const faucet = new LocalAccountFaucet({
    balancesApi,
    signer: util.getKeypair('//Alice'),
    amount: 1000000000
  })
  vault = new Vault({
    confidentialDocsApi,
    ipfs: util.setupIPFS(),
    faucet,
    keyExporter
  })

  // vault._generateMnemonic = jest.fn()

  // console.log(confidentialDocsApi)
  signer1 = util.getKeypair('//Alice')
  // console.log(signer1.address)
})

afterAll(async () => {
  await polkadot.disconnect()
})

beforeEach(async () => {
  await confidentialDocsApi.killStorage(signer1)
})

describe('vault lock/unlock', () => {
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

describe('Test update password', () => {
  test('vault update password works', async () => {
    const userDetails = util.getSSOUserDetails(1)
    expect(vault.isUnlocked()).toBe(false)
    expect(await vault.hasVault(userDetails)).toBe(false)

    await vault.unlock(userDetails)
    expect(vault.isUnlocked()).toBe(true)
    expect(await vault.hasVault(userDetails)).toBe(true)
    const address = vault.getAddress()
    const newPassword = 'Str15n$g3#2'
    const {
      ssoProvider,
      ssoUserId,
      password: oldPassword
    } = userDetails
    await vault.updatePassword({
      ssoProvider,
      ssoUserId,
      oldPassword,
      newPassword
    })
    const newUserDetails = {
      ...userDetails,
      password: newPassword
    }
    expect(vault.isUnlocked()).toBe(false)
    await vault.unlock(newUserDetails)
    expect(vault.isUnlocked()).toBe(true)
    expect(vault.getAddress()).toBe(address)
  })

  test('vault update password should fail for same password', async () => {
    expect.assertions(1)
    const userDetails = util.getSSOUserDetails(1)
    await vault.unlock(userDetails)
    const {
      ssoProvider,
      ssoUserId,
      password: oldPassword
    } = userDetails

    try {
      await vault.updatePassword({
        ssoProvider,
        ssoUserId,
        oldPassword,
        newPassword: oldPassword
      })
    } catch (err) {
      expect(err.message).toContain('new password should be different from old')
    }
  })

  test('vault update password for user without vault', async () => {
    expect.assertions(1)
    const userDetails = util.getSSOUserDetails(1)
    const {
      ssoProvider,
      ssoUserId,
      password: oldPassword
    } = userDetails
    const newPassword = 'Str15n$g3#2'
    try {
      await vault.updatePassword({
        ssoProvider,
        ssoUserId,
        oldPassword,
        newPassword
      })
    } catch (err) {
      expect(err.message).toContain('The user does not have a vault')
    }
  })
})

describe('recover vault', () => {
  test('recover vault works', async () => {
    const userDetails = util.getSSOUserDetails(1)
    expect(vault.isUnlocked()).toBe(false)
    expect(await vault.hasVault(userDetails)).toBe(false)

    await vault.unlock(userDetails)
    expect(vault.isUnlocked()).toBe(true)
    expect(await vault.hasVault(userDetails)).toBe(true)
    await vault.exportVaultKey(userDetails)
    const address = vault.getAddress()
    const newPassword = 'Str15n$g3#2'
    const {
      ssoProvider,
      ssoUserId
    } = userDetails
    await vault.recoverVault({
      ssoProvider,
      ssoUserId,
      privateKey: keyExporter.key,
      newPassword
    })
    const newUserDetails = {
      ...userDetails,
      password: newPassword
    }
    expect(vault.isUnlocked()).toBe(false)
    await vault.unlock(newUserDetails)
    expect(vault.isUnlocked()).toBe(true)
    expect(vault.getAddress()).toBe(address)
  })

  test('recover vault should fail for user without vault', async () => {
    expect.assertions(1)
    const userDetails = util.getSSOUserDetails(1)
    const {
      ssoProvider,
      ssoUserId
    } = userDetails
    const newPassword = 'Str15n$g3#2'
    try {
      await vault.recoverVault({
        ssoProvider,
        ssoUserId,
        privateKey: '0xb9fdd67adac4f22e06ac3b917d0b49b4dda6938a6e6a37c50c55ab8ae4aa7d06',
        newPassword
      })
    } catch (err) {
      expect(err.message).toContain('The user does not have a vault')
    }
  })
})
