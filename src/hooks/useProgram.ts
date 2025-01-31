import { useEffect, useMemo, useState } from "react";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { useAppKitConnection } from '@reown/appkit-adapter-solana/react';
import type { Provider } from '@reown/appkit-adapter-solana';
import { Vote } from "../../anchor/target/types/vote";
import VoteIDL from "../../anchor/target/idl/vote.json";

export const PROGRAM_ID = new PublicKey(VoteIDL.address);

export const useProgram = () => {
  const { address } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider<Provider>('solana');
  const { connection } = useAppKitConnection();
  const [program, setProgram] = useState<Program<Vote> | null>(null);

  const provider = useMemo(() => {
    if (!walletProvider || !address || !connection) {
      return null;
    }

    const userPublicKey = new PublicKey(address);

    return new AnchorProvider(
      connection,
      {
        publicKey: userPublicKey,
        signTransaction: async (tx: Transaction) => {
          try {
            const signedTx = await walletProvider.signTransaction(tx);
            return signedTx;
          } catch (error) {
            console.error('Transaction signing failed:', error);
            throw error;
          }
        },
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

  useEffect(() => {
    if (provider) {
      try {
        const programInstance = new Program(
          VoteIDL as any,
          PROGRAM_ID,
          provider
        );
        setProgram(programInstance);
      } catch (error) {
        console.error('Failed to initialize program:', error);
        setProgram(null);
      }
    } else {
      setProgram(null);
    }
  }, [provider]);

  return {
    program,
    provider,
    connected: !!address && !!walletProvider && !!connection
  };
};