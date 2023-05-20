const BaseExporter = require('./BaseExporter')

// Exports payload by generating a file download in the browser
class BrowserDownloadExporter extends BaseExporter {
  /**
   * Exports  payload
   * @param {string} payload
   */
  async _export (payload) {
    const file = new File([payload], `export-${Date.now()}.json`, {
      type: 'application/json'
    })
    const link = document.createElement('a')
    const url = URL.createObjectURL(file)

    link.href = url
    link.download = file.name
    document.body.appendChild(link)
    link.click()

    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }
}

module.exports = BrowserDownloadExporter
