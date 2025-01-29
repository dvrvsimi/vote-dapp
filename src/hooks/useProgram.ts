// useProgram.ts
import { useEffect, useMemo } from "react";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { useAppKitConnection } from '@reown/appkit-adapter-solana/react';
import type { Provider } from '@reown/appkit-adapter-solana/react';
import { Vote } from "../../anchor/target/types/vote";
import VoteIDL from "../../anchor/target/idl/vote.json";

export const PROGRAM_ID = new PublicKey(VoteIDL.address);

// useProgram.ts
// ... previous imports remain the same

export const useProgram = () => {
  const { address } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider<Provider>('solana');
  const { connection } = useAppKitConnection();

  const provider = useMemo(() => {
    if (!walletProvider || !address || !connection) {
      return null;
    }

    const userPublicKey = new PublicKey(address);

    return new AnchorProvider(
      connection,
      {
        publicKey: userPublicKey,
        // Modify the signTransaction implementation
        signTransaction: async (tx: Transaction) => {
          try {
            const signedTx = await walletProvider.signTransaction(tx);
            return signedTx;
          } catch (error) {
            console.error('Transaction signing failed:', error);
            throw error;
          }
        },
        // Modify the signAllTransactions implementation
        signAllTransactions: async (txs: Transaction[]) => {
          try {
            const signedTxs = await walletProvider.signAllTransactions(txs);
            return signedTxs;
          } catch (error) {
            console.error('Batch transaction signing failed:', error);
            throw error;
          }
        },
      },
      { commitment: "confirmed" }
    );
  }, [connection, walletProvider, address]);

  // ... rest remains the same
};