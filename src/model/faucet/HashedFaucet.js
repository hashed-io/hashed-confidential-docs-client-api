const BaseFaucet = require('./BaseFaucet')
const { Fetch } = require('../../service')

class HashedFaucet extends BaseFaucet {
  constructor (url) {
    super()
    this._fetch = new Fetch(url)
  }

  async send ({ authName, address, jwt, signature }) {
    // console.log(`Sending amount: ${this._amount} to address: ${address}`)
    return this._fetch.post('/api/distribution/distribute', {
      authName,
      address,
      jwt,
      signature
    })
  }
}

module.exports = HashedFaucet
