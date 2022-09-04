const { JWT } = require('@smontero/jwt')
const BaseVaultAuthProvider = require('./BaseVaultAuthProvider')

// Provides a base vault auth channel that abstracts common
// functionality related to JWT handling
class BaseJWTVaultAuthProvider extends BaseVaultAuthProvider {
  /**
   * @desc Verifies the JSON Web Token, based on the specified auth channel
   *
   * @param {String} authName the name to identify this auth channel
   * @param {String} jwt the JSON Web Token
   * @param {String} faucetServerUrl the url for the hashed faucet server
   *
   * @return {Object} the decoded JSON Web token
   */
  static async verifyJWT ({
    authName,
    jwt,
    faucetServerUrl
  }) {
    const url = new URL('/api/auth-channel', faucetServerUrl)
    url.search = new URLSearchParams({ authName })
    const { keyUrl, issuer, audience } = await (await fetch(url)).json()
    const { payload: decodedJWT } = await new JWT().verify({
      token: jwt,
      keyUrl,
      opts: {
        issuer, audience
      }
    })
    return decodedJWT
  }

  /**
   * @desc Create a BaseJWTVaultAuthProvider instance
   *
   * @param {String} authName the name to identify this auth channel
   * @param {String} jwt the JSON Web Token
   * @param {Object} decodedJWT the decodedJWT
   *
   * @return {Object}
   */
  constructor ({
    authName,
    jwt,
    decodedJWT
  }) {
    super({
      authName,
      userId: decodedJWT.sub
    })
    this.jwt = jwt
    this.decodedJWT = decodedJWT
  }
}

module.exports = BaseJWTVaultAuthProvider
