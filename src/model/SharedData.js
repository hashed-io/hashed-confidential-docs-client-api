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
      sharedDoc,
      signer: this._signer()
    })
    return sharedDoc
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
  async viewByCID ({
    cid
  }) {
    return this.view(await this.getByCID(cid))
  }

  async view (sharedData) {
    const {
      cid,
      to,
      from
    } = sharedData
    const publicKey = await this._api().getPublicKey(to === this._address() ? from : to)
    const fullCipheredPayload = await this._ipfs.cat(cid)
    const payload = await this._cipher().decipherFrom({
      fullCipheredPayload,
      publicKey
    })
    return {
      ...sharedData,
      payload
    }
  }
}

module.exports = SharedData
