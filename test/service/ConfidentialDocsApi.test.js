
jest.setTimeout(20000)

global.window = { addEventListener () {} }
// global.document = {}
const { blake2AsHex } = require('@polkadot/util-crypto')
const { ConfidentialDocsApi } = require('../../src/service')

const Util = require('../support/Util')

let confidentialDocsApi = null
let signer1 = null
let signer2 = null
let signer3 = null
let polkadot = null
const util = new Util()
beforeAll(async () => {
  polkadot = await util.setupPolkadot()
  confidentialDocsApi = new ConfidentialDocsApi(polkadot, () => {})
  // console.log(confidentialDocsApi)
  signer1 = util.getKeypair('//Alice')
  signer2 = util.getKeypair('//Bob')
  signer3 = util.getKeypair('//Carlos')
  // console.log(signer1.address)
})

afterAll(async () => {
  await polkadot.disconnect()
})

beforeEach(async () => {
  await confidentialDocsApi.killStorage(signer1)
})

describe('Test confidential docs pallet', () => {
  test('setVault works', async () => {
    const vault = {
      signer: signer1,
      userId: blake2AsHex('userid1'),
      publicKey: blake2AsHex('public key 1'),
      cid: 'cid 1'
    }
    await confidentialDocsApi.setVault(vault)
    const actualVault = await confidentialDocsApi.getVault(vault.userId)
    expect(actualVault.cid).toEqual(vault.cid)
    expect(actualVault.owner).toEqual(signer1.address)
    const publicKey = await confidentialDocsApi.getPublicKey(signer1.address)
    expect(publicKey).toBe(vault.publicKey)
  })
  test('setOwnedDoc works', async () => {
    expect.assertions(9)
    await setVault(signer1, 1)
    const ownedDoc = {
      name: 'name 1',
      description: 'desc 1',
      cid: 'cid 1',
      owner: signer1.address
    }
    await confidentialDocsApi.setOwnedDoc({
      signer: signer1,
      ownedDoc
    })
    let actualOwnedDoc = await confidentialDocsApi.getOwnedDoc(ownedDoc.cid)
    assertOwnedDoc(actualOwnedDoc, ownedDoc)
    actualOwnedDoc = await confidentialDocsApi.getOwnedDoc(ownedDoc.cid, ownedDoc.owner)
    assertOwnedDoc(actualOwnedDoc, ownedDoc)
    try {
      await confidentialDocsApi.getOwnedDoc(ownedDoc.cid, signer2.address)
    } catch (error) {
      expect(error.message).toContain('is not owner of doc with cid:')
    }
  })
  test('shareDoc works', async () => {
    expect.assertions(16)
    await setVault(signer1, 1)
    await setVault(signer2, 2)
    const sharedDoc = {
      name: 'name 1',
      description: 'desc 1',
      cid: 'cid 1',
      from: signer1.address,
      to: signer2.address

    }
    await confidentialDocsApi.sharedDoc({
      signer: signer1,
      sharedDoc
    })
    let actualSharedDoc = await confidentialDocsApi.getSharedDoc(sharedDoc.cid)
    assertSharedDoc(actualSharedDoc, sharedDoc)
    actualSharedDoc = await confidentialDocsApi.getSharedDoc(sharedDoc.cid, sharedDoc.to)
    assertSharedDoc(actualSharedDoc, sharedDoc)
    actualSharedDoc = await confidentialDocsApi.getSharedDoc(sharedDoc.cid, sharedDoc.from)
    assertSharedDoc(actualSharedDoc, sharedDoc)
    try {
      await confidentialDocsApi.getSharedDoc(sharedDoc.cid, signer3.address)
    } catch (error) {
      expect(error.message).toContain('is not sharer nor the sharee of doc with cid:')
    }
  })
})

function assertOwnedDoc (actual, expected) {
  expect(actual.cid).toEqual(expected.cid)
  expect(actual.name).toEqual(expected.name)
  expect(actual.description).toEqual(expected.description)
  expect(actual.owner).toEqual(expected.owner)
}

function assertSharedDoc (actual, expected) {
  expect(actual.cid).toEqual(expected.cid)
  expect(actual.name).toEqual(expected.name)
  expect(actual.description).toEqual(expected.description)
  expect(actual.from).toEqual(expected.from)
  expect(actual.to).toEqual(expected.to)
}

async function setVault (signer, id) {
  const vault = {
    signer,
    userId: blake2AsHex(`userid${id}`),
    publicKey: blake2AsHex(`public key ${id}`),
    cid: `cid ${id}`
  }
  await confidentialDocsApi.setVault(vault)
}
