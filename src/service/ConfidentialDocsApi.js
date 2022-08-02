const BasePolkadotApi = require('./BasePolkadotApi')

class ConfidentialDocsApi extends BasePolkadotApi {
  constructor (polkadotApi, notify) {
    super(polkadotApi, 'confidentialDocs', notify)
  }

  async setVault ({ signer, userId, publicKey, cid }) {
    return this.callTx({
      extrinsicName: 'setVault',
      signer,
      params: [userId, publicKey, cid]
    })
  }

  async setOwnedDoc ({ signer, ownedDoc }) {
    console.log('set owned doc, signer: ', signer, ownedDoc)
    return this.callTx({
      extrinsicName: 'setOwnedDocument',
      signer,
      params: [ownedDoc]
    })
  }

  async sharedDoc ({ signer, sharedDoc }) {
    return this.callTx({
      extrinsicName: 'shareDocument',
      signer,
      params: [sharedDoc]
    })
  }

  async findVault (userId) {
    const { value } = await this.exQuery('vaults', [userId])
    return value.toHuman()
  }

  async getVault (userId) {
    const vault = await this.findVault(userId)
    if (!vault) {
      throw new Error(`User with id: ${userId} does not have a vault`)
    }
    return vault
  }

  async findPublicKey (address) {
    const { value } = await this.exQuery('publicKeys', [address])
    return value.toHuman()
  }

  async getPublicKey (address) {
    const publicKey = await this.findPublicKey(address)
    if (!publicKey) {
      throw new Error(`User: ${address} does not have a public key`)
    }
    return publicKey
  }

  async findOwnedDoc (cid, requestor = null) {
    const { value } = await this.exQuery('ownedDocs', [cid])
    const doc = value.toHuman()
    if (doc && requestor) {
      if (doc.owner !== requestor) {
        throw new Error(`${requestor} is not owner of doc with cid: ${cid}`)
      }
    }
    return doc
  }

  async getOwnedDoc (cid, requestor = null) {
    const doc = await this.findOwnedDoc(cid, requestor)
    if (!doc) {
      throw new Error(`Owned doc: ${cid} does not exist`)
    }
    return doc
  }

  async findSharedDoc (cid, requestor) {
    const { value } = await this.exQuery('sharedDocs', [cid])
    const doc = value.toHuman()
    if (doc && requestor) {
      if (doc.to !== requestor && doc.from !== requestor) {
        throw new Error(`${requestor} is not sharer nor the sharee of doc with cid: ${cid}`)
      }
    }
    return doc
  }

  async getSharedDoc (cid, requestor) {
    const doc = await this.findSharedDoc(cid, requestor)
    if (!doc) {
      throw new Error(`Shared doc: ${cid} does not exist`)
    }
    return doc
  }

  async killStorage (signer) {
    return this.callTx({
      extrinsicName: 'killStorage',
      signer,
      sudo: true
    })
  }
}

module.exports = ConfidentialDocsApi
