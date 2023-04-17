const HashedConfidentialDocs = require('./HashedConfidentialDocs')
const { BalancesApi, Polkadot, Google, GoogleDrive } = require('./service')
const { BaseActionConfirmer, ModalActionConfirmer, PredefinedActionConfirmer } = require('./model/action-confirmer')
const { BaseFaucet, LocalAccountFaucet, HashedFaucet } = require('./model/faucet')
const { BrowserDownloadKeyExporter } = require('./model/key-exporter')
const { createGoogleVaultAuthProvider, createPasswordVaultAuthProvider } = require('./model/auth-providers')

module.exports = {
  BaseActionConfirmer,
  ModalActionConfirmer,
  PredefinedActionConfirmer,
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
