const BaseVaultAuthProvider = require('./BaseVaultAuthProvider')
const BaseJWTVaultAuthProvider = require('./BaseJWTVaultAuthProvider')
const createGoogleVaultAuthProvider = require('./GoogleVaultAuthProvider')
const createPasswordVaultAuthProvider = require('./PasswordVaultAuthProvider')

module.exports = {
  BaseVaultAuthProvider,
  BaseJWTVaultAuthProvider,
  createGoogleVaultAuthProvider,
  createPasswordVaultAuthProvider
}
