
const { BaseWallet, callTx, sign, getAddress, verifySignature, isKeyringPair } = require('./BaseWallet')

// Stores securely the signing private key, and uses this key to provide signing functionality
class VaultWallet extends BaseWallet {
  constructor ({
    vault,
    signer
  }) {
    super()
    this._wallet = _create({
      vault,
      signer
    })
  }

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
    sudo = false
  }) {
    return this._wallet.callTx({
      polkadot,
      palletName,
      extrinsicName,
      params,
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
  async sign ({ polkadot, payload }) {
    return this._wallet.sign({
      polkadot,
      payload
    })
  }

  /**
   * @name verifySignature
   * @description Verify a signature
   * @param {String} payload payload to verify
   * @param {String} signature Signature from signMessage result
   * @param {String} signer User Address
   * @returns Object
   */
  verifySignature ({ payload, signature }) {
    return this._wallet.verifySignature({ payload, signature })
  }

  getAddress () {
    return this._wallet.getAddress()
  }

  isUnlocked () {
    return this._wallet.isUnlocked()
  }
}

module.exports = VaultWallet

function _create ({ vault, signer }) {
  vault.once('lock', () => {
    signer = null
  })
  return {
    async callTx ({
      polkadot,
      palletName,
      extrinsicName,
      params,
      txResponseHandler,
      sudo = false
    }) {
      this.assertIsUnlocked()

      // Vault generated substrate account in being used
      // need to ask for confirmation
      if (isKeyringPair(signer)) {
        return new Promise((resolve, reject) => {
          const onConfirm = async () => {
            try {
              const result = await _callTx({
                _this: this,
                polkadot,
                palletName,
                extrinsicName,
                signer,
                params,
                txResponseHandler,
                sudo
              })
              resolve(result)
            } catch (error) {
              reject(error)
            }
          }
          const onCancel = (reason) => {
            reject(new Error(reason))
          }
          vault._actionConfirmer.confirm({
            palletName,
            extrinsicName,
            params: polkadot.addParamMetadata({
              palletName,
              extrinsicName,
              params
            }),
            docs: polkadot.extrinsicDocs({
              palletName,
              extrinsicName
            }),
            address: this.getAddress()
          },
          onConfirm,
          onCancel
          )
        })
      } else {
        // Native account/ wallet extension being used
        // no need to ask for confirmation, the wallet will
        // handle it
        return _callTx({
          _this: this,
          polkadot,
          palletName,
          extrinsicName,
          signer,
          params,
          txResponseHandler,
          sudo
        })
      }
    },
    async sign ({ polkadot, payload }) {
      this.assertIsUnlocked()
      // Vault generated substrate account in being used
      // need to ask for confirmation
      if (isKeyringPair(signer)) {
        return new Promise((resolve, reject) => {
          const onConfirm = async () => {
            try {
              const result = await _sign({
                _this: this,
                polkadot,
                payload,
                signer
              })
              resolve(result)
            } catch (error) {
              reject(error)
            }
          }
          const onCancel = (reason) => {
            reject(new Error(reason))
          }
          vault._actionConfirmer.confirm({
            payload,
            address: this.getAddress()
          },
          onConfirm,
          onCancel
          )
        })
      } else {
      // Native account/ wallet extension being used
      // no need to ask for confirmation, the wallet will
      // handle it
        return _sign({
          _this: this,
          polkadot,
          payload,
          signer
        })
      }
    },
    verifySignature ({ payload, signature }) {
      console.log('payload to verify: ', payload)
      return verifySignature({ payload, signature, signer: this.getAddress() })
    },
    getAddress () {
      this.assertIsUnlocked()
      return getAddress(signer)
    },
    assertIsUnlocked () {
      if (!this.isUnlocked()) {
        throw new Error('Signer is locked')
      }
    },
    isUnlocked () {
      return !!signer
    }
  }
}

async function _callTx ({
  _this,
  polkadot,
  palletName,
  extrinsicName,
  signer,
  params,
  txResponseHandler,
  sudo = false
}) {
  _this.assertIsUnlocked()
  return callTx({
    polkadot,
    palletName,
    extrinsicName,
    signer,
    params,
    txResponseHandler,
    sudo
  })
}

async function _sign ({ _this, polkadot, payload, signer }) {
  _this.assertIsUnlocked()
  console.log('payload to sign: ', payload)
  return sign({ polkadot, payload, signer })
}
