const { BaseWallet, callTx, sign, getAddress, verifySignature } = require('./BaseWallet')

class ExternalSignerWallet extends BaseWallet {
  async callTx ({
    polkadot,
    palletName,
    extrinsicName,
    params,
    signer,
    txResponseHandler,
    sudo = false
  }) {
    return callTx({
      polkadot,
      palletName,
      extrinsicName,
      params,
      signer,
      txResponseHandler,
      sudo
    })
  }

  async sign ({ polkadot, payload, signer }) {
    return sign({ polkadot, payload, signer })
  }

  verifySignature ({ payload, signature, signer }) {
    return verifySignature({ payload, signature, signer })
  }

  getAddress (signer) {
    return getAddress(signer)
  }
}

module.exports = ExternalSignerWallet
