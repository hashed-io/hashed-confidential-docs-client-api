/*
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */
const { TextDecoder, TextEncoder } = require('util')
const fetch = require('node-fetch')
// const { Agent } = require('https')

module.exports = {
  globals: {
    TextDecoder,
    TextEncoder,
    window: { addEventListener () {} },
    fetch,
    File: class {}
    // Agent
  },
  transform: {
    'node_modules/(data-uri-to-buffer|node-fetch|fetch-blob|formdata-polyfill)/.+\\.(j|t)sx?$': 'babel-jest'
    // '/\\.[jt]sx?$/': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(data-uri-to-buffer|node-fetch|uuid|@ipld|fetch-blob|formdata-polyfill|uint8arrays|@smontero|ipfs-http-client|ipfs-core-utils|multiformats|util|cborg|ipfs-unixfs)/.*)'
  ],
  setupFiles: [
    'jest-localstorage-mock'
  ],
  clearMocks: false,
  resetMocks: false

}
