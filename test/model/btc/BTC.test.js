
jest.setTimeout(70000)

const btcjs = require('bitcoinjs-lib')

const { PredefinedActionConfirmer } = require('../../../src/model/action-confirmer')
const { createBTC, createXKey } = require('../../../src/model/btc')
const VaultMock = require('../../support/VaultMock')

describe('Test BTC functionality', () => {
  test('Sign PSBT', async () => {
    const mnemonic = 'over whip setup elephant program cost absurd around myth twist discover raw'
    const { btc } = await setupBTC({
      mnemonic
    })
    const psbtText = 'cHNidP8BAH0BAAAAAdXuu3IED9S60Omnf/WHLT+J8qrhpYogZ74/weQP3wYtAAAAAAD9////ApdKAAAAAAAAIgAgVgpgVYN7cpdeGpYqj/SqPJ9xSRC/NfCV1WBN9a6PjcAQJwAAAAAAABYAFN/MoQ/TWYyv1JKSJ8O//Qzl2aeXAAAAAAABAOoCAAAAAAEBpD4rrrXl2igLagnrYYoFg7eHapxeOhJn4FlsvVaF9KAAAAAAAP7///8CMHUAAAAAAAAiACAKskUgXIRuFNk+kXVu0ROvvrP6eoH0mdb/JazQsruP5PiISgAAAAAAFgAUNAY1ixp3MRBepRuRYLdXa6r6jeQCRzBEAiBnLFY6GsOYaE0jOnUPPabL62WJDhuTQgYUB8XOShMdbgIgFoiB4ntE9FEtfUZzlnCMBh91liI1ffBYyCOQwSx+ZWYBIQKRXTNQp5ekscMjVNhM5ya7vCem67bFjmzuByZ33RAGsYdJJAABASswdQAAAAAAACIAIAqyRSBchG4U2T6RdW7RE6++s/p6gfSZ1v8lrNCyu4/kAQVHUiECU2CGOnnwKuB1Yjadth7xInlcMd/A9NjrNDJbXVUdkBchAzL0FNWhnvnH1VRk4m5VNNQg+YlFWeUdEzd7yxHxGyLZUq4iBgJTYIY6efAq4HViNp22HvEieVwx38D02Os0MltdVR2QFxz5zUhcMAAAgAAAAIAAAACAAgAAgAAAAAAAAAAAIgYDMvQU1aGe+cfVVGTiblU01CD5iUVZ5R0TN3vLEfEbItkcqLRVVTAAAIAAAACAAAAAgAIAAIAAAAAAAAAAAAAiAgKXkSekytkdeEL5hKx9yHbmVYxTnwACtpyPIYSoKKn36Bz5zUhcMAAAgAAAAIAAAACAAgAAgAEAAAAAAAAAIgIC+zpfQojN0RQ0AwXD8FhQljskX2TPELmbE5u2tstKXGEcqLRVVTAAAIAAAACAAAAAgAIAAIABAAAAAAAAAAAA'
    const signedPsbtText = 'cHNidP8BAH0BAAAAAdXuu3IED9S60Omnf/WHLT+J8qrhpYogZ74/weQP3wYtAAAAAAD9////ApdKAAAAAAAAIgAgVgpgVYN7cpdeGpYqj/SqPJ9xSRC/NfCV1WBN9a6PjcAQJwAAAAAAABYAFN/MoQ/TWYyv1JKSJ8O//Qzl2aeXAAAAAAABAOoCAAAAAAEBpD4rrrXl2igLagnrYYoFg7eHapxeOhJn4FlsvVaF9KAAAAAAAP7///8CMHUAAAAAAAAiACAKskUgXIRuFNk+kXVu0ROvvrP6eoH0mdb/JazQsruP5PiISgAAAAAAFgAUNAY1ixp3MRBepRuRYLdXa6r6jeQCRzBEAiBnLFY6GsOYaE0jOnUPPabL62WJDhuTQgYUB8XOShMdbgIgFoiB4ntE9FEtfUZzlnCMBh91liI1ffBYyCOQwSx+ZWYBIQKRXTNQp5ekscMjVNhM5ya7vCem67bFjmzuByZ33RAGsYdJJAABASswdQAAAAAAACIAIAqyRSBchG4U2T6RdW7RE6++s/p6gfSZ1v8lrNCyu4/kIgICU2CGOnnwKuB1Yjadth7xInlcMd/A9NjrNDJbXVUdkBdIMEUCIQDAALZ64VX2Fm7PdNaTAfu/K8t/7qwZWdIMXeBPKDwmZgIgeRiQcEgCKFuSw1KNZxaUAm+Tq8gwkSoXCglwV6tiq8ABAQVHUiECU2CGOnnwKuB1Yjadth7xInlcMd/A9NjrNDJbXVUdkBchAzL0FNWhnvnH1VRk4m5VNNQg+YlFWeUdEzd7yxHxGyLZUq4iBgJTYIY6efAq4HViNp22HvEieVwx38D02Os0MltdVR2QFxz5zUhcMAAAgAAAAIAAAACAAgAAgAAAAAAAAAAAIgYDMvQU1aGe+cfVVGTiblU01CD5iUVZ5R0TN3vLEfEbItkcqLRVVTAAAIAAAACAAAAAgAIAAIAAAAAAAAAAAAAiAgKXkSekytkdeEL5hKx9yHbmVYxTnwACtpyPIYSoKKn36Bz5zUhcMAAAgAAAAIAAAACAAgAAgAEAAAAAAAAAIgIC+zpfQojN0RQ0AwXD8FhQljskX2TPELmbE5u2tstKXGEcqLRVVTAAAIAAAACAAAAAgAIAAIABAAAAAAAAAAAA'
    const signedPSBT = await btc.signPSBT(psbtText)

    expect(signedPSBT).toBe(signedPsbtText)
  })
  test('Should not sign PSBT when action confirmer is canceled', async () => {
    const mnemonic = 'over whip setup elephant program cost absurd around myth twist discover raw'
    const cancelReason = 'User cancelled'
    const { btc } = await setupBTC({
      mnemonic,
      cancelReason
    })
    try {
      const psbtText = 'cHNidP8BAH0BAAAAAdXuu3IED9S60Omnf/WHLT+J8qrhpYogZ74/weQP3wYtAAAAAAD9////ApdKAAAAAAAAIgAgVgpgVYN7cpdeGpYqj/SqPJ9xSRC/NfCV1WBN9a6PjcAQJwAAAAAAABYAFN/MoQ/TWYyv1JKSJ8O//Qzl2aeXAAAAAAABAOoCAAAAAAEBpD4rrrXl2igLagnrYYoFg7eHapxeOhJn4FlsvVaF9KAAAAAAAP7///8CMHUAAAAAAAAiACAKskUgXIRuFNk+kXVu0ROvvrP6eoH0mdb/JazQsruP5PiISgAAAAAAFgAUNAY1ixp3MRBepRuRYLdXa6r6jeQCRzBEAiBnLFY6GsOYaE0jOnUPPabL62WJDhuTQgYUB8XOShMdbgIgFoiB4ntE9FEtfUZzlnCMBh91liI1ffBYyCOQwSx+ZWYBIQKRXTNQp5ekscMjVNhM5ya7vCem67bFjmzuByZ33RAGsYdJJAABASswdQAAAAAAACIAIAqyRSBchG4U2T6RdW7RE6++s/p6gfSZ1v8lrNCyu4/kAQVHUiECU2CGOnnwKuB1Yjadth7xInlcMd/A9NjrNDJbXVUdkBchAzL0FNWhnvnH1VRk4m5VNNQg+YlFWeUdEzd7yxHxGyLZUq4iBgJTYIY6efAq4HViNp22HvEieVwx38D02Os0MltdVR2QFxz5zUhcMAAAgAAAAIAAAACAAgAAgAAAAAAAAAAAIgYDMvQU1aGe+cfVVGTiblU01CD5iUVZ5R0TN3vLEfEbItkcqLRVVTAAAIAAAACAAAAAgAIAAIAAAAAAAAAAAAAiAgKXkSekytkdeEL5hKx9yHbmVYxTnwACtpyPIYSoKKn36Bz5zUhcMAAAgAAAAIAAAACAAgAAgAEAAAAAAAAAIgIC+zpfQojN0RQ0AwXD8FhQljskX2TPELmbE5u2tstKXGEcqLRVVTAAAIAAAACAAAAAgAIAAIABAAAAAAAAAAAA'
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
      const psbtText = 'cHNidP8BAH0BAAAAAdXuu3IED9S60Omnf/WHLT+J8qrhpYogZ74/weQP3wYtAAAAAAD9////ApdKAAAAAAAAIgAgVgpgVYN7cpdeGpYqj/SqPJ9xSRC/NfCV1WBN9a6PjcAQJwAAAAAAABYAFN/MoQ/TWYyv1JKSJ8O//Qzl2aeXAAAAAAABAOoCAAAAAAEBpD4rrrXl2igLagnrYYoFg7eHapxeOhJn4FlsvVaF9KAAAAAAAP7///8CMHUAAAAAAAAiACAKskUgXIRuFNk+kXVu0ROvvrP6eoH0mdb/JazQsruP5PiISgAAAAAAFgAUNAY1ixp3MRBepRuRYLdXa6r6jeQCRzBEAiBnLFY6GsOYaE0jOnUPPabL62WJDhuTQgYUB8XOShMdbgIgFoiB4ntE9FEtfUZzlnCMBh91liI1ffBYyCOQwSx+ZWYBIQKRXTNQp5ekscMjVNhM5ya7vCem67bFjmzuByZ33RAGsYdJJAABASswdQAAAAAAACIAIAqyRSBchG4U2T6RdW7RE6++s/p6gfSZ1v8lrNCyu4/kAQVHUiECU2CGOnnwKuB1Yjadth7xInlcMd/A9NjrNDJbXVUdkBchAzL0FNWhnvnH1VRk4m5VNNQg+YlFWeUdEzd7yxHxGyLZUq4iBgJTYIY6efAq4HViNp22HvEieVwx38D02Os0MltdVR2QFxz5zUhcMAAAgAAAAIAAAACAAgAAgAAAAAAAAAAAIgYDMvQU1aGe+cfVVGTiblU01CD5iUVZ5R0TN3vLEfEbItkcqLRVVTAAAIAAAACAAAAAgAIAAIAAAAAAAAAAAAAiAgKXkSekytkdeEL5hKx9yHbmVYxTnwACtpyPIYSoKKn36Bz5zUhcMAAAgAAAAIAAAACAAgAAgAEAAAAAAAAAIgIC+zpfQojN0RQ0AwXD8FhQljskX2TPELmbE5u2tstKXGEcqLRVVTAAAIAAAACAAAAAgAIAAIABAAAAAAAAAAAA'
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
  const vault = new VaultMock({
    actionConfirmer: new PredefinedActionConfirmer(cancelReason)
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
    vault,
    xkey,
    btc
  }
}
