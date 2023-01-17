const BasePolkadotApi = require('./BasePolkadotApi')

class ConfidentialDocsApi extends BasePolkadotApi {
  constructor (polkadot, notify) {
    super(polkadot, 'confidentialDocs', notify)
  }

  async setVault ({ signer = null, userId, publicKey, cid }) {
    return this.callTx({
      extrinsicName: 'setVault',
      signer,
      params: [userId, publicKey, cid]
    })
  }

  async setOwnedDoc ({ signer = null, ownedDoc }) {
    return this.callTx({
      extrinsicName: 'setOwnedDocument',
      signer,
      params: [ownedDoc]
    })
  }

  async removeOwnedDoc ({ signer = null, cid }) {
    return this.callTx({
      extrinsicName: 'removeOwnedDocument',
      signer,
      params: [cid]
    })
  }

  async sharedDoc ({ signer = null, sharedDoc }) {
    return this.callTx({
      extrinsicName: 'shareDocument',
      signer,
      params: [sharedDoc]
    })
  }

  async updateSharedDocMetadata ({ signer = null, sharedDoc }) {
    return this.callTx({
      extrinsicName: 'updateSharedDocumentMetadata',
      signer,
      params: [sharedDoc]
    })
  }

  async removeSharedDoc ({ signer = null, cid }) {
    return this.callTx({
      extrinsicName: 'removeSharedDocument',
      signer,
      params: [cid]
    })
  }

  async createGroup ({ signer = null, group, name, publicKey, cid }) {
    return this.callTx({
      extrinsicName: 'createGroup',
      signer,
      params: [group, name, publicKey, cid]
    })
  }

  async addGroupMember ({ signer = null, groupMember }) {
    return this.callTx({
      extrinsicName: 'addGroupMember',
      signer,
      params: [groupMember]
    })
  }

  async removeGroupMember ({ signer = null, group, member }) {
    return this.callTx({
      extrinsicName: 'removeGroupMember',
      signer,
      params: [group, member]
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

  async getOwnedCIDs (address, subTrigger) {
    const response = await this.exQuery('ownedDocsByOwner', [address], subTrigger)
    return subTrigger ? response : response.toHuman()
  }

  async findOwnedDocsByCIDs (cids) {
    cids = Array.isArray(cids) ? cids : [cids]
    const response = await this.exMultiQuery('ownedDocs', cids)
    return response.map(r => r.toHuman())
  }

  async getOwnedDocs (address, subTrigger) {
    if (subTrigger) {
      return this.getOwnedCIDs(address, async (cids) => {
        subTrigger(await this.findOwnedDocsByCIDs(cids))
      })
    }
    const cids = await this.getOwnedCIDs(address)
    return this.findOwnedDocsByCIDs(cids)
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

  async getSharedWithMeCIDs (address, subTrigger) {
    const response = await this.exQuery('sharedDocsByTo', [address], subTrigger)
    return subTrigger ? response : response.toHuman()
  }

  async findSharedDocsByCIDs (cids) {
    cids = Array.isArray(cids) ? cids : [cids]
    const response = await this.exMultiQuery('sharedDocs', cids)
    return response.map(r => r.toHuman())
  }

  async getSharedWithMeDocs (address, subTrigger) {
    if (subTrigger) {
      return this.getSharedWithMeCIDs(address, async (cids) => {
        subTrigger(await this.findSharedDocsByCIDs(cids))
      })
    }
    const cids = await this.getSharedWithMeCIDs(address)
    return this.findSharedDocsByCIDs(cids)
  }

  async getSharedCIDs (address, subTrigger) {
    const response = await this.exQuery('sharedDocsByFrom', [address], subTrigger)
    return subTrigger ? response : response.toHuman()
  }

  async getSharedDocs (address, subTrigger) {
    if (subTrigger) {
      return this.getSharedCIDs(address, async (cids) => {
        subTrigger(await this.findSharedDocsByCIDs(cids))
      })
    }
    const cids = await this.getSharedCIDs(address)
    return this.findSharedDocsByCIDs(cids)
  }

  async findGroup (groupId) {
    const { value } = await this.exQuery('groups', [groupId])
    return value.toHuman()
  }

  async getGroup (groupId) {
    const group = await this.findGroup(groupId)
    if (!group) {
      throw new Error(`Group: ${groupId} does not exist`)
    }
    return group
  }

  async findGroupMember (groupId, memberId) {
    const { value } = await this.exQuery('groupMembers', [groupId, memberId])
    return value.toHuman()
  }

  async getGroupMember (groupId, memberId) {
    const groupMember = await this.findGroupMember(groupId, memberId)
    if (!groupMember) {
      throw new Error(`No member: ${memberId} in group: ${groupId}`)
    }
    return groupMember
  }

  async getMemberGroupIds (memberId, subTrigger) {
    const response = await this.exQuery('memberGroups', [memberId], subTrigger)
    return subTrigger ? response : response.toHuman()
  }

  async findGroupsByIds (groupIds) {
    groupIds = Array.isArray(groupIds) ? groupIds : [groupIds]
    const response = await this.exMultiQuery('memberGroups', groupIds)
    return response.map(r => r.toHuman())
  }

  async getMemberGroups (memberId, subTrigger) {
    if (subTrigger) {
      return this.getMemberGroupIds(memberId, async (groupIds) => {
        subTrigger(await this.findGroupsByIds(groupIds))
      })
    }
    const groupIds = await this.getMemberGroupIds(memberId)
    return this.findGroupsByIds(groupIds)
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
