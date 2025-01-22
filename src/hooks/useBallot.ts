// useBallot.ts
import { useCallback, useState } from "react";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { useProgram } from "./useProgram";
import { useAppKitAccount } from '@reown/appkit/react';
import { Ballot } from "../types/vote";

export const useBallot = (electionPDA?: PublicKey) => {
  const { program } = useProgram();
  const { address } = useAppKitAccount();
  const [isLoading, setIsLoading] = useState(false);

  const getBallotPDA = useCallback(
    (election: PublicKey, voter: PublicKey) => {
      if (!program) return null;

      const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("ballot"), election.toBuffer(), voter.toBuffer()],
        program.programId
      );
      return pda;
    },
    [program]
  );

  const castVote = useCallback(
    async (plusVotes: number[], minusVotes: number[]) => {
      if (!program || !address || !electionPDA) {
        throw new Error("Missing required parameters");
      }

      setIsLoading(true);
      try {
        const voterPubkey = new PublicKey(address);
        const ballotPDA = getBallotPDA(electionPDA, voterPubkey);
        const userVerificationPDA = PublicKey.findProgramAddressSync(
          [Buffer.from("user_verification"), voterPubkey.toBuffer()],
          program.programId
        )[0];
        const electionVoterPDA = PublicKey.findProgramAddressSync(
          [
            Buffer.from("election_voter"),
            electionPDA.toBuffer(),
            voterPubkey.toBuffer(),
          ],
          program.programId
        )[0];

        if (!ballotPDA) throw new Error("Could not derive ballot PDA");

        const tx = await program.methods
          .vote(Buffer.from(plusVotes), Buffer.from(minusVotes))
          .accounts({
            voter: voterPubkey,
            election: electionPDA,
            ballot: ballotPDA,
            electionVoter: electionVoterPDA,
            userVerification: userVerificationPDA,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        return tx;
      } finally {
        setIsLoading(false);
      }
    },
    [program, address, electionPDA, getBallotPDA]
  );

  const fetchBallot = useCallback(
    async (voter: PublicKey): Promise<Ballot | null> => {
      if (!program || !electionPDA) return null;

      try {
        const pda = getBallotPDA(electionPDA, voter);
        if (!pda) return null;

        const ballot = await program.account.ballot.fetch(pda);
        return ballot as Ballot;
      } catch (err) {
        console.error("Error fetching ballot:", err);
        return null;
      }
    },
    [program, electionPDA, getBallotPDA]
  );

  return {
    castVote,
    fetchBallot,
    isLoading,
    getBallotPDA,
  };
};