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
   *   "id": 69,
   *   "name": "name1",
   *   "description": "desc1",
   *   "from_user": {
   *     "id": "d76d2baf-a9a9-4980-929c-1d3d467810c7",
   *     "address": "5FWtfhKTuGKm9yWqzApwTfiUL4UPWukJzEcCTGYDiYHsdKaG",
   *     "public_key": "PUB_K1_7afYoQhA8aSMLGtGiKiBqrwfVAGNoxbcPcredSvZ3rkny9QoyG"
   *   },
   *   "to_user": {
   *     "id": "a917e2b7-596e-4bc0-be79-9828b0b3ea78",
   *     "address": "5FSuxe2q7qCYKie8yqmM56U4ovD1YtBb3DoPzGKjwZ98vxua",
   *     "public_key": "PUB_K1_6m2Gq41FwDoeY1z5SNssjx8wYgLc4UbAKtvNDrdDhVCx8CU2B8"
   *   },
   *   "original_owned_data": {
   *     "id": 184,
   *     "type": "json"
   *   },
   *   "cid": "QmPn3obcymCxEfKhSUVhvkLsqPytH16ghcCsthqz9A5YA9",
   *   "iv": "899398d07303510df18c58a804acf5b0",
   *   "mac": "cc82141ac5686c15ce79fa4d3a57eeee1d127db6c1e2302d312c2bc6c90a0c81",
   *   "shared_at": "2022-06-15T00:11:56.611+00:00"
   * }
   */
  async findByCID (cid) {
    return this._api().findSharedDoc(cid)
  }

  /**
   * @desc Gets a shared data record by cid, throws error if the record is not found
   *
   * @param {string} cid
   * @return {Object} with the following structure
   * {
   *   "id": 69,
   *   "name": "name1",
   *   "description": "desc1",
   *   "from_user": {
   *     "id": "d76d2baf-a9a9-4980-929c-1d3d467810c7",
   *     "address": "5FWtfhKTuGKm9yWqzApwTfiUL4UPWukJzEcCTGYDiYHsdKaG",
   *     "public_key": "PUB_K1_7afYoQhA8aSMLGtGiKiBqrwfVAGNoxbcPcredSvZ3rkny9QoyG"
   *   },
   *   "to_user": {
   *     "id": "a917e2b7-596e-4bc0-be79-9828b0b3ea78",
   *     "address": "5FSuxe2q7qCYKie8yqmM56U4ovD1YtBb3DoPzGKjwZ98vxua",
   *     "public_key": "PUB_K1_6m2Gq41FwDoeY1z5SNssjx8wYgLc4UbAKtvNDrdDhVCx8CU2B8"
   *   },
   *   "original_owned_data": {
   *     "id": 184,
   *     "type": "json"
   *   },
   *   "cid": "QmPn3obcymCxEfKhSUVhvkLsqPytH16ghcCsthqz9A5YA9",
   *   "iv": "899398d07303510df18c58a804acf5b0",
   *   "mac": "cc82141ac5686c15ce79fa4d3a57eeee1d127db6c1e2302d312c2bc6c90a0c81",
   *   "shared_at": "2022-06-15T00:11:56.611+00:00"
   * }
   * @throws error if the record is not found
   */
  async getByCID (cid) {
    return this._api().getSharedDoc(cid, this._address())
  }

  /**
   * @desc Creates a new shared data record for the specified payload, the data is shared with the
   * user specified by the toUserId or toUserAddress parameter this method first creates a new
   * owned data record and then creates the shared data record
   *
   * @param {string} [toUserId]
   * @param {string} [toUserAddress]
   * @param {string} name
   * @param {string} description
   * @param {Object|File} payload to be ciphered and stored
   * @return {Object} with the following structure containing data related to the
   * newly created owned data and shared data records
   * {
   *  ownedData : {
   *    "id": 69,
   *    "name": "name",
   *    "description": "desc",
   *    "type": "json",
   *    "cid": "QmeHEb5TF4zkP2H6Mg5TcrvDs5egPCJgWFBB7YZaLmK7jr",
   *    "original_cid": "QmeHEb5TF4zkP2H6Mg5TcrvDs5egPCJgWFBB7YZaLmK7jr",
   *    "iv": "d232f60b340d7235beafed405b08b811",
   *    "mac": "6da9ce5375af9cdadf762e0910674c8b10b0c2c87500ce5c36fe0d2c8ea9fa5d",
   *    "started_at": "2022-06-14T13:43:15.108+00:00",
   *    "ended_at": null,
   *    "is_deleted": false
   *  },
   *  sharedData: {
   *    "id": 69,
   *    "name": "name1",
   *    "description": "desc1",
   *    "from_user": {
   *      "id": "d76d2baf-a9a9-4980-929c-1d3d467810c7",
   *      "address": "5FWtfhKTuGKm9yWqzApwTfiUL4UPWukJzEcCTGYDiYHsdKaG",
   *      "public_key": "PUB_K1_7afYoQhA8aSMLGtGiKiBqrwfVAGNoxbcPcredSvZ3rkny9QoyG"
   *    },
   *    "to_user": {
   *      "id": "a917e2b7-596e-4bc0-be79-9828b0b3ea78",
   *      "address": "5FSuxe2q7qCYKie8yqmM56U4ovD1YtBb3DoPzGKjwZ98vxua",
   *      "public_key": "PUB_K1_6m2Gq41FwDoeY1z5SNssjx8wYgLc4UbAKtvNDrdDhVCx8CU2B8"
   *    },
   *    "original_owned_data": {
   *      "id": 184,
   *      "type": "json"
   *    },
   *    "cid": "QmPn3obcymCxEfKhSUVhvkLsqPytH16ghcCsthqz9A5YA9",
   *    "iv": "899398d07303510df18c58a804acf5b0",
   *    "mac": "cc82141ac5686c15ce79fa4d3a57eeee1d127db6c1e2302d312c2bc6c90a0c81",
   *    "shared_at": "2022-06-15T00:11:56.611+00:00"
   *  }
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
   * @desc Returns the deciphered payload specfied by the cid
   *
   * @param {string} cid related to the shared data record
   * @return {Object} representing the shared data record with the following structure
   * containing the deciphered payload
   * {
   *   "id": 69,
   *   "name": "name1",
   *   "description": "desc1",
   *   "from_user": {
   *     "id": "d76d2baf-a9a9-4980-929c-1d3d467810c7",
   *     "address": "5FWtfhKTuGKm9yWqzApwTfiUL4UPWukJzEcCTGYDiYHsdKaG",
   *     "public_key": "PUB_K1_7afYoQhA8aSMLGtGiKiBqrwfVAGNoxbcPcredSvZ3rkny9QoyG"
   *   },
   *   "to_user": {
   *     "id": "a917e2b7-596e-4bc0-be79-9828b0b3ea78",
   *     "address": "5FSuxe2q7qCYKie8yqmM56U4ovD1YtBb3DoPzGKjwZ98vxua",
   *     "public_key": "PUB_K1_6m2Gq41FwDoeY1z5SNssjx8wYgLc4UbAKtvNDrdDhVCx8CU2B8"
   *   },
   *   "original_owned_data": {
   *     "id": 184,
   *     "type": "json"
   *   },
   *   "cid": "QmPn3obcymCxEfKhSUVhvkLsqPytH16ghcCsthqz9A5YA9",
   *   "iv": "899398d07303510df18c58a804acf5b0",
   *   "mac": "cc82141ac5686c15ce79fa4d3a57eeee1d127db6c1e2302d312c2bc6c90a0c81",
   *   "shared_at": "2022-06-15T00:11:56.611+00:00"
   *   "payload": { prop1: 1, prop2:"Hi"}
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
