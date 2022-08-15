const BaseActionConfirmer = require('./BaseActionConfirmer')

class PredefinedActionConfirmer extends BaseActionConfirmer {
  constructor (cancelReason = null) {
    super()
    this.setCancelReason(cancelReason)
  }

  setCancelReason (cancelReason) {
    this._cancelReason = cancelReason
  }

  clearCancelReason () {
    this.setCancelReason(null)
  }

  confirm (details, onConfirm, onCancel) {
    if (this._cancelReason) {
      console.log('Canceling action: ', details)
      onCancel(this._cancelReason)
    } else {
      console.log('Confirming action: ', details)
      onConfirm()
    }
  }
}

module.exports = PredefinedActionConfirmer
