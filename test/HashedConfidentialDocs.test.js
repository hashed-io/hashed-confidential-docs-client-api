jest.setTimeout(40000)
global.window = { addEventListener () {} }
global.File = class {}
const { HashedConfidentialDocs } = require('../src')
const { LocalAccountFaucet } = require('../src/model')
const { BalancesApi, ConfidentialDocsApi } = require('../src/service')
const Util = require('./support/Util')

let hcd = null
let polkadot = null
let faucet = null
let signer1 = null
let confidentialDocsApi = null
const util = new Util()
beforeAll(async () => {
  polkadot = await util.setupPolkadot()
  polkadot.setWeb3Signer = async function () {}
  faucet = new LocalAccountFaucet({
    balancesApi: new BalancesApi(polkadot, () => {}),
    signer: util.getKeypair('//Alice'),
    amount: 1000000000
  })
  confidentialDocsApi = new ConfidentialDocsApi(polkadot, () => {})
  signer1 = util.getKeypair('//Alice')
  hcd = newHashedConfidentialDocsInstance()
  hcd._polkadot.setWeb3Signer = async function () {}
})

beforeEach(async () => {
  await logout()
})

beforeEach(async () => {
  await confidentialDocsApi.killStorage(signer1)
})

describe('HashedConfidentialDocs Integration Tests', () => {
  test('Should not be able to work with owned data and shared data if not logged in', async () => {
    expect.assertions(8)
    expect(hcd.isLoggedIn()).toBe(false)
    try {
      hcd.ownedData()
    } catch (err) {
      expect(err.message).toContain('The vault is locked')
    }

    try {
      hcd.sharedData()
    } catch (err) {
      expect(err.message).toContain('The vault is locked')
    }
    await hcd.login(util.getSSOUserDetails(1))
    expect(hcd.isLoggedIn()).toBe(true)
    await hcd.logout()
    expect(hcd.isLoggedIn()).toBe(false)
    try {
      hcd.ownedData()
    } catch (err) {
      expect(err.message).toContain('The vault is locked')
    }

    try {
      await hcd.sharedData().viewByID({ id: 1 })
    } catch (err) {
      expect(err.message).toContain('The vault is locked')
    }
  })

  test('New user login', async () => {
    expect(hcd.isLoggedIn()).toBe(false)
    await hcd.login(util.getSSOUserDetails(1))
    expect(hcd.isLoggedIn()).toBe(true)
  })

  // test('Test session persistence', async () => {
  //   expect(hcd.isLoggedIn()).toBe(false)
  //   await hcd.login(keyPairNewUser.address)
  //   expect(hcd.isLoggedIn()).toBe(true)
  //   const newHP = newHashedConfidentialDocsInstance()
  //   expect(newHP.isLoggedIn()).toBe(true)
  //   await hcd.logout()
  //   const newHP2 = newHashedConfidentialDocsInstance()
  //   expect(newHP2.isLoggedIn()).toBe(false)
  // })

  test('Cipher and view owned data', async () => {
    const userDetails = util.getSSOUserDetails(1)
    await login(userDetails)
    const expectedOwnedData = getBaseDoc(1)
    let ownedData = await hcd.ownedData().add(expectedOwnedData)
    expectedOwnedData.owner = hcd.address()
    assertOwnedData(ownedData, expectedOwnedData)
    const { payload } = await hcd.ownedData().view(ownedData)
    expect(payload).toEqual(expectedOwnedData.payload)
    ownedData = await hcd.ownedData().viewByCID(ownedData.cid)
    assertOwnedData(ownedData, expectedOwnedData)
    expect(ownedData.payload).toEqual(expectedOwnedData.payload)
  })

  test('Update owned data metadata', async () => {
    const {
      ownedData: expected
    } = await setupOwnedData(1)
    expected.name = 'name 2'
    expected.description = 'desc 2'
    let actual = await hcd.ownedData().updateMetadata(expected)
    assertOwnedData(actual, expected)
    actual = await hcd.ownedData().getByCID(expected.cid)
    assertOwnedData(actual, expected)
  })

  test('Should fail for non owner trying to view owned data', async () => {
    expect.assertions(11)
    const {
      ownedData
    } = await setupOwnedData(1)
    await logout()
    await login(util.getSSOUserDetails(2))

    try {
      await hcd.ownedData().view(ownedData)
    } catch (err) {
      expect(err.message).toContain('Could not decrypt message')
    }
  })

  test('Share data and view', async () => {
    const userDetails1 = util.getSSOUserDetails(1)
    const userDetails2 = util.getSSOUserDetails(2)
    await login(userDetails1)
    const toUserAddress = hcd.address()
    await logout()
    await login(userDetails2)
    const expected = getSharedDoc(2, toUserAddress)
    let actual = await hcd.sharedData().share(expected)
    expected.from = hcd.address()
    expected.to = toUserAddress
    expected.cid = actual.cid
    assertSharedData(actual, expected)
    actual = await hcd.sharedData().view(expected)
    assertSharedData(actual, expected)
    expect(actual.payload).toEqual(expected.payload)
    actual = await hcd.sharedData().viewByCID(expected.cid)
    assertSharedData(actual, expected)
    expect(actual.payload).toEqual(expected.payload)
    await logout()
    await login(userDetails1)
    actual = await hcd.sharedData().view(expected)
    assertSharedData(actual, expected)
    expect(actual.payload).toEqual(expected.payload)
    actual = await hcd.sharedData().viewByCID(expected.cid)
    assertSharedData(actual, expected)
    expect(actual.payload).toEqual(expected.payload)
  })

  test('Should fail for non owner trying to view shared data', async () => {
    expect.assertions(16)
    const { actual } = await setupSharedData(1, 2)
    await logout()
    await login(util.getSSOUserDetails(3))
    try {
      await hcd.sharedData().viewByCID(actual.cid)
    } catch (err) {
      expect(err.message).toContain('is not sharer nor the sharee of doc with cid')
    }

    try {
      await hcd.sharedData().view(actual)
    } catch (err) {
      expect(err.message).toContain('Could not decrypt message')
    }
  })

  // test('Only "shared to" user can update metadata', async () => {
  //   expect.assertions(18)
  //   const { sharedData } = await setupSharedData(1)
  //   const name = 'Updated name'
  //   const description = 'Updated description'
  //   const id = sharedData.id
  //   try {
  //     await hcd.sharedData().updateMetadata({
  //       id,
  //       name,
  //       description
  //     })
  //   } catch (err) {
  //     expect(err.message).toContain('has not been shared data with id')
  //   }
  // })

  // test('Delete shared data', async () => {
  //   let { sharedData } = await setupSharedData(1)
  //   await logout()
  //   await login(keyPair1.address)

  //   await hcd.sharedData().delete(sharedData.id)
  //   sharedData = await hcd.sharedData().findById(sharedData.id)
  //   expect(sharedData).toBeNull()
  // })
  /** *Hasura does not throw error, it just does not delete the record */
  // test('Only "shared to" user can delete share', async () => {
  //   expect.assertions(18)
  //   await login(keyPair1.address)
  //   await logout()
  //   await login(keyPair2.address)
  //   const expectedData = getBaseData(1)
  //   expectedData.fromUserAddress = keyPair2.address
  //   expectedData.toUserAddress = keyPair1.address
  //   const {
  //     sharedData
  //   } = await hcd.sharedData().shareNew(expectedData)
  //   assertSharedData(sharedData, expectedData)
  //   try {
  //     console.log('Shared data id: ', sharedData.id)
  //     await hcd.sharedData().delete(sharedData.id)
  //   } catch (err) {
  //     expect(err.message).toContain('has not been shared data with id')
  //   }
  // })
})

function newHashedConfidentialDocsInstance () {
  return new HashedConfidentialDocs({
    ipfsURL: 'https://ipfs.infura.io:5001',
    chainURI: 'ws://127.0.0.1:9944',
    appName: 'Confidential Docs',
    faucet
  })
}
async function setupSharedData (id1, id2) {
  const userDetails1 = util.getSSOUserDetails(id1)
  const userDetails2 = util.getSSOUserDetails(id2)
  await login(userDetails1)
  const toUserAddress = hcd.address()
  await logout()
  await login(userDetails2)
  const expected = getSharedDoc(id2, toUserAddress)
  const actual = await hcd.sharedData().share(expected)
  expected.from = hcd.address()
  expected.to = toUserAddress
  expected.cid = actual.cid
  assertSharedData(actual, expected)
  return {
    userDetails1,
    userDetails2,
    expected,
    actual
  }
}

async function setupOwnedData (id) {
  const userDetails = util.getSSOUserDetails(id)
  await login(userDetails)
  const expectedOwnedData = getBaseDoc(id)
  const ownedData = await hcd.ownedData().add(expectedOwnedData)
  expectedOwnedData.owner = hcd.address()
  assertOwnedData(ownedData, expectedOwnedData)
  return {
    userDetails,
    expectedOwnedData,
    ownedData
  }
}
async function login (userDetails) {
  expect(hcd.isLoggedIn()).toBe(false)
  await hcd.login(userDetails)
  expect(hcd.isLoggedIn()).toBe(true)
}

async function logout () {
  await hcd.logout()
  expect(hcd.isLoggedIn()).toBe(false)
}

function getSharedDoc (id, toUserAddress) {
  return {
    ...getBaseDoc(id),
    toUserAddress
  }
}

function getBaseDoc (id) {
  return {
    name: `name${id}`,
    description: `desc${id}`,
    payload: {
      prop1: id,
      prop2: `str${id}`
    }
  }
}

function assertOwnedData (actual, expected) {
  expect(actual.name).toBe(expected.name)
  expect(actual.description).toBe(expected.description)
  expect(actual.owner).toBe(expected.owner)
  expect(actual.cid).not.toBeNull()
}

function assertSharedData (actual, expected) {
  expect(actual.name).toBe(expected.name)
  expect(actual.description).toBe(expected.description)
  expect(actual.from).toBe(expected.from)
  expect(actual.to).toBe(expected.to)
  expect(actual.cid).not.toBeNull()
}
