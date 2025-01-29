import React from 'react';
import { useAppKit, useAppKitAccount, useDisconnect } from '@reown/appkit/react';
import { Button } from '@/components/ui/button';

export function WalletConnection() {
  const { open } = useAppKit();
  const { address, isConnected, status } = useAppKitAccount();
  const { disconnect } = useDisconnect();

  // Handle connection states
  if (status === 'connecting' || status === 'reconnecting') {
    return (
      <Button disabled className="w-40">
        Connecting...
      </Button>
    );
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">
          {address.slice(0, 4)}...{address.slice(-4)}
        </span>
        <Button 
          variant="outline"
          onClick={() => disconnect()}
          className="w-32"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={() => open()}
      className="w-32 bg-purple-600 text-white hover:bg-purple-700"
    >
      Connect
    </Button>
  );
}