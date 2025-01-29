// src/hooks/useSignMessage.ts
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react'
import type { Provider } from '@reown/appkit-adapter-solana'
import { useState } from 'react'

export function useSignMessage() {
  const { address } = useAppKitAccount()
  const { walletProvider } = useAppKitProvider<Provider>('solana')
  const [signature, setSignature] = useState<Uint8Array | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const signMessage = async (message: string) => {
    setIsLoading(true)
    setError(null)
    try {
      if (!walletProvider || !address) {
        throw new Error('Wallet not connected')
      }

      // Encode message to bytes
      const encodedMessage = new TextEncoder().encode(message)
      
      // Sign the message
      const sig = await walletProvider.signMessage(encodedMessage)
      setSignature(sig)
      return sig

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign message'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    signMessage,
    signature,
    error,
    isLoading
  }
}