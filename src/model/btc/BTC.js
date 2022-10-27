const btc = require('bitcoinjs-lib')

function createBTC ({
  vault,
  xkey
}) {
  vault.once('lock', () => {
    xkey = null
  })
  return {
    fullXPUBMultisig () {
      this.assertIsUnlocked()
      return xkey.fullXPUBMultisig()
    },

    fullXPUB () {
      this.assertIsUnlocked()
      return xkey.fullXPUB()
    },

    /**
     *
     * @param {string} psbt base64 encoded
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
          psbtText
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
    }

  }
}

module.exports = createBTC
