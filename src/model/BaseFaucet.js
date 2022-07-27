class BaseFaucet {
  async send (address) {
    throw new Error('Subclass must override the send method')
  }
}

module.exports = BaseFaucet
