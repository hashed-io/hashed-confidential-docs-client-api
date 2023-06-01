const HashedConfidentialDocs = require('./HashedConfidentialDocs')
const { BalancesApi, Polkadot, Google, GoogleDrive } = require('./service')
const { BaseActionConfirmer, ModalActionConfirmer, PredefinedActionConfirmer } = require('./model/action-confirmer')
const { BaseFaucet, LocalAccountFaucet, HashedFaucet } = require('./model/faucet')
const { BrowserDownloadExporter } = require('./model/exporter')
const { createGoogleVaultAuthProvider, createPasswordVaultAuthProvider, BaseJWTVaultAuthProvider, BaseVaultAuthProvider } = require('./model/auth-providers')

module.exports = {
  BaseActionConfirmer,
  BaseVaultAuthProvider,
  BaseJWTVaultAuthProvider,
  ModalActionConfirmer,
  PredefinedActionConfirmer,
  HashedConfidentialDocs,
  BaseFaucet,
  BrowserDownloadExporter,
  LocalAccountFaucet,
  HashedFaucet,
  BalancesApi,
  Polkadot,
  Google,
  GoogleDrive,
  createGoogleVaultAuthProvider,
  createPasswordVaultAuthProvider
}
