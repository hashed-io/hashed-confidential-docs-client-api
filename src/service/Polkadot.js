const { decodeAddress, encodeAddress } = require('@polkadot/keyring')
const { isHex, hexToU8a, u8aToHex, u8aWrapBytes } = require('@polkadot/util')
const { signatureVerify } = require('@polkadot/util-crypto')
const { ApiPromise, WsProvider } = require('@polkadot/api')
const {
  web3Accounts,
  web3Enable,
  web3FromAddress
} = require('@polkadot/extension-dapp')

const defualtWallet = {
  async callTx ({
    polkadot,
    palletName,
    extrinsicName,
    params,
    signer,
    txResponseHandler,
    sudo = false
  }) {
    params = params || []
    // console.log('callTx: ', extrinsicName, signer, params)
    let finalSigner = signer
    if (!Polkadot.isKeyringPair(signer)) {
      finalSigner = this.getAddress()
      await polkadot.setWeb3Signer(finalSigner)
    }
    // console.log('callTx params', params)
    let unsub
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      try {
        const tx = polkadot.tx()
        let call = tx[palletName][extrinsicName](...params)
        if (sudo) {
          call = tx.sudo.sudo(call)
        }
        unsub = await call.signAndSend(finalSigner, (e) => txResponseHandler(e, resolve, reject, unsub))
      } catch (e) {
        reject(e)
      }
    })
  },
  async sign ({ polkadot, payload, signer }) {
    const data = u8aToHex(u8aWrapBytes(payload))
    if (Polkadot.isKeyringPair(signer)) {
      return u8aToHex(signer.sign(data))
    } else {
      const injector = await polkadot._getInjector(signer)
      return injector.signer.signRaw({
        address: signer,
        data,
        type: 'bytes'
      }).signature
    }
  },
  verifySignature ({ message, signature, signer }) {
    return signatureVerify(message, signature, signer)
  }
}
class Polkadot {
  static isKeyringPair (signer) {
    return signer.sign && signer.lock
  }

  static getAddress (signer) {
    return signer.address || signer
  }

  constructor ({
    wss = null,
    appName,
    wallet,
    api = null
  }) {
    this._wss = wss
    this.appName = appName
    this.setWallet(wallet)
    this._api = api
  }

  setWallet (wallet) {
    wallet = wallet || defualtWallet
    this._wallet = wallet
  }

  /**
   * @description Connect to WSS server and get api
   * @returns {Object}
   * { chain, nodeName, nodeVersion }
   */
  async _connect () {
    try {
      // \Initialize the provider to connect to the local node
      // console.log('connecting to ', this._wss)
      const provider = new WsProvider(this._wss)

      // Create the API and wait until ready
      // const api = new ApiPromise({ provider })
      // this.api = api
      // console.log('api', api)
      return ApiPromise.create({ provider })
      // Retrieve the chain & node information information via rpc calls
    } catch (e) {
      console.error('connect polkadot Api', e)
      throw new Error(e)
    }
  }

  async connect () {
    if (!this.isConnected()) {
      this._api = await this._connect()
    }
  }

  async callTx ({
    palletName,
    extrinsicName,
    params,
    txResponseHandler,
    signer = null,
    sudo = false
  }) {
    return this._wallet.callTx({
      polkadot: this,
      palletName,
      extrinsicName,
      params,
      txResponseHandler,
      signer,
      sudo
    })
  }

  tx () {
    return this._api.tx
  }

  query () {
    return this._api.query
  }

  isConnected () {
    return !!this._api
  }

  async chainInfo () {
    const [chain, nodeName, nodeVersion] = await Promise.all([
      this._api.rpc.system.chain(),
      this._api.rpc.system.name(),
      this._api.rpc.system.version()
    ])

    return {
      chain,
      nodeName,
      nodeVersion
    }
  }

  /**
   * @name sign
   * @description Sign a payload
   * @param {String} payload Message to sign
   * @param {String} signer User address
   * @returns Object
   */
  async sign ({
    payload,
    signer = null
  }) {
    return this._wallet.sign({
      polkadot: this,
      payload,
      signer
    })
  }

  /**
   * @name verifySignature
   * @description Verify a signature
   * @param {String} payload payload to verify
   * @param {String} signature Signature from signMessage result
   * @param {String} signer User Address
   * @returns Object
   */
  verifySignature ({
    payload,
    signature,
    signer = null
  }) {
    return this._wallet.verifySignature({
      payload,
      signature,
      signer
    })
  }

  /**
  * @name requestUsers
  * @description Return available accounts from web3Accounts
  * @returns {Array}
  * [{ address, meta: { genesisHash, name, source }, type }]
  */
  async requestUsers () {
    // (this needs to be called first, before other requests)
    await web3Enable(process.env.APP_NAME)
    // meta.source contains the name of the extension that provides this account
    return web3Accounts()
  }

  /**
   * @name isValidPolkadotAddress
   * @description Return a boolean to indicate if is a valid polkadot address
   * @param {String} address polkadot Address
   * @returns Boolean
   */
  isValidPolkadotAddress (address) {
    try {
      encodeAddress(
        isHex(address)
          ? hexToU8a(address)
          : decodeAddress(address)
      )
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * @name getAccountInfo
   * @description Get user details info
   * @param {*} user User address
   * @returns { Object }
   * { identity }
   */
  getAccountInfo (user) {
    return this._api.derive.accounts.info(user)
  }

  /**
   * @name setSigner
   * @description Set signer from web3FromAddress using web 3 plugin
   * @param {String} user User address
   */
  async setWeb3Signer (user) {
    const injector = await this.getInjector(user)
    // Set signer
    this._api.setSigner(injector.signer)
  }

  async getInjector (user) {
    // Enable web3 plugin
    await web3Enable(this.appName)
    // Get injector to call a Extrinsic
    return web3FromAddress(user)
  }

  async disconnect () {
    if (this.isConnected()) {
      await this._api.disconnect()
      delete this._api
    }
  }
}

module.exports = Polkadot
