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
        // Implement sign transaction using AppKit's walletProvider
        signTransaction: async (tx: Transaction) => {
          try {
            const signature = await walletProvider.sendTransaction(tx, connection);
            await connection.confirmTransaction(signature);
            return tx;
          } catch (error) {
            console.error('Transaction signing failed:', error);
            throw error;
          }
        },
        // Implement sign all transactions using AppKit's walletProvider
        signAllTransactions: async (txs: Transaction[]) => {
          try {
            const signedTxs = [];
            for (const tx of txs) {
              const signature = await walletProvider.sendTransaction(tx, connection);
              await connection.confirmTransaction(signature);
              signedTxs.push(tx);
            }
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

  const program = useMemo(() => {
    if (!provider) return null;
    return new Program(VoteIDL as Vote, PROGRAM_ID, provider) as Program<Vote>;
  }, [provider]);

  return {
    program,
    connection,
    provider,
    isReady: !!program,
  };
};

export type VoteProgram = ReturnType<typeof useProgram>["program"];