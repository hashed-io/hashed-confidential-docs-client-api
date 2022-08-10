
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
beforeEach(async () => {
  await util.restartNode()
  polkadot = await util.setupPolkadot()
  confidentialDocsApi = new ConfidentialDocsApi(polkadot, () => {})
  // console.log(confidentialDocsApi)
  signer1 = util.getKeypair('//Alice')
  signer2 = util.getKeypair('//Bob')
  signer3 = util.getKeypair('//Carlos')
  // console.log(signer1.address)
})

afterEach(async () => {
  await polkadot.disconnect()
  await util.killNode()
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

  test('removeOwnedDoc works', async () => {
    await setVault(signer1, 1)
    const ownedDoc = await setOwnedDoc(signer1, 1)
    let actualOwnedDoc = await confidentialDocsApi.getOwnedDoc(ownedDoc.cid)
    assertOwnedDoc(actualOwnedDoc, ownedDoc)
    await confidentialDocsApi.removeOwnedDoc({ cid: ownedDoc.cid, signer: signer1 })
    actualOwnedDoc = await confidentialDocsApi.findOwnedDoc(ownedDoc.cid)
    expect(actualOwnedDoc).toBeNull()
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

  test('update shared document metadata works', async () => {
    await setVault(signer1, 1)
    await setVault(signer2, 2)
    const sharedDoc = await setSharedDoc(signer1, signer2, 1)
    let actualSharedDoc = await confidentialDocsApi.getSharedDoc(sharedDoc.cid)
    assertSharedDoc(actualSharedDoc, sharedDoc)
    const updatedSharedDoc = {
      cid: sharedDoc.cid,
      name: 'updated name',
      description: 'updated description'
    }
    actualSharedDoc = await confidentialDocsApi.updateSharedDocMetadata({ sharedDoc: updatedSharedDoc, signer: signer2 })
    actualSharedDoc = await confidentialDocsApi.getSharedDoc(sharedDoc.cid)
    updatedSharedDoc.from = sharedDoc.from
    updatedSharedDoc.to = sharedDoc.to
    assertSharedDoc(actualSharedDoc, updatedSharedDoc)
  })

  test('remove shared document works', async () => {
    await setVault(signer1, 1)
    await setVault(signer2, 2)
    const sharedDoc = await setSharedDoc(signer1, signer2, 1)
    let actualSharedDoc = await confidentialDocsApi.getSharedDoc(sharedDoc.cid)
    assertSharedDoc(actualSharedDoc, sharedDoc)
    actualSharedDoc = await confidentialDocsApi.removeSharedDoc({ cid: sharedDoc.cid, signer: signer2 })
    actualSharedDoc = await confidentialDocsApi.findSharedDoc(sharedDoc.cid)
    expect(actualSharedDoc).toBeNull()
  })

  test('getOwnedCIDs and getOwnedDocs', async () => {
    await setVault(signer1, 1)
    let actualDocCIDs = await confidentialDocsApi.getOwnedCIDs(signer1.address)
    expect(actualDocCIDs).toEqual([])
    let actualDocs = await confidentialDocsApi.getOwnedDocs(signer1.address)
    expect(actualDocs).toEqual([])
    const doc1 = await setOwnedDoc(signer1, 1)
    actualDocCIDs = await confidentialDocsApi.getOwnedCIDs(signer1.address)
    expect(actualDocCIDs).toEqual([doc1.cid])
    actualDocs = await confidentialDocsApi.getOwnedDocs(signer1.address)
    expect(actualDocs).toEqual([doc1])
    const doc2 = await setOwnedDoc(signer1, 2)
    actualDocCIDs = await confidentialDocsApi.getOwnedCIDs(signer1.address)
    expect(actualDocCIDs).toEqual([doc1.cid, doc2.cid])
    actualDocs = await confidentialDocsApi.getOwnedDocs(signer1.address)
    expect(actualDocs).toEqual([doc1, doc2])
  })

  test('getOwnedDocs subscription', async () => {
    expect.assertions(3)
    await setVault(signer1, 1)
    let counter = 0
    const doc1 = getOwnedDoc(signer1, 1)
    const doc2 = getOwnedDoc(signer1, 2)
    const unsub = await confidentialDocsApi.getOwnedDocs(signer1.address, (docs) => {
      if (counter === 0) {
        expect(docs).toEqual([])
      } else if (counter === 1) {
        expect(docs).toEqual([doc1])
      } else if (counter === 2) {
        expect(docs).toEqual([doc1, doc2])
      }
      counter++
    })
    await confidentialDocsApi.setOwnedDoc({
      signer: signer1,
      ownedDoc: doc1
    })
    await confidentialDocsApi.setOwnedDoc({
      signer: signer1,
      ownedDoc: doc2
    })
    await unsub()
  })

  test('getSharedCIDs, getSharedDocs, getSharedWithMeCIDs, getSharedWithMeDocs', async () => {
    await setVault(signer1, 1)
    await setVault(signer2, 2)
    let actualDocCIDs = await confidentialDocsApi.getSharedWithMeCIDs(signer2.address)
    expect(actualDocCIDs).toEqual([])
    let actualDocs = await confidentialDocsApi.getSharedWithMeDocs(signer2.address)
    expect(actualDocs).toEqual([])
    actualDocCIDs = await confidentialDocsApi.getSharedCIDs(signer1.address)
    expect(actualDocCIDs).toEqual([])
    actualDocs = await confidentialDocsApi.getSharedDocs(signer1.address)
    expect(actualDocs).toEqual([])

    const doc1 = await setSharedDoc(signer1, signer2, 1)
    actualDocCIDs = await confidentialDocsApi.getSharedWithMeCIDs(signer2.address)
    expect(actualDocCIDs).toEqual([doc1.cid])
    actualDocs = await confidentialDocsApi.getSharedWithMeDocs(signer2.address)
    expect(actualDocs).toEqual([doc1])
    actualDocCIDs = await confidentialDocsApi.getSharedCIDs(signer1.address)
    expect(actualDocCIDs).toEqual([doc1.cid])
    actualDocs = await confidentialDocsApi.getSharedDocs(signer1.address)
    expect(actualDocs).toEqual([doc1])

    const doc2 = await setSharedDoc(signer1, signer2, 2)
    actualDocCIDs = await confidentialDocsApi.getSharedWithMeCIDs(signer2.address)
    expect(actualDocCIDs).toEqual([doc1.cid, doc2.cid])
    actualDocs = await confidentialDocsApi.getSharedWithMeDocs(signer2.address)
    expect(actualDocs).toEqual([doc1, doc2])
    actualDocCIDs = await confidentialDocsApi.getSharedCIDs(signer1.address)
    expect(actualDocCIDs).toEqual([doc1.cid, doc2.cid])
    actualDocs = await confidentialDocsApi.getSharedDocs(signer1.address)
    expect(actualDocs).toEqual([doc1, doc2])

    const doc3 = await setSharedDoc(signer2, signer1, 3)
    actualDocs = await confidentialDocsApi.getSharedWithMeDocs(signer2.address)
    expect(actualDocs).toEqual([doc1, doc2])
    actualDocs = await confidentialDocsApi.getSharedWithMeDocs(signer1.address)
    expect(actualDocs).toEqual([doc3])
    actualDocs = await confidentialDocsApi.getSharedDocs(signer1.address)
    expect(actualDocs).toEqual([doc1, doc2])
    actualDocs = await confidentialDocsApi.getSharedDocs(signer2.address)
    expect(actualDocs).toEqual([doc3])
  })

  test('getSharedWithMeDocs, getSharedDocs subscription', async () => {
    expect.assertions(10)
    await setVault(signer1, 1)
    await setVault(signer2, 2)
    let counter1 = 0
    let counter2 = 0
    let counter3 = 0
    let counter4 = 0
    const doc1 = getSharedDoc(signer1, signer2, 1)
    const doc2 = getSharedDoc(signer1, signer2, 2)
    const doc3 = getSharedDoc(signer2, signer1, 3)
    const unsub1 = await confidentialDocsApi.getSharedWithMeDocs(signer2.address, (docs) => {
      if (counter1 === 0) {
        expect(docs).toEqual([])
      } else if (counter1 === 1) {
        expect(docs).toEqual([doc1])
      } else if (counter1 === 2) {
        expect(docs).toEqual([doc1, doc2])
      }
      counter1++
    })
    const unsub2 = await confidentialDocsApi.getSharedWithMeDocs(signer1.address, (docs) => {
      if (counter2 === 0) {
        expect(docs).toEqual([])
      } else if (counter2 === 1) {
        expect(docs).toEqual([doc3])
      }
      counter2++
    })
    const unsub3 = await confidentialDocsApi.getSharedDocs(signer1.address, (docs) => {
      if (counter3 === 0) {
        expect(docs).toEqual([])
      } else if (counter3 === 1) {
        expect(docs).toEqual([doc1])
      } else if (counter3 === 2) {
        expect(docs).toEqual([doc1, doc2])
      }
      counter3++
    })

    const unsub4 = await confidentialDocsApi.getSharedDocs(signer2.address, (docs) => {
      if (counter4 === 0) {
        expect(docs).toEqual([])
      } else if (counter4 === 1) {
        expect(docs).toEqual([doc3])
      }
      counter4++
    })
    await confidentialDocsApi.sharedDoc({
      signer: signer1,
      sharedDoc: doc1
    })
    await confidentialDocsApi.sharedDoc({
      signer: signer1,
      sharedDoc: doc2
    })
    await confidentialDocsApi.sharedDoc({
      signer: signer2,
      sharedDoc: doc3
    })
    await unsub1()
    await unsub2()
    await unsub3()
    await unsub4()
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

function getOwnedDoc (signer, id) {
  return {
    name: `name ${id}`,
    description: `desc ${id}`,
    cid: `cid ${id}`,
    owner: signer.address
  }
}

function getSharedDoc (signerFrom, signerTo, id) {
  return {
    name: `name ${id}`,
    description: `desc ${id}`,
    cid: `cid ${id}`,
    from: signerFrom.address,
    to: signerTo.address
  }
}

async function setOwnedDoc (signer, id) {
  const ownedDoc = getOwnedDoc(signer, id)
  await confidentialDocsApi.setOwnedDoc({
    signer,
    ownedDoc
  })
  return ownedDoc
}

async function setSharedDoc (signerFrom, signerTo, id) {
  const sharedDoc = getSharedDoc(signerFrom, signerTo, id)
  await confidentialDocsApi.sharedDoc({
    signer: signerFrom,
    sharedDoc
  })
  return sharedDoc
}
