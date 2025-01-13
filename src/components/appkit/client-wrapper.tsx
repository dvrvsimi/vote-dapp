// src/components/appkit/client-wrapper.tsx
'use client';

import { useEffect } from 'react';
import { getAppKit } from '@reown/appkit/react';
import { appkit } from '@/app/appkit';

let initialized = false;

export function AppKitWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!initialized) {
      getAppKit(appkit);
      initialized = true;
    }
  }, []);

  return <>{children}</>;
}