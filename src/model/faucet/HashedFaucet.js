const BaseFaucet = require('./BaseFaucet')

class HashedFaucet extends BaseFaucet {
  constructor (url) {
    super()
    this._url = new URL('/api/distribution/distribute', url)
  }

  async send ({ authName, address, jwt, signature }) {
    // console.log(`Sending amount: ${this._amount} to address: ${address}`)
    return fetch(this._url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        authName,
        address,
        jwt,
        signature
      })
    })
  }
}

module.exports = HashedFaucet
