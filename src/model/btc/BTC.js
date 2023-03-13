const btc = require('bitcoinjs-lib')
const { ActionType } = require('../../const')

function createBTC ({
  vault,
  xkey
}) {
  vault.once('lock', () => {
    xkey = null
  })
  return {
    /**
     * Returns the full multisig XPUB for the logged in user in string format.
     * The xpub includes the master finger print and the derivation path
     *
     *
     * @return {string} full multisig xpub
     */
    fullXPUBMultisig () {
      this.assertIsUnlocked()
      return xkey.fullXPUBMultisig()
    },

    /**
     * Returns the full XPUB for the logged in user in string format.
     * The xpub includes the master finger print and the derivation path
     *
     * @param {string} psbt base64 encoded
     * @return {string} full xpub
     */
    fullXPUB () {
      this.assertIsUnlocked()
      return xkey.fullXPUB()
    },

    /**
     * Gets the trx info for the psbt
     *
     * @param {string} psbt base64 encoded
     * @return {Object} with the following structure:
     */
    getTrxInfoFromPSBTText (psbtText) {
      this.assertIsUnlocked()
      const psbt = btc.Psbt.fromBase64(psbtText)
      return this.getTrxInfoFromPSBT(psbt)
    },

    /**
     * Gets the trx info for the psbt
     *
     * @param {Object} psbt object
     * @return {Object} with the following structure:
     */
    getTrxInfoFromPSBT (psbt) {
      this.assertIsUnlocked()
      const inputs = this.getTrxInputsFromPSBT(psbt)
      const outputs = this.getTrxOutputsFromPSBT(psbt)
      return {
        inputs,
        outputs,
        fee: this._calculateFee(inputs, outputs)
      }
    },

    getTrxInputsFromPSBT (psbt) {
      const inputs = []
      psbt.data.inputs.forEach((input, index) => {
        if (input.witnessUtxo) {
          try {
            inputs.push({
              address: btc.address.fromOutputScript(input.witnessUtxo.script, xkey.network),
              value: input.witnessUtxo.value
            })
          } catch (err) {
            // console.log('input: ', JSON.stringify(input, null, 4))
            // console.log('asm: ', btc.script.toASM(input.witnessUtxo.script))
            if (!err.message.includes('OP_1 has no matching Address')) {
              throw err
            }
          }
        } else if (input.nonWitnessUtxo) {
          const txin = psbt.txInputs[index]
          const txout = btc.Transaction.fromBuffer(input.nonWitnessUtxo).outs[txin.index]
          inputs.push({
            address: btc.address.fromOutputScript(txout.script, xkey.network),
            value: txout.value
          })
        } else {
          throw new Error('Could not get input of #' + index)
        }
      })
      return inputs
    },

    getTrxOutputsFromPSBT (psbt) {
      return psbt.txOutputs.map(o => ({
        address: btc.address.fromOutputScript(o.script, xkey.network),
        value: o.value
      }))
    },

    /**
     * Signs the psbt with the logged in users key
     *
     * @param {string} psbt base64 encoded
     * @return {string} signed psbt base64 encoded
     */
    async signPSBT (psbtText) {
      this.assertIsUnlocked()
      const psbt = btc.Psbt.fromBase64(psbtText)
      return new Promise((resolve, reject) => {
        const onConfirm = async () => {
          try {
            await psbt.signAllInputsHDAsync(xkey.master())
            resolve(psbt.toBase64())
          } catch (error) {
            reject(error)
          }
        }
        const onCancel = (reason) => {
          reject(new Error(reason))
        }
        vault._actionConfirmer.confirm({
          actionType: ActionType.SIGN_PSBT,
          payload: this.getTrxInfoFromPSBT(psbt)
        },
        onConfirm,
        onCancel
        )
      })
    },

    assertIsUnlocked () {
      if (!this.isUnlocked()) {
        throw new Error('BTC object is locked')
      }
    },
    isUnlocked () {
      return !!xkey
    },

    _calculateFee (inputs, outputs) {
      return this._sumUTXOs(inputs) - this._sumUTXOs(outputs)
    },

    _sumUTXOs (utxos) {
      return utxos.reduce((sum, utxo) => sum + utxo.value, 0)
    }

  }
}

module.exports = createBTC
