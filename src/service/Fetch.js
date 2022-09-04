class Fetch {
  constructor (baseUrl) {
    this.baseUrl = baseUrl
  }

  async get (endpoint, queryParams) {
    return this._request(this.url(endpoint, queryParams))
  }

  async post (endpoint, body, opts) {
    opts = {
      ...opts,
      method: 'POST',
      body: JSON.stringify(body)
    }
    opts.headers = {
      ...opts.headers,
      'Content-Type': 'application/json'
    }
    return this._request(this.url(endpoint), opts)
  }

  async url (endpoint, queryParams) {
    const url = new URL(endpoint, this.baseUrl)
    if (queryParams) {
      url.search = new URLSearchParams(queryParams)
    }
    return url
  }

  async _request (url, opts) {
    const response = await fetch(url, opts)
    const data = await response.json()
    if (!response.ok) {
      throw new Error((data && data.message) || response.status)
    }
    return data
  }
}

module.exports = Fetch
