// hooks/useProgram.ts
import { useEffect, useMemo } from "react";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { Vote } from "../../anchor/target/types/vote";
import VoteIDL from "../../anchor/target/idl/vote.json";

export const PROGRAM_ID = new PublicKey(VoteIDL.address);
export const useProgram = () => {
  const { wallet, publicKey, signTransaction, signAllTransactions } =
    useWallet();

  const connection = useMemo(
    () => new Connection("https://api.devnet.solana.com", "confirmed"),
    []
  );

  const provider = useMemo(() => {
    if (!wallet || !publicKey || !signTransaction || !signAllTransactions) {
      return null;
    }

    return new AnchorProvider(
      connection,
      {
        publicKey,
        signTransaction,
        signAllTransactions,
      },
      { commitment: "confirmed" }
    );
  }, [connection, wallet, publicKey, signTransaction, signAllTransactions]);

  const program = useMemo(() => {
    if (!provider) return null;
    return new Program(VoteIDL as Vote, provider) as Program<Vote>;
  }, [provider]);

  return {
    program,
    connection,
    provider,
    isReady: !!program,
  };
};

export type VoteProgram = ReturnType<typeof useProgram>["program"];
