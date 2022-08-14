class Google {
  constructor ({
    gapi,
    clientId
  }) {
    this._gapi = gapi
    this._clientId = clientId
  }

  client () {
    return this._gapi.client
  }

  async init () {
    await new Promise((resolve, reject) => {
      this._gapi.load('client', { callback: resolve, onerror: reject })
    })
    await this._gapi.client.init({})
  }

  async loadLibrary (lib) {
    return this._gapi.client.load(lib)
  }

  async requesToken ({
    email,
    scope
  }) {
    return new Promise((resolve, reject) => {
      try {
        // eslint-disable-next-line no-undef
        const tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: process.env.GOOGLE_CLIENT_ID,
          callback: (tokenResponse) => {
            console.log('tokenResponse', tokenResponse)
            if (tokenResponse.error) {
              reject(new Error(tokenResponse.errors))
            } else {
              resolve(tokenResponse)
            }
          },
          prompt: '',
          scope
        })
        tokenClient.requestAccessToken({
          hint: email
        })
      } catch (err) {
        reject(err)
      }
    })
  }

  async request (client, method, params) {
    try {
      const { result } = await this._getClientFromStr[method](params)
      return result
    } catch (error) {
      throw new Error(`failed calling method: ${method} of google client:${client}, with params:${JSON.stringify(params, null, 4)}, error: ${error.message}`)
    }
  }

  _getClientFromStr (clientStr) {
    const pathParts = clientStr.split('.')
    let client = this.client()
    for (const pathPart of pathParts) {
      client = client[pathPart]
    }
    return client
  }
}

module.exports = Google
