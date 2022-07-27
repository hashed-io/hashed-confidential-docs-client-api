const { decodeAddress, encodeAddress } = require('@polkadot/keyring')
const { isHex, hexToU8a, u8aToHex, u8aWrapBytes } = require('@polkadot/util')
const { signatureVerify } = require('@polkadot/util-crypto')
const { ApiPromise, WsProvider } = require('@polkadot/api')
const {
  web3Enable,
  web3FromAddress
} = require('@polkadot/extension-dapp')

class Polkadot {
  constructor (wss, appName) {
    this._wss = wss
    this.appName = appName
    this._api = null
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
   * @name signMessage
   * @description Sign a message
   * @param {String} message Message to sign
   * @param {String} signer User address
   * @returns Object
   */
  async signMessage (message, signer) {
    const injector = await this._getInjector(signer)

    // Create Message
    const wrapped = u8aWrapBytes(message)

    // Sign Message
    return injector.signer.signRaw({
      address: signer,
      data: u8aToHex(wrapped),
      type: 'bytes'
    })
  }

  /**
   * @name verifyMessage
   * @description Verify a message
   * @param {String} message Message to verify
   * @param {String} signature Signature from signMessage result
   * @param {String} signer User Address
   * @returns Object
   */
  async verifyMessage (message, signature, signer) {
    return signatureVerify(message, signature, signer)
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
    const injector = await this._getInjector(user)
    // Set signer
    this._api.setSigner(injector.signer)
  }

  async _getInjector (user) {
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
