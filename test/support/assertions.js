module.exports = {
  assertProviderInit ({ provider, providerDetails, decodedJWT }) {
    const { authName, jwt } = providerDetails
    expect(provider.authName).toBe(authName)
    expect(provider.userId).toBe(decodedJWT.sub)
    expect(provider.jwt).toBe(jwt)
    expect(provider.decodedJWT).toEqual(decodedJWT)
  },

  assertVerifyJWTCall (verifyJWTMock, {
    authName,
    jwt,
    faucetServerUrl
  }) {
    expect(verifyJWTMock).toBeCalledWith({
      authName,
      jwt,
      faucetServerUrl
    })
  }
}
