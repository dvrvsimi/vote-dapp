// src/app/appkit.ts
import { createAppKit } from '@reown/appkit/react'
import { SolanaAdapter } from '@reown/appkit-adapter-solana'
import { solana, solanaDevnet } from '@reown/appkit/networks'

export const appkit = createAppKit({
  adapters: [new SolanaAdapter()], 
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID!,
  networks: [solana, solanaDevnet],
  metadata: {
    name: "elect.io",
    description: "Secure, transparent, and decentralized voting platform on Solana",
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    icons: ['/favicon.png']
  },
  features: {
    email: true,
    socials: ['google', 'github', 'discord'],
    emailShowWallets: true,
  },
  defaultNetwork: solana
})