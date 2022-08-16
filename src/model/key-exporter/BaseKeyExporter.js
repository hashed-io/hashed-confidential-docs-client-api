// Provides the functionality to export a private key
class BaseKeyExporter {
  /**
   * Exports  private key
   * @param {string} privateKey
   */
  async export (key) {
    throw new Error('Subclass must override the send method')
  }
}

module.exports = BaseKeyExporter
