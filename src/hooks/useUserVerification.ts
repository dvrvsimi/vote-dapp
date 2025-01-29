// src/hooks/useUserVerification.ts
import { useCallback, useState } from "react";
import { useProgram } from "./useProgram";
import { useAppKitProvider } from '@reown/appkit/react';
import type { Provider } from '@reown/appkit-adapter-solana';
import { PublicKey, SystemProgram } from "@solana/web3.js";

export function useUserVerification() {
  const { program } = useProgram();
  const { walletProvider } = useAppKitProvider<Provider>('solana');
  const [isLoading, setIsLoading] = useState(false);

  const signVerificationMessage = useCallback(async (idNumber: string, userType: string) => {
    if (!walletProvider) throw new Error("Wallet not connected");
    
    const message = JSON.stringify({
      type: 'USER_VERIFICATION',
      idNumber,
      userType,
      timestamp: new Date().toISOString()
    });

    const encodedMessage = new TextEncoder().encode(message);
    return await walletProvider.signMessage(encodedMessage);
  }, [walletProvider]);

  const verifyUser = useCallback(
    async (idNumber: string, userType: "student" | "staff") => {
      if (!program || !walletProvider) throw new Error("Program not connected");
      setIsLoading(true);

      try {
        const signature = await signVerificationMessage(idNumber, userType);
        const userTypeObj = userType === "student" ? { student: {} } : { staff: {} };
        const [userVerificationPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from("user_verification"), Buffer.from(idNumber)],
          program.programId
        );

        const tx = await program.methods
          .verifyUser(
            idNumber, 
            userTypeObj,
            Buffer.from(signature).toString('base64'),
            new Date().toISOString()
          )
          .accounts({
            userVerification: userVerificationPDA,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        return tx;
      } finally {
        setIsLoading(false);
      }
    },
    [program, walletProvider, signVerificationMessage]
  );

  const fetchVerification = useCallback(
    async (userPubkey: PublicKey) => {
      if (!program) return null;

      try {
        const [userVerificationPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from("user_verification"), userPubkey.toBuffer()],
          program.programId
        );

        const account = await program.account.userVerification.fetch(
          userVerificationPDA
        );

        return {
          isVerified: account.isVerified,
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