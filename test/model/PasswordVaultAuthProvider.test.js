/* eslint-disable no-new */

jest.setTimeout(20000)

const { createPasswordVaultAuthProvider, BaseJWTVaultAuthProvider } = require('../../src/model/auth-providers')
const { assertProviderInit, assertVerifyJWTCall } = require('../support/assertions')
const Util = require('../support/Util')

const util = new Util()
const decodedJWT = util.getDecodedJWT(1)
let verifyJWTMock = null

beforeEach(() => {
  verifyJWTMock = jest.spyOn(BaseJWTVaultAuthProvider, 'verifyJWT')
    .mockResolvedValue(decodedJWT)
})

describe('Test creation', () => {
  test('Test vault is properly initialized', async () => {
    const providerDetails = util.getPasswordProviderDetails(1)
    const provider = await createPasswordVaultAuthProvider(providerDetails)
    assertProviderInit({
      provider,
      providerDetails,
      decodedJWT
    })
    assertVerifyJWTCall(verifyJWTMock, providerDetails)
  })
})

describe('Test validations', () => {
  test('vault unlock should fail for invalid user details', async () => {
    expect.assertions(1)
    try {
      await createPasswordVaultAuthProvider({
        authName: 'afloat',
        jwt: 'jwt',
        faucetServerUrl: 'http://localhost:3000',
        password: 'Str1'
      })
    } catch (error) {
      expect(error.message).toContain('The password must be at least 8 characters long, and contain at least one lowercase letter, one uppercase letter, one numeric digit, and one special character')
    }
  })
})
