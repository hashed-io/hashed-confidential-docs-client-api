const { EventEmitter } = require('events')

class VaultMock extends EventEmitter {
  constructor ({
    actionConfirmer
  }) {
    super()
    this.isLocked = false
    this._actionConfirmer = actionConfirmer
  }

  async lock () {
    this.isLocked = true
    this.emit('lock')
  }

  assertIsUnlocked () {
    if (this.isLocked) {
      throw new Error('The vault is locked')
    }
  }
}

module.exports = VaultMock
