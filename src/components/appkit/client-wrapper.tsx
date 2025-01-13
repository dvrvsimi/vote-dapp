// src/components/appkit/client-wrapper.tsx
'use client';

import { getAppKit } from '@reown/appkit/react';
import { appkit } from '@/app/appkit';
import { useEffect } from 'react';

let initialized = false;

export function AppKitWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!initialized) {
      try {
        getAppKit(appkit);
        initialized = true;
      } catch (error) {
        console.error('AppKit initialization error:', error);
      }
    }
  }, []);

  return <>{children}</>;
}