// useVoter.ts
import { useCallback, useState } from "react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { useProgram } from "./useProgram";
import { useAppKitAccount } from '@reown/appkit/react';
import { VoterStatus, ElectionVoter } from "../types/vote";

export const useVoter = (electionPDA?: PublicKey) => {
  const { program } = useProgram();
  const { address } = useAppKitAccount();
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

      const tx = await program.methods
        .registerVoter()
        .accounts({
          voter: voterPubkey,
          election: electionPDA,
          electionVoter: electionVoterPDA,
          userVerification: userVerificationPDA,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return tx;
    } finally {
      setIsLoading(false);
    }
  }, [program, address, electionPDA, getElectionVoterPDA]);

  return {
    registerVoter,
    getElectionVoterPDA,
    isLoading,
  };
};