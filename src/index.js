const HashedConfidentialDocs = require('./HashedConfidentialDocs')
const { BalancesApi, Polkadot } = require('./service')
const { BaseFaucet, LocalAccountFaucet } = require('./model')

module.exports = {
  HashedConfidentialDocs,
  BaseFaucet,
  LocalAccountFaucet,
  BalancesApi,
  Polkadot
}
