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
   *  "cid": "QmeHEb5TF4zkP2H6Mg5TcrvDs5egPCJgWFBB7YZaLmK7jr",
   *  "name": "name",
   *  "description": "desc",
   *  "owner": "5FSuxe2q7qCYKie8yqmM56U4ovD1YtBb3DoPzGKjwZ98vxua"
   * }
   */
  async findByCID (cid) {
    return this._api().findOwnedDoc(cid)
  }

  /**
   * @desc Gets an owned data record by cid, throws error if the record is not found or if
   * the user does not own the record
   *
   * @param {string} cid
   * @return {Object} with the following structure
   * {
   *  "cid": "QmeHEb5TF4zkP2H6Mg5TcrvDs5egPCJgWFBB7YZaLmK7jr",
   *  "name": "name",
   *  "description": "desc",
   *  "owner": "5FSuxe2q7qCYKie8yqmM56U4ovD1YtBb3DoPzGKjwZ98vxua"
   * }
   * @throws error if the record is not found or if the user does not
   * own the record
   */
  async getByCID (cid) {
    return this._api().getOwnedDoc(cid, this._address())
  }

  /**
   * @desc Gets the metadata of the documents that the user owns, if a subTrigger
   * function is provided a subscription is made gets all the updates, in this case
   * the function returns a function to unsubscribe, if no subTrigger function is provided
   * then the function returns the current owned documents
   *
   * @param {string} address of the owner
   * @param {function} [subTrigger] function that handles subscription updates
   * @return {Array|function} returns array of owned documents if no subTrigger is provided,
   * if it is provided a function to unsubscribe is returned
   * [{
   *  "cid": "QmeHEb5TF4zkP2H6Mg5TcrvDs5egPCJgWFBB7YZaLmK7jr",
   *  "name": "name",
   *  "description": "desc",
   *  "owner": "5FSuxe2q7qCYKie8yqmM56U4ovD1YtBb3DoPzGKjwZ98vxua"
   * }]
   */
  async getOwnedDocs (address, subTrigger) {
    return this._confidentialDocsApi.getOwnedDocs(address, subTrigger)
  }

  /**
   * @desc Adds a new owned document for the logged in user
   *
   * @param {string} name
   * @param {string} description
   * @param {Object|File} payload to be ciphered and stored
   * @return {Object} representing the owned data record with the following structure
   * {
   *  "cid": "QmeHEb5TF4zkP2H6Mg5TcrvDs5egPCJgWFBB7YZaLmK7jr",
   *  "name": "name",
   *  "description": "desc",
   *  "owner": "5FSuxe2q7qCYKie8yqmM56U4ovD1YtBb3DoPzGKjwZ98vxua"
   * }
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
   * @desc Removes the specified owned document for the logged in user
   *
   * @param {string} cid of the document to remove
   * @return {Object} tx response from polkadot api
   */
  async remove (cid) {
    return this._confidentialDocsApi.removeOwnedDoc({ cid, signer: this._signer() })
  }

  /**
   * @desc Updates metadata related to the owned data record with the specified cid
   *
   * @param {string} cid of the owned data record to update
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
   * @desc Returns the deciphered payload specified by the cid
   *
   * @param {string} cid related to the owned data record
   * @return {Object} representing the owned data record with the following structure
   * containing the deciphered payload
   * {
   *  "cid": "QmeHEb5TF4zkP2H6Mg5TcrvDs5egPCJgWFBB7YZaLmK7jr",
   *  "name": "name",
   *  "description": "desc",
   *  "owner": "5FSuxe2q7qCYKie8yqmM56U4ovD1YtBb3DoPzGKjwZ98vxua",
   *  "payload": { prop1: 1, prop2:"Hi"}
   * }
   * @throws error if the record is not found or if the logged in user is not the owner of the data
   */
  async viewByCID (cid) {
    return this.view(await this.getByCID(cid))
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
