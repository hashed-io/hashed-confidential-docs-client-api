class BrowserDownloadKeyExporter {
  async export (key) {
    const file = new File([key], `private-key-${Date.now()}.txt`, {
      type: 'text/plain'
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

module.exports = BrowserDownloadKeyExporter
