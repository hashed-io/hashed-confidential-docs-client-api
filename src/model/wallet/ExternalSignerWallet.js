const { BaseWallet, callTx, sign, getAddress, verifySignature } = require('./BaseWallet')

// Provides signing functionality for a externally provided signer
class ExternalSignerWallet extends BaseWallet {
  /**
   * @name callTx
   * @description Calls the extrinsic specified by the parameters
   * @param {Polkadot} polkadot instance of polkadot service class
   * @param {String} palletName name of the pallet
   * @param {String} extrinsicName Name of the extrinsic
   * @param {Array} params Array with the extrinsic parameters
   * @param {function} txResponseHandler The function that will handle the tx reponse
   * @param {String|KeyPair} [signer] The signer of the tx, the parameter is optional,
   * it depends on the configured wallet if the parameter is required or not
   * @param {boolean} sudo Whether the call should be done as sudo
   * @returns tx response from polkadot api
   */
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

  /**
   * @name sign
   * @description Sign a payload
   * @param {Polkadot} polkadot instance of polkadot service class
   * @param {String} payload Message to sign
   * @param {String} signer User address
   * @returns Object
   */
  async sign ({ polkadot, payload, signer }) {
    return sign({ polkadot, payload, signer })
  }

  /**
   * @name verifySignature
   * @description Verify a signature
   * @param {String} payload payload to verify
   * @param {String} signature Signature from signMessage result
   * @param {String} signer User Address
   * @returns Object
   */
  verifySignature ({ payload, signature, signer }) {
    return verifySignature({ payload, signature, signer })
  }

  getAddress (signer) {
    return getAddress(signer)
  }
}

module.exports = ExternalSignerWallet
