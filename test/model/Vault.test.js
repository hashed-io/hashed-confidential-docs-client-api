
jest.setTimeout(20000)

global.window = { addEventListener () {} }
// global.document = {}
global.File = class {}
const { LocalAccountFaucet, PasswordVaultAuthProvider, RememberKeyExporter, Vault } = require('../../src/model')
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
    const authProvider = await util.getPasswordVaultAuthProvider(1)
    expect(vault.isUnlocked()).toBe(false)
    expect(await vault.hasVault(authProvider)).toBe(false)

    await vault.unlock(authProvider)
    expect(vault.isUnlocked()).toBe(true)
    expect(await vault.hasVault(authProvider)).toBe(true)
    let docCipher = vault.getDocCipher()
    expect(docCipher.isUnlocked()).toBe(true)
    let wallet = vault.getWallet()
    expect(wallet.isUnlocked()).toBe(true)
    const walletAddress = vault.getAddress()

    await vault.lock()
    expect(vault.isUnlocked()).toBe(false)
    expect(docCipher.isUnlocked()).toBe(false)
    expect(wallet.isUnlocked()).toBe(false)
    expect(await vault.hasVault(authProvider)).toBe(true)

    await vault.unlock(authProvider)
    expect(vault.isUnlocked()).toBe(true)
    expect(docCipher.isUnlocked()).toBe(false)
    expect(wallet.isUnlocked()).toBe(false)
    docCipher = vault.getDocCipher()
    expect(docCipher.isUnlocked()).toBe(true)
    wallet = vault.getWallet()
    expect(wallet.isUnlocked()).toBe(true)
    expect(await vault.hasVault(authProvider)).toBe(true)
    expect(vault.getAddress()).toEqual(walletAddress)
  })
})

describe('sign/verify', () => {
  test('sign/verify works', async () => {
    const authProvider = await util.getPasswordVaultAuthProvider(1)
    await vault.unlock(authProvider)
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
    let authProvider = await util.getPasswordVaultAuthProvider(1)
    await vault.unlock(authProvider)
    expect(vault.isUnlocked()).toBe(true)
    const payload = 'message to sign'
    const signature = await polkadot.sign({ payload })
    authProvider = await util.getPasswordVaultAuthProvider(2)
    await vault.unlock(authProvider)
    const result = polkadot.verifySignature({
      payload,
      signature
    })
    expect(result.isValid).toBe(false)
  })
})

describe('Test update VaultAuthProvider', () => {
  test('vault update VaultAuthProvider works', async () => {
    const authProvider = await util.getPasswordVaultAuthProvider(1)
    expect(vault.isUnlocked()).toBe(false)
    expect(await vault.hasVault(authProvider)).toBe(false)

    await vault.unlock(authProvider)
    expect(vault.isUnlocked()).toBe(true)
    expect(await vault.hasVault(authProvider)).toBe(true)
    const address = vault.getAddress()
    const newPassword = 'Str15n$g3#2'
    const newAuthProvider = new PasswordVaultAuthProvider({
      authName: authProvider.authName,
      userId: authProvider.userId,
      password: newPassword
    })
    await newAuthProvider.init()
    await vault.updateVaultAuthProvider(authProvider, newAuthProvider)
    expect(vault.isUnlocked()).toBe(false)
    await vault.unlock(newAuthProvider)
    expect(vault.isUnlocked()).toBe(true)
    expect(vault.getAddress()).toBe(address)
  })

  test('vault updateVaultAuthProvider should fail for auth providers not refering to same user', async () => {
    expect.assertions(1)
    const authProvider = await util.getPasswordVaultAuthProvider(1)
    const newAuthProvider = await util.getPasswordVaultAuthProvider(2)
    try {
      await vault.updateVaultAuthProvider(authProvider, newAuthProvider)
    } catch (err) {
      expect(err.message).toContain('old and new providers do not refer to the same user')
    }
  })

  test('vault updateVaultAuthProvider should fail for user without vault', async () => {
    expect.assertions(3)
    const authProvider = await util.getPasswordVaultAuthProvider(1)
    expect(vault.isUnlocked()).toBe(false)
    expect(await vault.hasVault(authProvider)).toBe(false)
    const newPassword = 'Str15n$g3#2'
    const newAuthProvider = new PasswordVaultAuthProvider({
      authName: authProvider.authName,
      userId: authProvider.userId,
      password: newPassword
    })
    await newAuthProvider.init()

    try {
      await vault.updateVaultAuthProvider(authProvider, newAuthProvider)
    } catch (err) {
      expect(err.message).toContain('The user does not have a vault')
    }
  })
})
