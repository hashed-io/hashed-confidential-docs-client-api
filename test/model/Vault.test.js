
jest.setTimeout(70000)

global.window = { addEventListener () {} }
// global.document = {}
global.File = class {}
const { ActionType } = require('../../src/const')
const { LocalAccountFaucet } = require('../../src/model/faucet')
const { Vault, DocCipher, Group } = require('../../src/model')
const { RememberExporter } = require('../../src/model/exporter')
const { PredefinedActionConfirmer } = require('../../src/model/action-confirmer')
const { BalancesApi, ConfidentialDocsApi, Polkadot } = require('../../src/service')
const Util = require('../support/Util')

let confidentialDocsApi = null
let polkadot = null
let vault = null
let faucet = null
const actionConfirmer = new PredefinedActionConfirmer()
const util = new Util()
beforeEach(async () => {
  await util.restartNode()
  polkadot = await util.setupPolkadot()
  confidentialDocsApi = new ConfidentialDocsApi(polkadot, () => {})
  const balancesApi = new BalancesApi(new Polkadot({ api: polkadot._api }), () => {})
  faucet = new LocalAccountFaucet({
    balancesApi,
    signer: util.getKeypair('//Alice'),
    amount: 1000000000
  })
  const ipfs = util.setupIPFS()
  vault = new Vault({
    polkadot,
    confidentialDocsApi,
    ipfs,
    faucet,
    actionConfirmer
  })
  const group = new Group({
    confidentialDocsApi,
    ipfs,
    vault
  })
  const docCipher = new DocCipher({
    vault,
    group
  })
  vault.setDocCipher(docCipher)

  // vault._generateMnemonic = jest.fn()

  // console.log(confidentialDocsApi)
  // console.log(signer1.address)
})

afterEach(async () => {
  await polkadot.disconnect()
  await util.killNode()
})

describe('vault lock/unlock', () => {
  test('vault lock/unlock password works', async () => {
    // vault._generateMnemonic.mockReturnValueOnce('//Alice')
    const signMock = jest.spyOn(polkadot, 'sign')
    const sendMock = jest.spyOn(faucet, 'send')
    const { authProvider, providerDetails } = await util.getPasswordVaultAuthProvider(1)
    expect(vault.isUnlocked()).toBe(false)
    expect(await vault.hasVault(authProvider)).toBe(false)

    await vault.unlock(authProvider)
    expect(vault.isUnlocked()).toBe(true)
    expect(await vault.hasVault(authProvider)).toBe(true)
    let docCipher = vault.getDocCipher()
    expect(docCipher.isUnlocked()).toBe(true)
    let btc = vault.getBTC()
    expect(btc.isUnlocked()).toBe(true)
    let wallet = vault.getWallet()
    expect(wallet.isUnlocked()).toBe(true)
    const walletAddress = vault.getAddress()
    const signPayload = { payload: providerDetails.jwt }
    expect(signMock).toBeCalledWith(signPayload)
    expect(sendMock).toBeCalledWith(expect.objectContaining({
      authName: providerDetails.authName,
      address: walletAddress,
      jwt: providerDetails.jwt,
      signature: expect.any(String)
    }))

    await vault.lock()
    expect(vault.isUnlocked()).toBe(false)
    expect(docCipher.isUnlocked()).toBe(false)
    expect(btc.isUnlocked()).toBe(false)
    expect(wallet.isUnlocked()).toBe(false)
    expect(await vault.hasVault(authProvider)).toBe(true)

    await vault.unlock(authProvider)
    expect(vault.isUnlocked()).toBe(true)
    expect(docCipher.isUnlocked()).toBe(true)
    expect(btc.isUnlocked()).toBe(false)
    expect(wallet.isUnlocked()).toBe(false)
    docCipher = vault.getDocCipher()
    expect(docCipher.isUnlocked()).toBe(true)
    btc = vault.getBTC()
    expect(btc.isUnlocked()).toBe(true)
    wallet = vault.getWallet()
    expect(wallet.isUnlocked()).toBe(true)
    expect(await vault.hasVault(authProvider)).toBe(true)
    expect(vault.getAddress()).toEqual(walletAddress)
  })
})

describe('sign/verify', () => {
  test('sign/verify works', async () => {
    const confirmActionSpy = jest.spyOn(actionConfirmer, 'confirm')
    const { authProvider } = await util.getPasswordVaultAuthProvider(1)
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
    expect(confirmActionSpy).toHaveBeenCalledTimes(4)
    expect(confirmActionSpy).toHaveBeenNthCalledWith(2, expect.objectContaining({
      actionType: ActionType.CALL_EXTRINSIC,
      payload: {
        palletName: 'confidentialDocs',
        extrinsicName: 'setVault',
        params: [
          {
            name: 'userId',
            value: expect.any(String)
          },
          {
            name: 'publicKey',
            value: expect.any(String)
          },
          {
            name: 'cid',
            value: expect.any(String)
          }
        ],
        docs: expect.any(Array),
        address: expect.any(String)
      }

    }), expect.any(Function), expect.any(Function))
    expect(confirmActionSpy).toHaveBeenNthCalledWith(4, expect.objectContaining({
      actionType: ActionType.SIGN_PAYLOAD,
      payload: {
        payload: {
          s1: 'message to sign',
          i1: 1
        },
        address: expect.any(String)
      }

    }), expect.any(Function), expect.any(Function))
  })

  test('sign/verify should fail for non signer', async () => {
    let { authProvider } = await util.getPasswordVaultAuthProvider(1)
    await vault.unlock(authProvider)
    expect(vault.isUnlocked()).toBe(true)
    const payload = 'message to sign'
    const signature = await polkadot.sign({ payload });
    ({ authProvider } = await util.getPasswordVaultAuthProvider(2))
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
    const { authProvider } = await util.getPasswordVaultAuthProvider(1)
    expect(vault.isUnlocked()).toBe(false)
    expect(await vault.hasVault(authProvider)).toBe(false)

    await vault.unlock(authProvider)
    expect(vault.isUnlocked()).toBe(true)
    expect(await vault.hasVault(authProvider)).toBe(true)
    const address = vault.getAddress()
    const newPassword = 'Str15n$g3#2'
    const { authProvider: newAuthProvider } = await util.getPasswordVaultAuthProvider(1, newPassword)
    await vault.updateVaultAuthProvider(authProvider, newAuthProvider)
    expect(vault.isUnlocked()).toBe(false)
    await vault.unlock(newAuthProvider)
    expect(vault.isUnlocked()).toBe(true)
    expect(vault.getAddress()).toBe(address)
  })

  test('vault updateVaultAuthProvider should fail for auth channels not refering to same user', async () => {
    expect.assertions(1)
    const { authProvider } = await util.getPasswordVaultAuthProvider(1)
    const { authProvider: newAuthProvider } = await util.getPasswordVaultAuthProvider(2)
    try {
      await vault.updateVaultAuthProvider(authProvider, newAuthProvider)
    } catch (err) {
      expect(err.message).toContain('old and new providers do not refer to the same user')
    }
  })

  test('vault updateVaultAuthProvider should fail for user without vault', async () => {
    expect.assertions(3)
    const { authProvider } = await util.getPasswordVaultAuthProvider(1)
    expect(vault.isUnlocked()).toBe(false)
    expect(await vault.hasVault(authProvider)).toBe(false)
    const newPassword = 'Str15n$g3#2'
    const { authProvider: newAuthProvider } = await util.getPasswordVaultAuthProvider(1, newPassword)

    try {
      await vault.updateVaultAuthProvider(authProvider, newAuthProvider)
    } catch (err) {
      expect(err.message).toContain('The user does not have a vault')
    }
  })
})

describe('Test export vault', () => {
  test('vault export works', async () => {
    const { authProvider } = await util.getPasswordVaultAuthProvider(1)
    expect(vault.isUnlocked()).toBe(false)
    expect(await vault.hasVault(authProvider)).toBe(false)

    await vault.unlock(authProvider)
    expect(vault.isUnlocked()).toBe(true)
    expect(await vault.hasVault(authProvider)).toBe(true)
    const exporter1 = new RememberExporter()
    await vault.exportVault(exporter1)
    // console.log('vault: ', exporter1.payload)
    const vaultData = JSON.parse(exporter1.payload)
    expect(vaultData.mnemonic).toBeDefined()
    expect(vaultData.btcMnemonic).toBeDefined()
    expect(vaultData.privateKey).toBeDefined()
    expect(vaultData.publicKey).toBeDefined()
    await vault.unlock(authProvider)
    expect(vault.isUnlocked()).toBe(true)
    const exporter2 = new RememberExporter()
    await vault.exportVault(exporter2)
    expect(exporter2.payload).toBe(exporter1.payload)
  })

  test('vault export should fail for locked vault', async () => {
    expect.assertions(2)
    expect(vault.isUnlocked()).toBe(false)
    try {
      await vault.exportVault(new RememberExporter())
    } catch (err) {
      expect(err.message).toContain('The vault is locked')
    }
  })
})
