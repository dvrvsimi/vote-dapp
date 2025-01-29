// useVoter.ts
import { useCallback, useState } from "react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { useProgram } from "./useProgram";
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import type { Provider } from '@reown/appkit-adapter-solana';
import { VoterStatus, ElectionVoter } from "../types/vote";

export const useVoter = (electionPDA?: PublicKey) => {
  const { program } = useProgram();
  const { address } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider<Provider>('solana');
  const [isLoading, setIsLoading] = useState(false);

  const getElectionVoterPDA = useCallback(
    (election: PublicKey, voter: PublicKey) => {
      if (!program) return null;
      const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("election_voter"), election.toBuffer(), voter.toBuffer()],
        program.programId
      );
      return pda;
    },
    [program]
  );

  // Sign registration message
  const signRegistrationMessage = async (voterPubkey: PublicKey) => {
    if (!walletProvider) throw new Error("Wallet not connected");

    const message = JSON.stringify({
      type: 'VOTER_REGISTRATION',
      voter: voterPubkey.toString(),
      election: electionPDA?.toString(),
      timestamp: new Date().toISOString()
    });

    const encodedMessage = new TextEncoder().encode(message);
    const signature = await walletProvider.signMessage(encodedMessage);
    
    return {
      signature,
      message
    };
  };

  const registerVoter = useCallback(async () => {
    if (!program || !address || !electionPDA)
      throw new Error("Missing required parameters");
    setIsLoading(true);

    try {
      const voterPubkey = new PublicKey(address);
      const electionVoterPDA = getElectionVoterPDA(electionPDA, voterPubkey);
      const userVerificationPDA = PublicKey.findProgramAddressSync(
        [Buffer.from("user_verification"), voterPubkey.toBuffer()],
        program.programId
      )[0];

      if (!electionVoterPDA) throw new Error("Could not derive PDA");

      // First sign the registration message
      const { signature, message } = await signRegistrationMessage(voterPubkey);

      // Create buffer from signature for on-chain storage/verification
      const signatureBuffer = Buffer.from(signature);

      // Send transaction with signature included
      const tx = await program.methods
        .registerVoter(signatureBuffer)  // Add signature as instruction data
        .accounts({
          voter: voterPubkey,
          election: electionPDA,
          electionVoter: electionVoterPDA,
          userVerification: userVerificationPDA,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return {
        transaction: tx,
        signature: Buffer.from(signature).toString('base64'),
        message
      };
    } finally {
      setIsLoading(false);
    }
  }, [program, address, electionPDA, getElectionVoterPDA, walletProvider]);

  // Verify if a voter is registered
  const verifyVoterRegistration = useCallback(async (voterPubkey: PublicKey) => {
    if (!program || !electionPDA) return false;
    
    try {
      const electionVoterPDA = getElectionVoterPDA(electionPDA, voterPubkey);
      if (!electionVoterPDA) return false;

      const voterAccount = await program.account.electionVoter.fetch(electionVoterPDA);
      return voterAccount ? true : false;
    } catch (error) {
      return false;
    }
  }, [program, electionPDA, getElectionVoterPDA]);

  return {
    registerVoter,
    getElectionVoterPDA,
    verifyVoterRegistration,
    isLoading,
  };
};