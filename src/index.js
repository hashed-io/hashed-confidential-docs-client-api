const HashedConfidentialDocs = require('./HashedConfidentialDocs')
const { BalancesApi, Polkadot, Google, GoogleDrive } = require('./service')
const { BaseFaucet, LocalAccountFaucet, GoogleVaultAuthProvider, PasswordVaultAuthProvider } = require('./model')

module.exports = {
  HashedConfidentialDocs,
  BaseFaucet,
  LocalAccountFaucet,
  BalancesApi,
  Polkadot,
  Google,
  GoogleDrive,
  GoogleVaultAuthProvider,
  PasswordVaultAuthProvider
}
