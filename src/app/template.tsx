// src/app/template.tsx
export const metadata = {
    title: "elect.io",
    description: "Secure, transparent, and decentralized voting platform on Solana",
    icons: {
      icon: [
        { url: '/favicon.png'},
      ],
    },
  };
  
  export default function Template({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return children;
  }