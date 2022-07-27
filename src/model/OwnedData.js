const BaseConfidentialData = require('./BaseConfidentialData')
/**
 * Provides the functionality for managing own's user private data
 */
class OwnedData extends BaseConfidentialData {
  /**
   * @desc Finds an owned data record by cid
   *
   * @param {string} cid
   * @return {Object|null} with the following structure
   * {
   *  "id": 69,
   *  "name": "name",
   *  "description": "desc",
   *  "type": "json",
   *  "owner_user": {
   *    "id": "a917e2b7-596e-4bc0-be79-9828b0b3ea78",
   *    "address": "5FSuxe2q7qCYKie8yqmM56U4ovD1YtBb3DoPzGKjwZ98vxua"
   *  },
   *  "cid": "QmeHEb5TF4zkP2H6Mg5TcrvDs5egPCJgWFBB7YZaLmK7jr",
   *  "original_cid": "QmeHEb5TF4zkP2H6Mg5TcrvDs5egPCJgWFBB7YZaLmK7jr",
   *  "iv": "d232f60b340d7235beafed405b08b811",
   *  "mac": "6da9ce5375af9cdadf762e0910674c8b10b0c2c87500ce5c36fe0d2c8ea9fa5d",
   *  "started_at": "2022-06-14T13:43:15.108+00:00",
   *  "ended_at": null,
   *  "is_deleted": false
   * }
   */
  async findByCID (cid) {
    return this._api().findOwnedDoc(cid)
  }

  /**
   * @desc Gets an owned data record by cid, throws error if the record is not found or if
   * the current parameter is true and the owned record is not the current version or if
   * it has been soft deleted
   *
   * @param {string} cid
   * @param {boolean} current indicates whether the record must be the current version and not soft deleted
   * @return {Object} with the following structure
   * {
   *  "id": 69,
   *  "name": "name",
   *  "description": "desc",
   *  "type": "json",
   *  "owner_user": {
   *    "id": "a917e2b7-596e-4bc0-be79-9828b0b3ea78",
   *    "address": "5FSuxe2q7qCYKie8yqmM56U4ovD1YtBb3DoPzGKjwZ98vxua"
   *  },
   *  "cid": "QmeHEb5TF4zkP2H6Mg5TcrvDs5egPCJgWFBB7YZaLmK7jr",
   *  "original_cid": "QmeHEb5TF4zkP2H6Mg5TcrvDs5egPCJgWFBB7YZaLmK7jr",
   *  "iv": "d232f60b340d7235beafed405b08b811",
   *  "mac": "6da9ce5375af9cdadf762e0910674c8b10b0c2c87500ce5c36fe0d2c8ea9fa5d",
   *  "started_at": "2022-06-14T13:43:15.108+00:00",
   *  "ended_at": null,
   *  "is_deleted": false
   * }
   * @throws error if the record is not found or if the current parameter
   * is true and the owned record is not the current version or if
   * it has been soft deleted
   */
  async getByCID ({
    cid
  }) {
    return this._api().getOwnedDoc(cid, this._address())
  }

  /**
   * @desc Inserts a new or updates and owned data record, if an id is specified and the cid
   * is different a new verison of the record is inserted and returned
   *
   * @param {int} [id] of the owned data record to update
   * @param {string} name
   * @param {string} description
   * @param {Object|File} payload to be ciphered and stored
   * @return {Object} representing the owned data record with the following structure
   * {
   *  "id": 69,
   *  "name": "name",
   *  "description": "desc",
   *  "type": "json",
   *  "cid": "QmeHEb5TF4zkP2H6Mg5TcrvDs5egPCJgWFBB7YZaLmK7jr",
   *  "original_cid": "QmeHEb5TF4zkP2H6Mg5TcrvDs5egPCJgWFBB7YZaLmK7jr",
   *  "iv": "d232f60b340d7235beafed405b08b811",
   *  "mac": "6da9ce5375af9cdadf762e0910674c8b10b0c2c87500ce5c36fe0d2c8ea9fa5d",
   *  "started_at": "2022-06-14T13:43:15.108+00:00",
   *  "ended_at": null,
   *  "is_deleted": false
   * }
   * @throws error if the record is not found or if it is not the current version
   */
  async add ({
    name,
    description,
    payload
  }) {
    const cipheredPayload = await this._cipher().cipher({ payload })
    const cid = await this._ipfs.add(cipheredPayload)
    return this._setOwnedDoc({
      name,
      description,
      cid
    })
  }

  /**
   * @desc Updates metadata related to the owned data record with the specified id
   *
   * @param {int} id of the owned data record to update
   * @param {string} name
   * @param {string} description
   */
  async updateMetadata ({
    cid,
    name,
    description
  }) {
    return this._setOwnedDoc({
      name,
      description,
      cid
    })
  }

  /**
   * @desc Returns the deciphered payload specfied by the cid
   *
   * @param {string} cid related to the owned data record
   * @return {Object} representing the owned data record with the following structure
   * containing the deciphered payload
   * {
   *  "id": 69,
   *  "name": "name",
   *  "description": "desc",
   *  "type": "json",
   *  "owner_user": {
   *    "id": "a917e2b7-596e-4bc0-be79-9828b0b3ea78",
   *    "address": "5FSuxe2q7qCYKie8yqmM56U4ovD1YtBb3DoPzGKjwZ98vxua"
   *  },
   *  "cid": "QmeHEb5TF4zkP2H6Mg5TcrvDs5egPCJgWFBB7YZaLmK7jr",
   *  "original_cid": "QmeHEb5TF4zkP2H6Mg5TcrvDs5egPCJgWFBB7YZaLmK7jr",
   *  "iv": "d232f60b340d7235beafed405b08b811",
   *  "mac": "6da9ce5375af9cdadf762e0910674c8b10b0c2c87500ce5c36fe0d2c8ea9fa5d",
   *  "started_at": "2022-06-14T13:43:15.108+00:00",
   *  "ended_at": null,
   *  "is_deleted": false,
   *  "payload": { prop1: 1, prop2:"Hi"}
   * }
   * @throws error if the record is not found or if the logged in user is not the owner of the data
   */
  async viewByCID ({
    cid
  }) {
    return this.view(await this.getByCID({ cid }))
  }

  async view (ownedData) {
    const {
      cid
    } = ownedData
    const fullCipheredPayload = await this._ipfs.cat(cid)
    const payload = await this._cipher().decipher({
      fullCipheredPayload
    })
    return {
      ...ownedData,
      payload
    }
  }

  async _setOwnedDoc ({
    name,
    description,
    cid
  }) {
    const ownedDoc = {
      name,
      description,
      cid,
      owner: this._address()
    }
    await this._api().setOwnedDoc({
      ownedDoc,
      signer: this._signer()
    })
    return ownedDoc
  }
}

module.exports = OwnedData
