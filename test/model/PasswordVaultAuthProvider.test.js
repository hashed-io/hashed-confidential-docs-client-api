/* eslint-disable no-new */

jest.setTimeout(20000)

global.window = { addEventListener () {} }
// global.document = {}
global.File = class {}
const { PasswordVaultAuthProvider } = require('../../src/model')

describe('Test validations', () => {
  test('vault unlock should fail for invalid user details', async () => {
    expect.assertions(3)
    try {
      new PasswordVaultAuthProvider({
        userId: '1232323',
        password: 'Str15n$g3'
      })
    } catch (error) {
      expect(error.message).toContain('authName parameter is required')
    }
    try {
      new PasswordVaultAuthProvider({
        authName: 'google',
        password: 'Str15n$g3'
      })
    } catch (error) {
      expect(error.message).toContain('userId parameter is required')
    }
    try {
      new PasswordVaultAuthProvider({
        authName: 'google',
        userId: '1232323',
        password: 'Str1'
      })
    } catch (error) {
      expect(error.message).toContain('The password must be at least 8 characters long, and contain at least one lowercase letter, one uppercase letter, one numeric digit, and one special character')
    }
  })
})
