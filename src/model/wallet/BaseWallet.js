const { signatureVerify } = require('@polkadot/util-crypto')
const { u8aToHex, u8aWrapBytes } = require('@polkadot/util')

// Base class for classes that provide signing functionality
class BaseWallet {
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
    txResponseHandler,
    signer = null,
    sudo = false
  }) {
    throw new Error('Subclass must override the callTx method')
  }

  /**
   * @name sign
   * @description Sign a payload
   * @param {Polkadot} polkadot instance of polkadot service class
   * @param {String} payload Message to sign
   * @param {String} signer User address
   * @returns Object
   */
  async sign ({ polkadot, payload, signer = null }) {
    throw new Error('Subclass must override the sign method')
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
    throw new Error('Subclass must override the callTx method')
  }

  getAddress (signer = null) {
    throw new Error('Subclass must override the getAddress method')
  }
}

function isKeyringPair (signer) {
  return signer.sign && signer.lock
}

function getAddress (signer) {
  return signer.address || signer
}

async function callTx ({
  polkadot,
  palletName,
  extrinsicName,
  params,
  signer,
  txResponseHandler,
  sudo = false
}) {
  params = params || []
  // console.log('callTx: ', extrinsicName, signer, params)
  let finalSigner = signer
  if (!isKeyringPair(signer)) {
    finalSigner = getAddress(signer)
    await polkadot.setWeb3Signer(finalSigner)
  }
  // console.log('callTx params', params)
  let unsub
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    try {
      const tx = polkadot.tx()
      let call = tx[palletName][extrinsicName](...params)
      if (sudo) {
        call = tx.sudo.sudo(call)
      }
      unsub = await call.signAndSend(finalSigner, (e) => txResponseHandler(e, resolve, reject, unsub))
    } catch (e) {
      reject(e)
    }
  })
}

async function sign ({ polkadot, payload, signer }) {
  const data = u8aToHex(u8aWrapBytes(payload))
  if (isKeyringPair(signer)) {
    return u8aToHex(signer.sign(data))
  } else {
    const injector = await polkadot._getInjector(signer)
    return injector.signer.signRaw({
      address: signer,
      data,
      type: 'bytes'
    }).signature
  }
}

function verifySignature ({ payload, signature, signer }) {
  return signatureVerify(payload, signature, signer)
}

module.exports = {
  BaseWallet,
  getAddress,
  callTx,
  isKeyringPair,
  sign,
  verifySignature
}
