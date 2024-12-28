// hooks/useUserVerification.ts
import { useCallback, useState } from "react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { UserType, UserVerification } from "../types/vote";
import { useProgram } from "./useProgram";
import { useWallet } from "@solana/wallet-adapter-react";

export const useUserVerification = () => {
  const { program } = useProgram();
  const { publicKey } = useWallet();
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
    async (idNumber: string, userType: UserType) => {
      if (!program || !publicKey) {
        throw new Error("Program or wallet not connected");
      }

      setIsLoading(true);
      setError(null);

      try {
        const userVerificationPDA = getVerificationPDA(publicKey);
        if (!userVerificationPDA) throw new Error("Could not derive PDA");

        const tx = await program.methods
          .verifyUser(idNumber, userType)
          .accounts({
            user: publicKey,
            userVerification: userVerificationPDA,
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
    [program, publicKey, getVerificationPDA]
  );

  const fetchVerification = useCallback(
    async (userPubkey: PublicKey): Promise<UserVerification | null> => {
      if (!program) return null;

      try {
        const pda = getVerificationPDA(userPubkey);
        if (!pda) return null;

        const verification = await program.account.userVerification.fetch(pda);
        return verification as UserVerification;
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
