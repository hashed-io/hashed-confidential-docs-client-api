
jest.setTimeout(20000)

global.window = { addEventListener () {} }
// global.document = {}
global.File = class {}
const { LocalAccountFaucet, RememberKeyExporter, Vault } = require('../../src/model')
const { BalancesApi, ConfidentialDocsApi, Polkadot } = require('../../src/service')
const Util = require('../support/Util')

let confidentialDocsApi = null
let polkadot = null
let vault = null
const keyExporter = new RememberKeyExporter()
const util = new Util()

beforeEach(async () => {
  await util.restartNode()
  polkadot = await util.setupPolkadot()
  confidentialDocsApi = new ConfidentialDocsApi(polkadot, () => {})
  const balancesApi = new BalancesApi(new Polkadot({ api: polkadot._api }), () => {})
  const faucet = new LocalAccountFaucet({
    balancesApi,
    signer: util.getKeypair('//Alice'),
    amount: 1000000000
  })
  vault = new Vault({
    polkadot,
    confidentialDocsApi,
    ipfs: util.setupIPFS(),
    faucet,
    keyExporter
  })

  // vault._generateMnemonic = jest.fn()

  // console.log(confidentialDocsApi)
  // console.log(signer1.address)
})

afterEach(async () => {
  await polkadot.disconnect()
  await util.killNode()
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
  //   expect(vault.getWallet()).toEqual(signer1)
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
  //   expect(vault.getWallet()).toEqual(signer1)
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
    let wallet = vault.getWallet()
    expect(wallet.isUnlocked()).toBe(true)
    const walletAddress = vault.getAddress()

    await vault.lock()
    expect(vault.isUnlocked()).toBe(false)
    expect(docCipher.isUnlocked()).toBe(false)
    expect(wallet.isUnlocked()).toBe(false)
    expect(await vault.hasVault(userDetails)).toBe(true)

    await vault.unlock(userDetails)
    expect(vault.isUnlocked()).toBe(true)
    expect(docCipher.isUnlocked()).toBe(false)
    expect(wallet.isUnlocked()).toBe(false)
    docCipher = vault.getDocCipher()
    expect(docCipher.isUnlocked()).toBe(true)
    wallet = vault.getWallet()
    expect(wallet.isUnlocked()).toBe(true)
    expect(await vault.hasVault(userDetails)).toBe(true)
    expect(vault.getAddress()).toEqual(walletAddress)
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

describe('sign/verify', () => {
  test('sign/verify works', async () => {
    const userDetails = util.getSSOUserDetails(1)
    await vault.unlock(userDetails)
    expect(vault.isUnlocked()).toBe(true)
    let payload = 'message to sign'
    let signature = await polkadot.sign({ payload })
    let result = polkadot.verifySignature({
      payload,
      signature
    })
    expect(result.isValid).toBe(true)
    payload = { s1: 'message to sign', i1: 1 }
    signature = await polkadot.sign({ payload })
    result = polkadot.verifySignature({
      payload,
      signature
    })
    expect(result.isValid).toBe(true)
  })

  test('sign/verify should fail for non signer', async () => {
    let userDetails = util.getSSOUserDetails(1)
    await vault.unlock(userDetails)
    expect(vault.isUnlocked()).toBe(true)
    const payload = 'message to sign'
    const signature = await polkadot.sign({ payload })
    userDetails = util.getSSOUserDetails(2)
    await vault.unlock(userDetails)
    const result = polkadot.verifySignature({
      payload,
      signature
    })
    expect(result.isValid).toBe(false)
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
