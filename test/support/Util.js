const { Keyring } = require('@polkadot/api')
const { IPFS, Polkadot } = require('../../src/service')

class Util {
  constructor () {
    this.keyring = new Keyring()
  }

  getKeypair (suri) {
    return this.keyring.addFromUri(suri, {}, 'sr25519')
  }

  setupIPFS () {
    return new IPFS({
      url: 'https://ipfs.infura.io:5001'
    })
  }

  async setupPolkadot () {
    const polkadot = new Polkadot('ws://127.0.0.1:9944', 'Confidential Docs')
    await polkadot.connect()
    polkadot.setWeb3Signer = async function () {}
    polkadot.signMessage = async (message, signer) => {
      const keyPair = signer.address ? signer : this.keyring.getPair(signer)
      console.log('keyPair message: ', message)
      console.log('keyPair address: ', keyPair.address)
      return keyPair.sign(message)
    }
    return polkadot
  }

  getSSOUserDetails (id) {
    return {
      ssoProvider: 'google',
      ssoUserId: `1232323#${id}`,
      password: `Str15n$g3#${id}`
    }
  }
}

module.exports = Util
