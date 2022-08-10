const { Keyring } = require('@polkadot/keyring')
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
      url: 'https://ipfs.infura.io:5001',
      authHeader: `Basic ${Buffer.from('2DB4cZf2ac86npYl2XnStjUg0Y9:a21bdbee67c178407ab9740f5102a4e1').toString('base64')}`
    })
  }

  async setupPolkadot () {
    const polkadot = new Polkadot({ wss: 'ws://127.0.0.1:9944', appName: 'Confidential Docs' })
    await polkadot.connect()
    polkadot.setWeb3Signer = async function () {}
    polkadot.signMessage = async (message, signer) => {
      const keyPair = signer.address ? signer : this.keyring.getPair(signer)
      // console.log('keyPair message: ', message)
      // console.log('keyPair address: ', keyPair.address)
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
