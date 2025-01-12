// src/app/layout.tsx
'use client';

import "./globals.css";
import { ClusterProvider } from "@/components/cluster/cluster-data-access";
import { SolanaProvider } from "@/components/solana/solana-provider";
import { ReactQueryProvider } from "./react-query-provider";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { getAppKit } from '@reown/appkit/react'
import { appkit } from '@/config/appkit'
import { useEffect } from 'react';

// Move metadata to a separate template.tsx file since we're using 'use client'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Initialize AppKit
    getAppKit(appkit);
  }, []);

  return (
    <html lang="en">
      <body className="bg-slate-50">
        <ReactQueryProvider>
          <ClusterProvider>
            <SolanaProvider>
              <Header />
              <main className="min-h-screen">
                {children}
              </main>
              <Footer />
            </SolanaProvider>
          </ClusterProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}