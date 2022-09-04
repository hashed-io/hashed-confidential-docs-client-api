const HashedConfidentialDocs = require('./HashedConfidentialDocs')
const { BalancesApi, Polkadot, Google, GoogleDrive } = require('./service')
const { BaseFaucet, LocalAccountFaucet, HashedFaucet } = require('./model/faucet')
const { BrowserDownloadKeyExporter } = require('./model/key-exporter')
const { createGoogleVaultAuthProvider, createPasswordVaultAuthProvider } = require('./model/auth-providers')

module.exports = {
  HashedConfidentialDocs,
  BaseFaucet,
  BrowserDownloadKeyExporter,
  LocalAccountFaucet,
  HashedFaucet,
  BalancesApi,
  Polkadot,
  Google,
  GoogleDrive,
  createGoogleVaultAuthProvider,
  createPasswordVaultAuthProvider
}
