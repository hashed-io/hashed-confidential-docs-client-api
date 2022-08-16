
const { BaseWallet, callTx, sign, getAddress, verifySignature, isKeyringPair } = require('./BaseWallet')

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

  async sign ({ polkadot, payload }) {
    return this._wallet.sign({
      polkadot,
      payload
    })
  }

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
            params,
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
