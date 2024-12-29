import "./globals.css";
import { ClusterProvider } from "@/components/cluster/cluster-data-access";
import { SolanaProvider } from "@/components/solana/solana-provider";
import { ReactQueryProvider } from "./react-query-provider";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

export const metadata = {
  title: "elect.io",
  description: "Secure, transparent, and decentralized voting platform on Solana",
  icons: {
    icon: [
      { url: '/favicon.png'},
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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