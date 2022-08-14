class GoogleDrive {
  constructor (google) {
    this._google = google
  }

  async init (email) {
    await this._google.init({
      email,
      scope: 'https://www.googleapis.com/auth/drive.appdata'
    })
    await this._google.loadLibrary('https://www.googleapis.com/discovery/v1/apis/drive/v3/rest')
  }

  async createFile (params) {
    return this.request('create', params)
  }

  async updateFile (params) {
    return this.request('update', params)
  }

  async listFiles (params) {
    return this.request('list', params)
  }

  async getFile (params) {
    return this.request('get', params)
  }

  async getFileByName ({ name, fields, spaces }) {
    const { files } = await this.listFiles({
      q: `name = '${name}'`,
      spaces
    })
    if (files.length) {
      return this.getFile({
        fileId: files[0].id,
        fields
      })
    }
    return null
  }

  async request (method, params) {
    return this._google.request('drive.files', method, params)
  }
}

module.exports = GoogleDrive
