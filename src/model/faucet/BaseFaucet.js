class BaseFaucet {
  async send ({ authName, address, jwt, signature }) {
    throw new Error('Subclass must override the send method')
  }
}

module.exports = BaseFaucet
