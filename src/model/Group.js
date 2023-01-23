const { Keyring } = require('@polkadot/keyring')
const { mnemonicGenerate } = require('@polkadot/util-crypto')
const BaseConfidentialData = require('./BaseConfidentialData')

/**
 * Provides the functionality for managing groups that enable
 * the sharing of files with multiple users at the same time
 */
class Group extends BaseConfidentialData {
  /**
   * @desc Finds a group record by account
   *
   * @param {string} groupAddress
   * @return {Object|null} with the following structure
   * {
   *  "name": "name",
   *  "group": "5FSuxe2q7qCYKie8yqmM56U4ovD1YtBb3DoPzGKjwZ98vxua",
   *  "creator": "5FWtfhKTuGKm9yWqzApwTfiUL4UPWukJzEcCTGYDiYHsdKaG"
   * }
   */
  async findGroup (groupAddress) {
    return this._api().findGroup(groupAddress)
  }

  /**
   * @desc Gets a group record by account
   *
   * @param {string} groupAddress
   * @return {Object} with the following structure
   * {
   *  "name": "name",
   *  "group": "5FSuxe2q7qCYKie8yqmM56U4ovD1YtBb3DoPzGKjwZ98vxua",
   *  "creator": "5FWtfhKTuGKm9yWqzApwTfiUL4UPWukJzEcCTGYDiYHsdKaG"
   * }
   * @throw error if the group does not exist
   */
  async getGroup (groupAddress) {
    return this._api().getGroup(groupAddress)
  }

  /**
   * @desc Finds a group member record
   *
   * @param {string} groupAddress group account
   * @param {string} memberAddress member account
   * @return {Object|null} with the following structure
   * {
   *  "name": "name",
   *  "group": "5FSuxe2q7qCYKie8yqmM56U4ovD1YtBb3DoPzGKjwZ98vxua",
   *  "member": "5FWtfhKTuGKm9yWqzApwTfiUL4UPWukJzEcCTGYDiYHsdKaG",
   *  "authorizer": "5FWtfhKTuGKm9yWqzApwTfiUL4UPWukJzEcCTGYDiYHsdFaG",
   *  "role": "Admin"
   *  "cid":"QmeHEb5TF4zkP2H6Mg5TcrvDs5egPCJgWFBB7YZaLmK7jr"
   * }
   */
  async findGroupMember (groupAddress, memberAddress) {
    return this._api().findGroupMember(groupAddress, memberAddress)
  }

  /**
   * @desc Gets a group member record
   *
   * @param {string} groupAddress group account
   * @param {string} memberAddress member account
   * @return {Object} with the following structure
   * {
   *  "name": "name",
   *  "group": "5FSuxe2q7qCYKie8yqmM56U4ovD1YtBb3DoPzGKjwZ98vxua",
   *  "member": "5FWtfhKTuGKm9yWqzApwTfiUL4UPWukJzEcCTGYDiYHsdKaG",
   *  "authorizer": "5FWtfhKTuGKm9yWqzApwTfiUL4UPWukJzEcCTGYDiYHsdFaG",
   *  "role": "Admin",
   *  "cid":"QmeHEb5TF4zkP2H6Mg5TcrvDs5egPCJgWFBB7YZaLmK7jr"
   * }
   * @throws error if group or member do not exist
   */
  async getGroupMember (groupAddress, memberAddress) {
    return this._api().getGroupMember(groupAddress, memberAddress)
  }

  /**
   * @desc Gets a group member record and decorates it with the ipfs payload
   * and the authorizer publicKey
   *
   * @param {string} groupAddress group account
   * @param {string} memberAddress member account
   * @return {Object} with the following structure
   * {
   *  "name": "name",
   *  "group": "5FSuxe2q7qCYKie8yqmM56U4ovD1YtBb3DoPzGKjwZ98vxua",
   *  "member": "5FWtfhKTuGKm9yWqzApwTfiUL4UPWukJzEcCTGYDiYHsdKaG",
   *  "authorizer": "5FWtfhKTuGKm9yWqzApwTfiUL4UPWukJzEcCTGYDiYHsdFaG",
   *  "autorizerPublicKey":"publickey",
   *  "role": "Admin",
   *  "cid":"QmeHEb5TF4zkP2H6Mg5TcrvDs5egPCJgWFBB7YZaLmK7jr",
   *  "payload":"...payload..."
   * }
   * @throws error if group or member do not exist
   */
  async getGroupMemberDecorated (groupAddress, memberAddress) {
    const groupMember = await this._api().getGroupMember(groupAddress, memberAddress)
    groupMember.authorizerPublicKey = await this._api().getPublicKey(groupMember.authorizer)
    groupMember.cipheredPayload = await this._ipfs.cat(groupMember.cid)
    return groupMember
  }

  /**
   * @desc Gets the groups a user is member of, if a subTrigger
   * function is provided a subscription is made gets all the updates, in this case
   * the function returns a function to unsubscribe, if no subTrigger function is provided
   * then the function returns the current shared documents
   *
   * @param {string} memberAddress user account
   * @param {function} [subTrigger] function that handles subscription updates
   * @return {Array|function} returns array of groups if no subTrigger is provided,
   * if it is provided a function to unsubscribe is returned
   * [{
   *  "name": "name",
   *  "group": "5FSuxe2q7qCYKie8yqmM56U4ovD1YtBb3DoPzGKjwZ98vxua",
   *  "creator": "5FWtfhKTuGKm9yWqzApwTfiUL4UPWukJzEcCTGYDiYHsdKaG"
   * }]
   */
  async getMemberGroups (memberAddress, subTrigger) {
    return this._confidentialDocsApi.getMemberGroups(memberAddress, subTrigger)
  }

  /**
   * @desc Creates a new group with the logged in user as the owner
   *
   * @param {string} name of the group
   * @return {Object} with the following structure containing data related to the
   * newly created group
   * {
   *  "name": "name",
   *  "group": "5FSuxe2q7qCYKie8yqmM56U4ovD1YtBb3DoPzGKjwZ98vxua",
   *  "creator": "5FWtfhKTuGKm9yWqzApwTfiUL4UPWukJzEcCTGYDiYHsdKaG"
   * }
   */
  async createGroup (name) {
    const groupAddress = generateNewGroupAddress()
    const keyPair = this._vault._crypto.generateKeyPair()
    const { publicKey } = keyPair
    const cipheredPayload = await this._cipher().cipherFor({ payload: keyPair, publicKey })
    const cid = await this._ipfs.add(cipheredPayload)
    await this._api().createGroup({
      groupAddress,
      name,
      publicKey,
      cid
    })
    return {
      group: groupAddress,
      name,
      creator: this._address()
    }
  }

  /**
   * @desc Adds a member to the specified group, only owners and admins are
   * able to add members
   *
   * @param {string} groupAddress account of the group
   * @param {string} memberAddress account of the member
   * @param {string} role that the member should have in the group
   * @throws an error in case the group does not exist, the member does not have a public key
   * or the authorizer does not have the permissions to add a member to the group
   */
  async addGroupMember ({
    groupAddress,
    memberAddress,
    role
  }) {
    const groupMember = await this.getGroupMemberDecorated(groupAddress, this._address())
    this.assertCanManageUsers(groupMember)
    const payload = await this._cipher().decipherFrom({
      fullCipheredPayload: groupMember.cipheredPayload,
      publicKey: groupMember.authorizerPublicKey
    })
    const memberPublicKey = await this._api().getPublicKey(memberAddress)
    const cipheredPayload = await this._cipher().cipherFor({ payload, memberPublicKey })
    const cid = await this._ipfs.add(cipheredPayload)
    return this._api().addGroupMember({
      groupMember: {
        cid,
        group: groupAddress,
        member: memberAddress,
        authorizer: this._address(),
        role
      }
    })
  }

  /**
   * @desc Removes a member from the specified group, only owners and admins are
   * able to remove members
   *
   * @param {string} groupAddress account of the group
   * @param {string} memberAddress account of the member
   * @throws an error in case the group does not exist, the member does not have a public key
   * or the authorizer does not have the permissions to remove a member from the group
   */
  async removeGroupMember ({
    groupAddress,
    memberAddress
  }) {
    return this._api().removeGroupMember({
      groupAddress,
      memberAddress
    })
  }

  assertCanManageUsers (groupMember) {
    if (groupMember.role !== 'Owner' || groupMember.role !== 'Admin') {
      throw new Error(`You are not allowed to manage members for group: ${groupMember.group}`)
    }
  }
}

function generateNewGroupAddress () {
  return new Keyring().addFromUri(mnemonicGenerate(), {}, 'sr25519').address
}

module.exports = Group
