// src/hooks/useUserVerification.ts
import { useCallback, useState } from "react";
import { useProgram } from "../../hooks/useProgram";
import { PublicKey, SystemProgram } from "@solana/web3.js";

interface VerificationSignature {
  signature: string;
  timestamp: string;
}

export function useUserVerification() {
  const { program } = useProgram();
  const [isLoading, setIsLoading] = useState(false);

  const verifyUser = useCallback(
    async (
      userId: string, 
      userType: "student" | "staff",
      signatureData?: VerificationSignature
    ) => {
      if (!program) throw new Error("Program not connected");
      setIsLoading(true);

      try {
        const [userVerificationPDA] = PublicKey.findProgramAddressSync(
          [
            Buffer.from("user_verification"),
            new PublicKey(userId).toBuffer(),
          ],
          program.programId
        );

        const tx = await program.methods
          .verifyUser(userId, { [userType]: {} })
          .accounts({
            userVerification: userVerificationPDA,
            systemProgram: SystemProgram.programId,
          })
          .postInstructions([
            // If signature data is provided, add it to the transaction
            ...(signatureData ? [
              program.instruction.addVerificationSignature(
                signatureData.signature,
                signatureData.timestamp,
                {
                  accounts: {
                    userVerification: userVerificationPDA,
                  },
                }
              )
            ] : [])
          ])
          .rpc();

        return tx;
      } finally {
        setIsLoading(false);
      }
    },
    [program]
  );

  const fetchVerification = useCallback(
    async (publicKey: PublicKey) => {
      if (!program) return null;

      try {
        const [userVerificationPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from("user_verification"), publicKey.toBuffer()],
          program.programId
        );

        const account = await program.account.userVerification.fetch(
          userVerificationPDA
        );

        return {
          isVerified: true,
          userType: account.userType,
          signature: account.signature,
          timestamp: account.signatureTimestamp,
        };
      } catch (error) {
        return null;
      }
    },
    [program]
  );

  return {
    verifyUser,
    fetchVerification,
    isLoading,
  };
}