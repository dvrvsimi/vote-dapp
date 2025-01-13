// src/components/wallet/wallet-connection.tsx
'use client';

import { useAppKit, useAppKitAccount, useDisconnect } from '@reown/appkit/react';
import { Button } from "@/components/ui/button";

export function WalletConnection() {
  try {
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

    // Show loading state while connecting
    if (status === 'connecting' || status === 'reconnecting') {
      return (
        <Button 
          disabled
          className="!bg-purple-600 hover:!bg-purple-700 text-sm"
        >
          Connecting...
        </Button>
      );
    }

    // If connected, show address and disconnect button
    if (isConnected && address) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {address.slice(0, 4)}...{address.slice(-4)}
          </span>
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

    // If not connected, show connect button
    return (
      <Button
        onClick={handleConnect}
        className="!bg-purple-600 hover:!bg-purple-700 text-sm text-white"
      >
        Connect Wallet
      </Button>
    );
  } catch (error) {
    // In development, show more detailed error
    console.error('Wallet connection error:', error);
    
    return (
      <Button 
        className="!bg-purple-600 hover:!bg-purple-700 text-sm"
        onClick={() => window.location.reload()}
      >
        Connect Wallet
      </Button>
    );
  }
}