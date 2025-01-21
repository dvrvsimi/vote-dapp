'use client';

import { useAppKit, useAppKitAccount, useDisconnect } from '@reown/appkit/react';
import { Button } from "@/components/ui/button";

export function WalletConnection() {
  const { open } = useAppKit();
  const { address, isConnected, status } = useAppKitAccount();
  const { disconnect } = useDisconnect();

  // Handle connecting wallet
  const handleConnect = async () => {
    try {
      await open();
    } catch (error) {
      console.error('Failed to open wallet connection modal:', error);
    }
  };

  // Handle disconnecting wallet
  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  if (status === 'connecting' || status === 'reconnecting') {
    return (
      <Button 
        disabled
        className="!bg-purple-600 hover:!bg-purple-700 text-sm"
      >
        <span className="animate-pulse">Connecting...</span>
      </Button>
    );
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          className="text-sm font-medium hover:bg-purple-100"
          onClick={() => {
            navigator.clipboard.writeText(address);
            alert('Address copied to clipboard');
          }}
        >
          {address.slice(0, 4)}...{address.slice(-4)}
        </Button>
        <Button
          onClick={handleDisconnect}
          className="!bg-purple-600 hover:!bg-purple-700 text-sm"
          size="sm"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      className="!bg-purple-600 hover:!bg-purple-700 text-sm text-white"
    >
      Connect Wallet
    </Button>
  );
}