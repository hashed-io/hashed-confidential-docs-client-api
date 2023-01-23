const BaseConfidentialData = require('./BaseConfidentialData')

/**
 * Provides the functionality for managing shared private data
 * from the sharer and sharee perspectives
 */
class SharedData extends BaseConfidentialData {
  /**
   * @desc Finds a shared data record by cid
   *
   * @param {string} cid
   * @return {Object|null} with the following structure
   * {
   *  "cid": "QmeHEb5TF4zkP2H6Mg5TcrvDs5egPCJgWFBB7YZaLmK7jr",
   *  "name": "name",
   *  "description": "desc",
   *  "to": "5FSuxe2q7qCYKie8yqmM56U4ovD1YtBb3DoPzGKjwZ98vxua",
   *  "from": "5FWtfhKTuGKm9yWqzApwTfiUL4UPWukJzEcCTGYDiYHsdKaG"
   * }
   */
  async findByCID (cid) {
    return this._api().findSharedDoc(cid)
  }

  /**
   * @desc Gets a shared data record by cid, throws error if the record is not found or
   * if the logged in user is not the "to" or "from" user
   *
   * @param {string} cid
   * @return {Object} with the following structure
   * {
   *  "cid": "QmeHEb5TF4zkP2H6Mg5TcrvDs5egPCJgWFBB7YZaLmK7jr",
   *  "name": "name",
   *  "description": "desc",
   *  "to": "5FSuxe2q7qCYKie8yqmM56U4ovD1YtBb3DoPzGKjwZ98vxua",
   *  "from": "5FWtfhKTuGKm9yWqzApwTfiUL4UPWukJzEcCTGYDiYHsdKaG"
   * }
   * @throws error if the record is not found or
   * if the logged in user is not the "to" or "from" user
   */
  async getByCID (cid) {
    return this._api().getSharedDoc(cid, this._address())
  }

  /**
   * @desc Gets the metadata of the documents that the user has shared, if a subTrigger
   * function is provided a subscription is made gets all the updates, in this case
   * the function returns a function to unsubscribe, if no subTrigger function is provided
   * then the function returns the current shared documents
   *
   * @param {string} address of the user who shared the documents
   * @param {function} [subTrigger] function that handles subscription updates
   * @return {Array|function} returns array of shared documents if no subTrigger is provided,
   * if it is provided a function to unsubscribe is returned
   * [{
   *  "cid": "QmeHEb5TF4zkP2H6Mg5TcrvDs5egPCJgWFBB7YZaLmK7jr",
   *  "name": "name",
   *  "description": "desc",
   *  "to": "5FSuxe2q7qCYKie8yqmM56U4ovD1YtBb3DoPzGKjwZ98vxua",
   *  "from": "5FWtfhKTuGKm9yWqzApwTfiUL4UPWukJzEcCTGYDiYHsdKaG"
   * }]
   */
  async getSharedDocs (address, subTrigger) {
    return this._confidentialDocsApi.getSharedDocs(address, subTrigger)
  }

  /**
   * @desc Gets the metadata of the documents shared with the user, if a subTrigger
   * function is provided a subscription is made gets all the updates, in this case
   * the function returns a function to unsubscribe, if no subTrigger function is provided
   * then the function returns the current shared documents
   *
   * @param {string} address of the user the documents were shared with
   * @param {function} [subTrigger] function that handles subscription updates
   * @return {Array|function} returns array of shared documents if no subTrigger is provided,
   * if it is provided a function to unsubscribe is returned
   * [{
   *  "cid": "QmeHEb5TF4zkP2H6Mg5TcrvDs5egPCJgWFBB7YZaLmK7jr",
   *  "name": "name",
   *  "description": "desc",
   *  "to": "5FSuxe2q7qCYKie8yqmM56U4ovD1YtBb3DoPzGKjwZ98vxua",
   *  "from": "5FWtfhKTuGKm9yWqzApwTfiUL4UPWukJzEcCTGYDiYHsdKaG"
   * }]
   */
  async getSharedWithMeDocs (address, subTrigger) {
    return this._confidentialDocsApi.getSharedWithMeDocs(address, subTrigger)
  }

  /**
   * @desc Creates a new shared data record for the specified payload, the data is shared with the
   * user specified by the toUserAddress parameter
   *
   * @param {string} toUserAddress
   * @param {string} name
   * @param {string} description
   * @param {Object|File} payload to be ciphered and stored
   * @return {Object} with the following structure containing data related to the
   * newly created owned data and shared data records
   * {
   *  "cid": "QmeHEb5TF4zkP2H6Mg5TcrvDs5egPCJgWFBB7YZaLmK7jr",
   *  "name": "name",
   *  "description": "desc",
   *  "to": "5FSuxe2q7qCYKie8yqmM56U4ovD1YtBb3DoPzGKjwZ98vxua",
   *  "from": "5FWtfhKTuGKm9yWqzApwTfiUL4UPWukJzEcCTGYDiYHsdKaG"
   * }
   */
  async share ({
    toUserAddress,
    name,
    description,
    payload
  }) {
    const publicKey = await this._api().getPublicKey(toUserAddress)
    const cipheredPayload = await this._cipher().cipherFor({ payload, publicKey })
    const cid = await this._ipfs.add(cipheredPayload)
    const sharedDoc = {
      name,
      description,
      cid,
      from: this._address(),
      to: toUserAddress
    }
    await this._api().sharedDoc({
      sharedDoc
    })
    return sharedDoc
  }

  /**
   * @desc Updates the metadata of the specified shared document, only the user
   * with whom the file was shared can update it
   *
   * @param {string} cid of the document to update
   * @param {string} name
   * @param {string} description
   * @return {Object} tx response from polkadot api
   */
  async updateMetadata ({
    cid,
    name,
    description
  }) {
    return this._confidentialDocsApi.updateSharedDocMetadata({
      sharedDoc: {
        cid,
        name,
        description
      }
    })
  }

  /**
   * @desc Removes the specified shared document for the logged in user, only the user
   * with whom the file was shared can delete it
   *
   * @param {string} cid of the document to remove
   * @return {Object} tx response from polkadot api
   */
  async remove (cid) {
    return this._confidentialDocsApi.removeSharedDoc({ cid })
  }

  /**
   * @desc Returns the deciphered payload specified by the cid
   *
   * @param {string} cid related to the shared data record
   * @return {Object} representing the shared data record with the following structure
   * containing the deciphered payload
   * {
   *  "cid": "QmeHEb5TF4zkP2H6Mg5TcrvDs5egPCJgWFBB7YZaLmK7jr",
   *  "name": "name",
   *  "description": "desc",
   *  "to": "5FSuxe2q7qCYKie8yqmM56U4ovD1YtBb3DoPzGKjwZ98vxua",
   *  "from": "5FWtfhKTuGKm9yWqzApwTfiUL4UPWukJzEcCTGYDiYHsdKaG",
   *  "payload": { prop1: 1, prop2:"Hi"}
   * }
   * @throws error if the record is not found or if the logged in user is not the sharer/sharee of the data
   */
  async viewByCID (cid, actorAddress = null) {
    return this.view(await this.getByCID(cid), actorAddress)
  }

  async view (sharedData, actorAddress = null) {
    const {
      cid,
      to,
      from
    } = sharedData
    actorAddress = actorAddress || this._address()
    const publicKey = await this._api().getPublicKey(to === this._address() ? from : to)
    const fullCipheredPayload = await this._ipfs.cat(cid)
    const payload = await this._cipher().decipherFrom({
      fullCipheredPayload,
      publicKey,
      actorAddress
    })
    return {
      ...sharedData,
      payload
    }
  }
}

module.exports = SharedData
