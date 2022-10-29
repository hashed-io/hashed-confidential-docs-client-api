
jest.setTimeout(70000)

const btcjs = require('bitcoinjs-lib')

const { ActionType } = require('../../../src/const')
const { PredefinedActionConfirmer } = require('../../../src/model/action-confirmer')
const { createBTC, createXKey } = require('../../../src/model/btc')
const VaultMock = require('../../support/VaultMock')

const psbtText = 'cHNidP8BAH0BAAAAAdXuu3IED9S60Omnf/WHLT+J8qrhpYogZ74/weQP3wYtAAAAAAD9////ApdKAAAAAAAAIgAgVgpgVYN7cpdeGpYqj/SqPJ9xSRC/NfCV1WBN9a6PjcAQJwAAAAAAABYAFN/MoQ/TWYyv1JKSJ8O//Qzl2aeXAAAAAAABAOoCAAAAAAEBpD4rrrXl2igLagnrYYoFg7eHapxeOhJn4FlsvVaF9KAAAAAAAP7///8CMHUAAAAAAAAiACAKskUgXIRuFNk+kXVu0ROvvrP6eoH0mdb/JazQsruP5PiISgAAAAAAFgAUNAY1ixp3MRBepRuRYLdXa6r6jeQCRzBEAiBnLFY6GsOYaE0jOnUPPabL62WJDhuTQgYUB8XOShMdbgIgFoiB4ntE9FEtfUZzlnCMBh91liI1ffBYyCOQwSx+ZWYBIQKRXTNQp5ekscMjVNhM5ya7vCem67bFjmzuByZ33RAGsYdJJAABASswdQAAAAAAACIAIAqyRSBchG4U2T6RdW7RE6++s/p6gfSZ1v8lrNCyu4/kAQVHUiECU2CGOnnwKuB1Yjadth7xInlcMd/A9NjrNDJbXVUdkBchAzL0FNWhnvnH1VRk4m5VNNQg+YlFWeUdEzd7yxHxGyLZUq4iBgJTYIY6efAq4HViNp22HvEieVwx38D02Os0MltdVR2QFxz5zUhcMAAAgAAAAIAAAACAAgAAgAAAAAAAAAAAIgYDMvQU1aGe+cfVVGTiblU01CD5iUVZ5R0TN3vLEfEbItkcqLRVVTAAAIAAAACAAAAAgAIAAIAAAAAAAAAAAAAiAgKXkSekytkdeEL5hKx9yHbmVYxTnwACtpyPIYSoKKn36Bz5zUhcMAAAgAAAAIAAAACAAgAAgAEAAAAAAAAAIgIC+zpfQojN0RQ0AwXD8FhQljskX2TPELmbE5u2tstKXGEcqLRVVTAAAIAAAACAAAAAgAIAAIABAAAAAAAAAAAA'
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
  ]
}

describe('Test BTC functionality', () => {
  test('Get PSBT Trx Info', async () => {
    const mnemonic = 'over whip setup elephant program cost absurd around myth twist discover raw'
    const { btc } = await setupBTC({
      mnemonic
    })
    const trxInfo = await btc.getTrxInfoFromPSBTText(psbtText)

    expect(trxInfo).toEqual(expectedTrxInfo)
  })
  test('Sign PSBT', async () => {
    const mnemonic = 'over whip setup elephant program cost absurd around myth twist discover raw'
    const { actionConfirmer, btc } = await setupBTC({
      mnemonic
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
  test('Should not sign PSBT when action confirmer is canceled', async () => {
    const mnemonic = 'over whip setup elephant program cost absurd around myth twist discover raw'
    const cancelReason = 'User cancelled'
    const { btc } = await setupBTC({
      mnemonic,
      cancelReason
    })
    try {
      await btc.signPSBT(psbtText)
    } catch (err) {
      expect(err.message).toContain(cancelReason)
    }
  })

  test('Should not sign PSBT when vault is locked', async () => {
    const mnemonic = 'over whip setup elephant program cost absurd around myth twist discover raw'
    const { btc, vault } = await setupBTC({
      mnemonic
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
