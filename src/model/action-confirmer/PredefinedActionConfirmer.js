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
      console.log('Canceling action: ', JSON.stringify(details, null, 4))
      onCancel(this._cancelReason)
    } else {
      console.log('Confirming action: ', JSON.stringify(details, null, 4))
      onConfirm()
    }
  }
}

module.exports = PredefinedActionConfirmer
