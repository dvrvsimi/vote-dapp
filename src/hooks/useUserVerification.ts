import { useCallback, useState } from "react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { useProgram } from "./useProgram";
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { useAppKitConnection } from '@reown/appkit-adapter-solana/react';
import type { Provider } from '@reown/appkit-adapter-solana/react';
import { UserType, UserVerification } from "../types/vote";

// Helper type for program's enum representation
type UserTypeEnum = { student: Record<string, never> } | { staff: Record<string, never> };

export const useUserVerification = () => {
  const { program } = useProgram();
  const { address } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider<Provider>('solana');
  const { connection } = useAppKitConnection();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getVerificationPDA = useCallback(
    (userPubkey: PublicKey) => {
      if (!program) return null;

      const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("user_verification"), userPubkey.toBuffer()],
        program.programId
      );
      return pda;
    },
    [program]
  );

  const verifyUser = useCallback(
    async (idNumber: string, userType: "student" | "staff") => {
      if (!program || !address || !walletProvider || !connection) {
        throw new Error("Program, wallet, provider or connection not initialized");
      }

      setIsLoading(true);
      setError(null);

      try {
        const userPublicKey = new PublicKey(address);
        const userVerificationPda = getVerificationPDA(userPublicKey);
        if (!userVerificationPda) throw new Error("Could not derive PDA");

        // Create the enum in the format Anchor expects
        const userTypeEnum: UserTypeEnum = userType === "student" 
          ? { student: {} }
          : { staff: {} };

        // Get the latest blockhash
        const latestBlockhash = await connection.getLatestBlockhash();

        // Get the transaction from program methods
        const tx = await program.methods
          .verifyUser(idNumber, userTypeEnum)
          .accounts({
            user: userPublicKey,
            userVerification: userVerificationPda,
            systemProgram: SystemProgram.programId,
          })
          .transaction();

        // Set the blockhash and fee payer
        tx.recentBlockhash = latestBlockhash.blockhash;
        tx.feePayer = userPublicKey;

        // Use AppKit's walletProvider to send transaction
        const signature = await walletProvider.sendTransaction(tx, program.provider.connection);
        
        // Wait for confirmation
        await connection.confirmTransaction(signature);
        
        return { signature };
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [program, address, walletProvider, connection, getVerificationPDA]
  );

  const fetchVerification = useCallback(
    async (userPubkey: PublicKey): Promise<UserVerification | null> => {
      if (!program) return null;

      try {
        const pda = getVerificationPDA(userPubkey);
        if (!pda) return null;

        const verification = await program.account.userVerification.fetch(pda);
        
        // Convert program account format to our interface format
        return {
          user: verification.user,
          idNumber: verification.idNumber,
          userType: verification.userType as UserType,
          isVerified: verification.isVerified,
          verificationTime: verification.verificationTime.toNumber(),
          bump: verification.bump,
        };
      } catch (err) {
        console.error("Error fetching verification:", err);
        return null;
      }
    },
    [program, getVerificationPDA]
  );

  return {
    verifyUser,
    fetchVerification,
    isLoading,
    error,
    getVerificationPDA,
  };
};