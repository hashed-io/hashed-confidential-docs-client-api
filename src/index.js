const HashedConfidentialDocs = require('./HashedConfidentialDocs')
const { BalancesApi, Polkadot, Google, GoogleDrive } = require('./service')
const { BaseFaucet, LocalAccountFaucet } = require('./model/faucet')
const { BrowserDownloadKeyExporter } = require('./model/key-exporter')
const { NativeVaultAuthProvider, GoogleVaultAuthProvider, PasswordVaultAuthProvider } = require('./model/auth-providers')

module.exports = {
  HashedConfidentialDocs,
  BaseFaucet,
  BrowserDownloadKeyExporter,
  LocalAccountFaucet,
  BalancesApi,
  Polkadot,
  Google,
  GoogleDrive,
  GoogleVaultAuthProvider,
  NativeVaultAuthProvider,
  PasswordVaultAuthProvider
}
