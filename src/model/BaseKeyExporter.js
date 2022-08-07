class BaseKeyExporter {
  async export (key) {
    throw new Error('Subclass must override the send method')
  }
}

module.exports = BaseKeyExporter
