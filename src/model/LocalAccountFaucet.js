class LocalAccountFaucet {
  constructor ({
    signer,
    balancesApi,
    amount

  }) {
    this._signer = signer
    this._balancesApi = balancesApi
    this._amount = amount
  }

  async send (address) {
    console.log(`Sending amount: ${this._amount} to address: ${address}`)
    return this._balancesApi.transfer({
      signer: this._signer,
      dest: address,
      value: this._amount
    })
  }
}

module.exports = LocalAccountFaucet
