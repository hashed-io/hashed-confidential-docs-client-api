/* eslint-disable no-new */

jest.setTimeout(20000)

const { createGoogleVaultAuthProvider, BaseJWTVaultAuthProvider } = require('../../src/model/auth-providers')
const { assertProviderInit, assertVerifyJWTCall } = require('../support/assertions')
const Util = require('../support/Util')

const util = new Util()
const decodedJWT = util.getDecodedJWT(1)
let verifyJWTMock = null

const key1 = '0xb059db0c5ac255bc8b2ba0679502f7b343cbdccf55f5c82642f9976557146461'
const key2 = '0x5284d018ab72746166db4528dd24b4dcde01ab00e6efbd922f0d9e9838e8d80f'
let googleDrive = null

beforeEach(() => {
  verifyJWTMock = jest.spyOn(BaseJWTVaultAuthProvider, 'verifyJWT')
    .mockResolvedValue(decodedJWT)

  googleDrive = {
    init: jest.fn(),
    getFileByName: jest.fn(),
    createFile: jest.fn(),
    updateFile: jest.fn()
  }
})
// *****NOTE: Jest stores a reference to object parameters so if they are changed after the method calls the
// stored objects will also be modified so it will not be the actual state of the object when the method was called
describe('Test init/onVaultStored', () => {
  test('init/onVaultStored for non existing metadata file should work', async () => {
    googleDrive.getFileByName.mockResolvedValueOnce(null)
    googleDrive.createFile.mockResolvedValueOnce({ id: 1 })
    const providerDetails = getProviderDetails(1)
    const provider = await createGoogleVaultAuthProvider(providerDetails)
    expect(googleDrive.init).toBeCalledTimes(1)
    expect(googleDrive.init).toBeCalledWith(decodedJWT.email)
    expect(googleDrive.getFileByName).toBeCalledTimes(1)
    expect(googleDrive.getFileByName).toBeCalledWith(getByFileNameParams())
    expect(googleDrive.createFile).toBeCalledTimes(1)
    assertMetadataFile(googleDrive.createFile.mock.calls[0][0], {
      appProperties: {
        pendingKey: ''
      }
    })
    assertProviderInit({ provider, providerDetails, decodedJWT })
    assertVerifyJWTCall(verifyJWTMock, providerDetails)

    const key = googleDrive.createFile.mock.calls[0][0].appProperties.pendingKey
    await provider.onVaultStored()

    expect(googleDrive.updateFile).toBeCalledTimes(1)
    assertMetadataFile(googleDrive.updateFile.mock.calls[0][0], {
      fileId: 1,
      appProperties: {
        pendingKey: null,
        currentKey: key
      },
      fileCreation: false
    })
  })
  test('init/onVaultStored for non existing metadata file should fail when createNew parameter is true', async () => {
    expect.assertions(1)
    googleDrive.getFileByName.mockResolvedValueOnce(null)
    const providerDetails = getProviderDetails(1)
    providerDetails.createNew = true
    try {
      await createGoogleVaultAuthProvider(providerDetails)
    } catch (error) {
      expect(error.message).toContain('There is no current key, the createNew parameter should be used when there is an existing key that wants to be updated')
    }
  })

  test('init/onVaultStored for existing metadata file with pending key should work', async () => {
    googleDrive.getFileByName.mockResolvedValueOnce({
      id: 1,
      appProperties: {
        pendingKey: key1
      }
    })
    const providerDetails = getProviderDetails(1)
    const provider = await createGoogleVaultAuthProvider(providerDetails)
    expect(googleDrive.init).toBeCalledTimes(1)
    expect(googleDrive.init).toBeCalledWith(decodedJWT.email)
    expect(googleDrive.getFileByName).toBeCalledTimes(1)
    expect(googleDrive.getFileByName).toBeCalledWith(getByFileNameParams())
    expect(googleDrive.createFile).toBeCalledTimes(0)
    assertProviderInit({ provider, providerDetails, decodedJWT })
    assertVerifyJWTCall(verifyJWTMock, providerDetails)
    await provider.onVaultStored()
    expect(googleDrive.updateFile).toBeCalledTimes(1)
    assertMetadataFile(googleDrive.updateFile.mock.calls[0][0], {
      fileId: 1,
      fileCreation: false,
      appProperties: {
        pendingKey: null,
        currentKey: key1
      }
    })
  })
  test('init/onVaultStored for existing metadata file with current key and createNew parameter set to true should work', async () => {
    googleDrive.getFileByName.mockResolvedValueOnce({
      id: 1,
      appProperties: {
        currentKey: key1
      }
    })
    googleDrive.updateFile.mockResolvedValueOnce({ id: 1 })
    const providerDetails = getProviderDetails(1)
    providerDetails.createNew = true
    const provider = await createGoogleVaultAuthProvider(providerDetails)
    expect(googleDrive.init).toBeCalledTimes(1)
    expect(googleDrive.init).toBeCalledWith(decodedJWT.email)
    expect(googleDrive.getFileByName).toBeCalledTimes(1)
    expect(googleDrive.getFileByName).toBeCalledWith(getByFileNameParams())
    expect(googleDrive.createFile).toBeCalledTimes(0)
    expect(googleDrive.updateFile).toBeCalledTimes(1)
    assertMetadataFile(googleDrive.updateFile.mock.calls[0][0], {
      fileId: 1,
      fileCreation: false,
      appProperties: {
        pendingKey: '',
        currentKey: key1
      }
    })
    assertProviderInit({ provider, providerDetails, decodedJWT })
    assertVerifyJWTCall(verifyJWTMock, providerDetails)
    const newKey = googleDrive.updateFile.mock.calls[0][0].appProperties.pendingKey
    await provider.onVaultStored()
    expect(googleDrive.updateFile).toBeCalledTimes(2)
    assertMetadataFile(googleDrive.updateFile.mock.calls[1][0], {
      fileId: 1,
      fileCreation: false,
      appProperties: {
        pendingKey: null,
        currentKey: newKey
      }
    })
  })

  test('init/onVaultStored for existing metadata file with current key, pending key and createNew parameter set to true should work', async () => {
    googleDrive.getFileByName.mockResolvedValueOnce({
      id: 1,
      appProperties: {
        currentKey: key1,
        pendingKey: key2
      }
    })
    googleDrive.updateFile.mockResolvedValueOnce({ id: 1 })
    const providerDetails = getProviderDetails(1)
    providerDetails.createNew = true
    const provider = await createGoogleVaultAuthProvider(providerDetails)
    expect(googleDrive.init).toBeCalledTimes(1)
    expect(googleDrive.init).toBeCalledWith(decodedJWT.email)
    expect(googleDrive.getFileByName).toBeCalledTimes(1)
    expect(googleDrive.getFileByName).toBeCalledWith(getByFileNameParams())
    expect(googleDrive.createFile).toBeCalledTimes(0)
    expect(googleDrive.updateFile).toBeCalledTimes(0)
    assertProviderInit({ provider, providerDetails, decodedJWT })
    assertVerifyJWTCall(verifyJWTMock, providerDetails)
    await provider.onVaultStored()
    expect(googleDrive.updateFile).toBeCalledTimes(1)
    assertMetadataFile(googleDrive.updateFile.mock.calls[0][0], {
      fileId: 1,
      fileCreation: false,
      appProperties: {
        pendingKey: null,
        currentKey: key2
      }
    })
  })
})

function assertMetadataFile (actual, { fileId, appProperties, fileCreation = true }) {
  expect(actual).not.toBeNull()
  if (fileId) {
    expect(actual.fileId).toBe(fileId)
  }
  if (fileCreation) {
    expect(actual.name).toBe('hcd.metadata')
    expect(actual.parents).toEqual(['appDataFolder'])
  } else {
    expect(actual.name).not.toBeDefined()
    expect(actual.parents).not.toBeDefined()
  }
  assertAppProperty(actual.appProperties.pendingKey, appProperties.pendingKey)
  assertAppProperty(actual.appProperties.currentKey, appProperties.currentKey)
}

function assertAppProperty (actual, expected) {
  if (expected === undefined) {
    expect(actual).toBeUndefined()
  } else if (expected === null) {
    expect(actual).toBeNull()
  } else if (expected === '') {
    expect(actual).toMatch(/.+/)
  } else {
    expect(actual).toBe(expected)
  }
}

function getByFileNameParams () {
  return {
    name: 'hcd.metadata',
    fields: 'id, appProperties',
    spaces: 'appDataFolder'
  }
}

function getProviderDetails (id) {
  return {
    authName: 'google',
    jwt: 'jwt',
    faucetServerUrl: 'http://localhost:3000',
    googleDrive
  }
}
