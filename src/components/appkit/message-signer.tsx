// src/components/SignMessage.tsx
import { useState } from 'react'
import { useSignMessage } from '@/hooks/useSignMessage'
import { useAppKitAccount } from '@reown/appkit/react'

export function SignMessage() {
  const [message, setMessage] = useState('')
  const { signMessage, signature, error, isLoading } = useSignMessage()
  const { isConnected } = useAppKitAccount()

  const handleSign = async () => {
    if (!message) return
    try {
      await signMessage(message)
    } catch (err) {
      console.error('Failed to sign:', err)
    }
  }

  if (!isConnected) {
    return <p className="text-gray-600">Please connect your wallet to sign messages</p>
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700">
          Message to Sign
        </label>
        <input
          type="text"
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          placeholder="Enter a message to sign..."
        />
      </div>

      <button
        onClick={handleSign}
        disabled={isLoading || !message}
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {isLoading ? 'Signing...' : 'Sign Message'}
      </button>

      {error && (
        <div className="text-red-600 text-sm">
          {error}
        </div>
      )}

      {signature && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700">Signature:</h4>
          <pre className="mt-1 text-sm text-gray-600 bg-gray-50 p-2 rounded overflow-x-auto">
            {Buffer.from(signature).toString('base64')}
          </pre>
        </div>
      )}
    </div>
  )
}