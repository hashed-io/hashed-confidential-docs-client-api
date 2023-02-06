const find = require('find-process')
const sleep = require('await-sleep')
const { blake2AsHex } = require('@polkadot/util-crypto')
const { spawn } = require('node:child_process')
const { Keyring } = require('@polkadot/keyring')
const { GroupRole } = require('../../src/const')
const { createPasswordVaultAuthProvider, BaseJWTVaultAuthProvider } = require('../../src/model/auth-providers')
const { IPFS, Polkadot } = require('../../src/service')

class Util {
  constructor () {
    this.keyring = new Keyring()
    this.nodeProcess = null
  }

  async restartNode () {
    await this.killNode()
    await this.startNode()
  }

  async startNode () {
    this.nodeProcess = spawn(
      process.env.HASHED_NODE_BIN,
      [
        '--dev'
      ]
    )
    this.nodeProcess.on('exit', (code) => {
      console.error(`Node process exited on its own with code: ${code}`)
      this.nodeProcess = null
    })
    const p = new Promise((resolve, reject) => {
      this.nodeProcess.stderr.on('data', (data) => {
        if (data.toString('utf8').includes('Starting consensus session')) {
          this.nodeProcess.stderr.removeAllListeners('data')
          resolve()
        }
      })
      this.nodeProcess.once('error', (err) => {
        console.error('failed spawning node', err)
        reject(err)
      })
    })
    await p
  }

  async killNode () {
    if (this.nodeProcess) {
      this.nodeProcess.removeAllListeners()
      this.nodeProcess.stderr.removeAllListeners()
    }
    do {
      const pss = await find('name', '/home/sebastian/vsc-workspace/hashed-substrate/target/release/hashed')
      if (pss.length === 0) {
        return
      }
      for (const ps of pss) {
        process.kill(ps.pid, 'SIGTERM')
      }
      await sleep(1000)
    } while (true)

    // if (this.nodeProcess && !this.nodeProcess.killed) {
    //   this.nodeProcess.removeAllListeners('exit')
    //   const p = new Promise((resolve, reject) => {
    //     this.nodeProcess.on('close', () => {
    //       resolve()
    //     })
    //     this.nodeProcess.on('error', (err) => {
    //       console.error('failed killing node', err)
    //       reject(err)
    //     })
    //   })
    //   this.nodeProcess.kill()
    //   await p
    // }
  }

  // async killNode () {
  //   if (this.nodeProcess && !this.nodeProcess.killed) {
  //     this.nodeProcess.removeAllListeners('exit')
  //     const p = new Promise((resolve, reject) => {
  //       this.nodeProcess.on('close', () => {
  //         resolve()
  //       })
  //       this.nodeProcess.on('error', (err) => {
  //         console.error('failed killing node', err)
  //         reject(err)
  //       })
  //     })
  //     this.nodeProcess.kill()
  //     await p
  //   }
  //   if (this.nodeProcess) {
  //     this.nodeProcess.removeAllListeners()
  //     this.nodeProcess.stderr.removeAllListeners()
  //   }
  // }

  getKeypair (suri) {
    return this.keyring.addFromUri(suri, {}, 'sr25519')
  }

  setupIPFS () {
    return new IPFS({
      url: 'https://ipfs.infura.io:5001',
      authHeader: this.getIPFSAuthHeader()
    })
  }

  getIPFSAuthHeader () {
    return `Basic ${Buffer.from(`${process.env.IPFS_PROJECT_ID}:${process.env.IPFS_PROJECT_SECRET}`).toString('base64')}`
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

  async getPasswordVaultAuthProvider (id, password) {
    jest.spyOn(BaseJWTVaultAuthProvider, 'verifyJWT')
      .mockResolvedValue(this.getDecodedJWT(id))
    const providerDetails = this.getPasswordProviderDetails(id, password)
    return {
      providerDetails,
      authProvider: await createPasswordVaultAuthProvider(providerDetails)
    }
  }

  getPasswordProviderDetails (id, password = null) {
    password = password || `Str15n$g3#${id}`
    return {
      authName: 'afloat',
      jwt: `jwt${id}`,
      faucetServerUrl: `http://localhost${id}:3000`,
      password
    }
  }

  getDecodedJWT (id) {
    return {
      sub: `1232323#${id}`,
      email: `test${id}@test.com`
    }
  }

  getGroupDetails (signer, groupSigner, id) {
    return {
      signer,
      groupAddress: groupSigner.address,
      name: `group ${id}`,
      cid: `cid ${id}`,
      publicKey: blake2AsHex(`public key ${id}`)
    }
  }

  getGroupFromDetails ({
    name,
    groupAddress,
    signer
  }) {
    return {
      name,
      group: groupAddress,
      creator: signer.address
    }
  }

  getGroupMemberFromDetails ({
    cid,
    groupAddress,
    signer
  }) {
    return {
      cid,
      group: groupAddress,
      authorizer: signer.address,
      member: signer.address,
      role: GroupRole.OWNER
    }
  }
}

module.exports = Util
