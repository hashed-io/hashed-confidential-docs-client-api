const BaseExporter = require('./BaseExporter')
class RememberExporter extends BaseExporter {
  constructor () {
    super()
    this.payload = null
  }

  async _export (payload) {
    this.payload = payload
  }
}

module.exports = RememberExporter
