'use client';

import { createAppKit } from '@reown/appkit/react';
import { PropsWithChildren, createContext, useContext, useEffect, useState } from 'react';

const AppKitContext = createContext<boolean>(false);

// Flag to track if AppKit has been initialized
let isAppKitInitialized = false;

function initializeAppKit() {
  if (typeof window === 'undefined' || isAppKitInitialized) return;

  try {
    createAppKit({
      appName: 'elect.io',
      chains: [
        {
          chainId: 'solana:devnet',
          name: 'Solana Devnet',
          rpc: 'https://api.devnet.solana.com',
          namespace: 'solana'
        }
      ],
      features: {
        swaps: false,
        onramp: false,
        email: false,
        socials: [],
        history: true,
        analytics: false,
        allWallets: true
      },
      metadata: {
        name: 'elect.io',
        description: 'Secure, transparent, and decentralized voting platform on Solana',
        url: 'https://elect.io',
        icons: ['https://elect.io/favicon.png']
      }
    });
    isAppKitInitialized = true;
  } catch (error) {
    console.error('Error initializing AppKit:', error);
  }
}

export function AppKitWrapper({ children }: PropsWithChildren) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      initializeAppKit();
      setIsInitialized(true);
    }
  }, [isInitialized]);

  if (typeof window === 'undefined') {
    return <>{children}</>;
  }

  return (
    <AppKitContext.Provider value={isInitialized}>
      {children}
    </AppKitContext.Provider>
  );
}

// Custom hook to ensure AppKit is initialized
export function useAppKitInitialized() {
  const isInitialized = useContext(AppKitContext);
  if (!isInitialized) {
    throw new Error('AppKit must be initialized before using its hooks');
  }
  return isInitialized;
}