'use client';

import { createAppKit } from '@reown/appkit';  // not from '@reown/appkit/react' !!!
import { getAppKit } from '@reown/appkit/react';
import { SolanaAdapter } from '@reown/appkit-adapter-solana';
import { solana, solanaDevnet } from '@reown/appkit/networks';
import { PropsWithChildren, useEffect, useState } from 'react';

export function AppKitWrapper({ children }: PropsWithChildren) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      const appkit = createAppKit({
        adapters: [new SolanaAdapter()],
        projectId: process.env.NEXT_PUBLIC_PROJECT_ID!,
        networks: [solana, solanaDevnet],
        metadata: {
          name: 'elect.io',
          description: 'Secure, transparent, and decentralized voting platform on Solana',
          url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          icons: ['/favicon.png']
        },
        features: {
          swaps: false,
          onramp: false,
          email: false,
          socials: [],
          history: true,
          analytics: false,
          allWallets: true
        },
        defaultNetwork: solana
      });

      getAppKit(appkit);
      setIsInitialized(true);
    }
  }, [isInitialized]);

  if (!isInitialized) {
    return null; // loading state incase appkit is not initialized  
  }

  return children;
}