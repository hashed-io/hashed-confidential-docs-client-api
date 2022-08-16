const BaseKeyExporter = require('./BaseKeyExporter')
class RememberKeyExporter extends BaseKeyExporter {
  constructor () {
    super()
    this.key = null
  }

  async export (key) {
    this.key = key
  }
}

module.exports = RememberKeyExporter
