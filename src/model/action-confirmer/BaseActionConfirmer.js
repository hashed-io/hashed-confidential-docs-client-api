class BaseActionConfirmer {
  confirm (details, onConfirm, onCancel) {
    throw new Error('subclasses must override confirm method')
  }
}

module.exports = BaseActionConfirmer
