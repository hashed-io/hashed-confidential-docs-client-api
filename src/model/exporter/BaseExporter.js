// Provides the functionality to export a payload
class BaseExporter {
  /**
   * Exports  payload
   * @param {string | object} payload
   */
  async export (payload) {
    return this._export(JSON.stringify(payload, null, 4))
  }

  async _export (payload) {
    throw new Error('Subclass must override the export method')
  }
}

module.exports = BaseExporter
