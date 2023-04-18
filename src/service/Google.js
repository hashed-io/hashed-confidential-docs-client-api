class Google {
  constructor ({
    gapi,
    clientId
  }) {
    this._gapi = gapi
    this._clientId = clientId
    this._tokenClient = null
    this._email = null
    this._haveRequestedToken = false
  }

  client () {
    return this._gapi.client
  }

  async init ({
    scope,
    email
  }) {
    console.log('In google init: ', email, scope)
    this._email = email
    await new Promise((resolve, reject) => {
      this._gapi.load('client', { callback: resolve, onerror: reject })
    })
    await this._gapi.client.init({})
    this._tokenClient = await this.initTokenClient(scope)
  }

  async loadLibrary (lib) {
    return this._gapi.client.load(lib)
  }

  async initTokenClient (scope) {
    return new Promise((resolve, reject) => {
      try {
        // eslint-disable-next-line no-undef
        const tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: process.env.GOOGLE_CLIENT_ID,
          callback: '',
          prompt: '',
          scope
        })
        console.log('In google init token client: ', process.env.GOOGLE_CLIENT_ID, scope)
        resolve(tokenClient)
      } catch (err) {
        reject(err)
      }
    })
  }

  async _requestToken (err) {
    if (
      (!err || err.result.error.code === 401 || err.result.error.code === 403)
      // && (err.result.error.status === 'PERMISSION_DENIED')
    ) {
      this._haveRequestedToken = true
      // The access token is missing, invalid, or expired, prompt for user consent to obtain one.
      await new Promise((resolve, reject) => {
        try {
          // Settle this promise in the response callback for requestAccessToken()
          this._tokenClient.callback = (resp) => {
            if (resp.error !== undefined) {
              reject(resp)
            }
            // GIS has automatically updated gapi.client with the newly issued access token.
            console.log('gapi.client access token: ', resp)
            resolve(resp)
          }
          console.log('Requesting access token for: ', this._email)
          this._tokenClient.requestAccessToken({
            hint: this._email
          })
        } catch (err) {
          reject(err)
        }
      })
    } else {
      // Errors unrelated to authorization: server errors, exceeding quota, bad requests, and so on.
      throw new Error(err)
    }
  }

  async request (client, method, params) {
    try {
      if (!this._haveRequestedToken) {
        await this._requestToken()
      }
      console.log('In google request: ', client, method, JSON.stringify(params, null, 4))
      const { result } = await this._getClientFromStr(client)[method](params)
      console.log('In google request result: ', JSON.stringify(result, null, 4))
      return result
    } catch (err) {
      try {
        console.log('Error during request, requesting token: ', err)
        await this._requestToken(err)
        console.log('Token requested, making new request')
        return this.request(client, method, params)
      } catch (error) {
        throw new Error(`failed calling method: ${method} of google client:${client}, with params:${JSON.stringify(params, null, 4)}, error: ${JSON.stringify(error, null, 4)}`)
      }
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
