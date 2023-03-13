
jest.setTimeout(70000)

const btcjs = require('bitcoinjs-lib')

const { ActionType } = require('../../../src/const')
const { PredefinedActionConfirmer } = require('../../../src/model/action-confirmer')
const { createBTC, createXKey } = require('../../../src/model/btc')
const VaultMock = require('../../support/VaultMock')
const bip39 = require('bip39')

const psbtText = 'cHNidP8BAH0BAAAAAdXuu3IED9S60Omnf/WHLT+J8qrhpYogZ74/weQP3wYtAAAAAAD9////ApdKAAAAAAAAIgAgVgpgVYN7cpdeGpYqj/SqPJ9xSRC/NfCV1WBN9a6PjcAQJwAAAAAAABYAFN/MoQ/TWYyv1JKSJ8O//Qzl2aeXAAAAAAABAOoCAAAAAAEBpD4rrrXl2igLagnrYYoFg7eHapxeOhJn4FlsvVaF9KAAAAAAAP7///8CMHUAAAAAAAAiACAKskUgXIRuFNk+kXVu0ROvvrP6eoH0mdb/JazQsruP5PiISgAAAAAAFgAUNAY1ixp3MRBepRuRYLdXa6r6jeQCRzBEAiBnLFY6GsOYaE0jOnUPPabL62WJDhuTQgYUB8XOShMdbgIgFoiB4ntE9FEtfUZzlnCMBh91liI1ffBYyCOQwSx+ZWYBIQKRXTNQp5ekscMjVNhM5ya7vCem67bFjmzuByZ33RAGsYdJJAABASswdQAAAAAAACIAIAqyRSBchG4U2T6RdW7RE6++s/p6gfSZ1v8lrNCyu4/kAQVHUiECU2CGOnnwKuB1Yjadth7xInlcMd/A9NjrNDJbXVUdkBchAzL0FNWhnvnH1VRk4m5VNNQg+YlFWeUdEzd7yxHxGyLZUq4iBgJTYIY6efAq4HViNp22HvEieVwx38D02Os0MltdVR2QFxz5zUhcMAAAgAAAAIAAAACAAgAAgAAAAAAAAAAAIgYDMvQU1aGe+cfVVGTiblU01CD5iUVZ5R0TN3vLEfEbItkcqLRVVTAAAIAAAACAAAAAgAIAAIAAAAAAAAAAAAAiAgKXkSekytkdeEL5hKx9yHbmVYxTnwACtpyPIYSoKKn36Bz5zUhcMAAAgAAAAIAAAACAAgAAgAEAAAAAAAAAIgIC+zpfQojN0RQ0AwXD8FhQljskX2TPELmbE5u2tstKXGEcqLRVVTAAAIAAAACAAAAAgAIAAIABAAAAAAAAAAAA'
const psbtTextProofOfReserves = 'cHNidP8BAH4BAAAAAjx+p9IScTIVUfwP4IBDCp0YJc1nymOpQgY/76bYAs4uAAAAAAD/////7LA+mNF53+K13YUab9fBaoMLoDGMAgjxalPehgEhtzoBAAAAAP////8BcBcAAAAAAAAZdqkUn3/QltN+0sDj9/DPySS+70/862iIrAAAAAAAAQEKAAAAAAAAAAABUQEHAAABAStwFwAAAAAAACIAIDNBa463d8yA8PWOi4dMPhdlfS20Kb1tiudtqMSdCg9jAQVHUiECU2CGOnnwKuB1Yjadth7xInlcMd/A9NjrNDJbXVUdkBchAnGosqpP8kqWHGyuHnnozKDrfrh/eO/i1tnQAGwDcjj7Uq4iBgJTYIY6efAq4HViNp22HvEieVwx38D02Os0MltdVR2QFxz5zUhcMAAAgAAAAIAAAACAAgAAgAAAAAAAAAAAIgYCcaiyqk/ySpYcbK4eeejMoOt+uH947+LW2dAAbANyOPscqqtd2jAAAIAAAACAAAAAgAIAAIAAAAAAAAAAAAAA'
const expectedTrxInfo = {
  inputs: [
    {
      address: 'tb1qp2ey2gzus3hpfkf7j96ka5gn47lt87n6s86fn4hlykkdpv4m3ljqe0ak80',
      value: 30000
    }
  ],
  outputs: [
    {
      address: 'tb1q2c9xq4vr0defwhs6jc4gla928j0hzjgshu6lp9w4vpxltt503hqqxlxr89',
      value: 19095
    },
    {
      address: 'tb1qmlx2zr7ntxx2l4yjjgnu80lapnjanfuh49xj5q',
      value: 10000
    }
  ],
  fee: 905
}

const expectedTrxInfoProofOfReserves = {
  inputs: [
    {
      address: 'tb1qxdqkhr4hwlxgpu84369cwnp7zajh6td59x7kmzh8dk5vf8g2pa3s6fpjdz',
      value: 6000
    }
  ],
  outputs: [{ address: 'mv4JrHNmh1dY6ZfEy7zbAmhEc3Dyr8ULqX', value: 6000 }],
  fee: 0
}

const mnemonic1 = 'over whip setup elephant program cost absurd around myth twist discover raw'
const mnemonic2 = 'print win thumb long book carbon spy happy hockey two charge law'

describe('Test BTC functionality', () => {
  // test('generate mnemonics', () => {
  //   console.log('mnemonic: ', bip39.generateMnemonic())
  // })
  test('Get PSBT Trx Info', async () => {
    const { btc } = await setupBTC({
      mnemonic: mnemonic1
    })
    const trxInfo = await btc.getTrxInfoFromPSBTText(psbtText)

    expect(trxInfo).toEqual(expectedTrxInfo)
  })
  test('Get PSBT Proof of Reserves Trx Info', async () => {
    const { btc } = await setupBTC({
      mnemonic: mnemonic1
    })
    const trxInfo = await btc.getTrxInfoFromPSBTText(psbtTextProofOfReserves)
    console.log('trxInfo:', trxInfo)
    expect(trxInfo).toEqual(expectedTrxInfoProofOfReserves)
  })
  test('Sign PSBT', async () => {
    const { actionConfirmer, btc } = await setupBTC({
      mnemonic: mnemonic1
    })
    const confirmActionSpy = jest.spyOn(actionConfirmer, 'confirm')
    const signedPsbtText = 'cHNidP8BAH0BAAAAAdXuu3IED9S60Omnf/WHLT+J8qrhpYogZ74/weQP3wYtAAAAAAD9////ApdKAAAAAAAAIgAgVgpgVYN7cpdeGpYqj/SqPJ9xSRC/NfCV1WBN9a6PjcAQJwAAAAAAABYAFN/MoQ/TWYyv1JKSJ8O//Qzl2aeXAAAAAAABAOoCAAAAAAEBpD4rrrXl2igLagnrYYoFg7eHapxeOhJn4FlsvVaF9KAAAAAAAP7///8CMHUAAAAAAAAiACAKskUgXIRuFNk+kXVu0ROvvrP6eoH0mdb/JazQsruP5PiISgAAAAAAFgAUNAY1ixp3MRBepRuRYLdXa6r6jeQCRzBEAiBnLFY6GsOYaE0jOnUPPabL62WJDhuTQgYUB8XOShMdbgIgFoiB4ntE9FEtfUZzlnCMBh91liI1ffBYyCOQwSx+ZWYBIQKRXTNQp5ekscMjVNhM5ya7vCem67bFjmzuByZ33RAGsYdJJAABASswdQAAAAAAACIAIAqyRSBchG4U2T6RdW7RE6++s/p6gfSZ1v8lrNCyu4/kIgICU2CGOnnwKuB1Yjadth7xInlcMd/A9NjrNDJbXVUdkBdIMEUCIQDAALZ64VX2Fm7PdNaTAfu/K8t/7qwZWdIMXeBPKDwmZgIgeRiQcEgCKFuSw1KNZxaUAm+Tq8gwkSoXCglwV6tiq8ABAQVHUiECU2CGOnnwKuB1Yjadth7xInlcMd/A9NjrNDJbXVUdkBchAzL0FNWhnvnH1VRk4m5VNNQg+YlFWeUdEzd7yxHxGyLZUq4iBgJTYIY6efAq4HViNp22HvEieVwx38D02Os0MltdVR2QFxz5zUhcMAAAgAAAAIAAAACAAgAAgAAAAAAAAAAAIgYDMvQU1aGe+cfVVGTiblU01CD5iUVZ5R0TN3vLEfEbItkcqLRVVTAAAIAAAACAAAAAgAIAAIAAAAAAAAAAAAAiAgKXkSekytkdeEL5hKx9yHbmVYxTnwACtpyPIYSoKKn36Bz5zUhcMAAAgAAAAIAAAACAAgAAgAEAAAAAAAAAIgIC+zpfQojN0RQ0AwXD8FhQljskX2TPELmbE5u2tstKXGEcqLRVVTAAAIAAAACAAAAAgAIAAIABAAAAAAAAAAAA'
    const signedPSBT = await btc.signPSBT(psbtText)

    expect(signedPSBT).toBe(signedPsbtText)
    expect(confirmActionSpy).toHaveBeenCalledTimes(1)
    expect(confirmActionSpy).toHaveBeenCalledWith({
      actionType: ActionType.SIGN_PSBT,
      payload: expectedTrxInfo
    },
    expect.any(Function),
    expect.any(Function))
  })

  test('Sign PSBT proof of reserves', async () => {
    const { actionConfirmer, btc } = await setupBTC({
      mnemonic: mnemonic1
    })
    console.log('Full multisig xpub: ', btc.fullXPUBMultisig())
    const confirmActionSpy = jest.spyOn(actionConfirmer, 'confirm')
    const signedPsbtText = 'cHNidP8BAH4BAAAAAjx+p9IScTIVUfwP4IBDCp0YJc1nymOpQgY/76bYAs4uAAAAAAD/////7LA+mNF53+K13YUab9fBaoMLoDGMAgjxalPehgEhtzoBAAAAAP////8BcBcAAAAAAAAZdqkUn3/QltN+0sDj9/DPySS+70/862iIrAAAAAAAAQEKAAAAAAAAAAABUQEHAAABAStwFwAAAAAAACIAIDNBa463d8yA8PWOi4dMPhdlfS20Kb1tiudtqMSdCg9jIgICU2CGOnnwKuB1Yjadth7xInlcMd/A9NjrNDJbXVUdkBdIMEUCIQC76XrQh/OgYzv7R2wp2o89QKEPjxwv5yQk0ZSsuLRz/wIgd4qO5o9EXpmCfrg+m9VK43wB7F/G2tesy6qCBeMd8rsBAQVHUiECU2CGOnnwKuB1Yjadth7xInlcMd/A9NjrNDJbXVUdkBchAnGosqpP8kqWHGyuHnnozKDrfrh/eO/i1tnQAGwDcjj7Uq4iBgJTYIY6efAq4HViNp22HvEieVwx38D02Os0MltdVR2QFxz5zUhcMAAAgAAAAIAAAACAAgAAgAAAAAAAAAAAIgYCcaiyqk/ySpYcbK4eeejMoOt+uH947+LW2dAAbANyOPscqqtd2jAAAIAAAACAAAAAgAIAAIAAAAAAAAAAAAAA'
    const signedPSBT = await btc.signPSBT(psbtTextProofOfReserves)

    expect(signedPSBT).toBe(signedPsbtText)
    expect(confirmActionSpy).toHaveBeenCalledTimes(1)
    expect(confirmActionSpy).toHaveBeenCalledWith({
      actionType: ActionType.SIGN_PSBT,
      payload: expectedTrxInfoProofOfReserves
    },
    expect.any(Function),
    expect.any(Function))
  })
  test('Should not sign PSBT when action confirmer is canceled', async () => {
    const cancelReason = 'User cancelled'
    const { btc } = await setupBTC({
      mnemonic: mnemonic1,
      cancelReason
    })
    try {
      await btc.signPSBT(psbtText)
    } catch (err) {
      expect(err.message).toContain(cancelReason)
    }
  })

  test('Should not sign PSBT when vault is locked', async () => {
    const { btc, vault } = await setupBTC({
      mnemonic: mnemonic1
    })
    try {
      await vault.lock()
      await btc.signPSBT(psbtText)
    } catch (err) {
      expect(err.message).toContain('BTC object is locked')
    }
  })
})

async function setupBTC ({
  mnemonic,
  cancelReason = null
}) {
  const actionConfirmer = new PredefinedActionConfirmer(cancelReason)
  const vault = new VaultMock({
    actionConfirmer
  })
  const xkey = await createXKey({
    mnemonic,
    network: btcjs.networks.testnet
  })
  const btc = createBTC({
    vault,
    xkey
  })

  return {
    actionConfirmer,
    vault,
    xkey,
    btc
  }
}
