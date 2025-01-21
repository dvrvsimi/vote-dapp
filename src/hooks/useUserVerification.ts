// hooks/useUserVerification.ts
import { useCallback, useState } from "react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { useProgram } from "./useProgram";
import { useAppKitAccount } from '@reown/appkit/react';
import { UserType, UserVerification } from "../types/vote";

// Helper type for program's enum representation
type UserTypeEnum = { student: Record<string, never> } | { staff: Record<string, never> };

export const useUserVerification = () => {
  const { program } = useProgram();
  const { address } = useAppKitAccount();
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
      if (!program || !address) {
        throw new Error("Program or wallet not connected");
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

        const tx = await program.methods
          .verifyUser(idNumber, userTypeEnum)
          .accounts({
            user: userPublicKey,
            userVerification: userVerificationPda,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        await program.provider.connection.confirmTransaction(tx);
        return tx;
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [program, address, getVerificationPDA]
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
          verificationTime: verification.verificationTime.toNumber(), // Convert BN to number
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