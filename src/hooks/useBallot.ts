// hooks/useBallot.ts
import { useCallback, useState } from "react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { useProgram } from "./useProgram";
import { useWallet } from "@solana/wallet-adapter-react";
import { Ballot } from "../types/vote";

export const useBallot = (electionPDA?: PublicKey) => {
  const { program } = useProgram();
  const { publicKey } = useWallet();
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
      if (!program || !publicKey || !electionPDA) {
        throw new Error("Missing required parameters");
      }

      setIsLoading(true);
      try {
        const ballotPDA = getBallotPDA(electionPDA, publicKey);
        const userVerificationPDA = PublicKey.findProgramAddressSync(
          [Buffer.from("user_verification"), publicKey.toBuffer()],
          program.programId
        )[0];
        const electionVoterPDA = PublicKey.findProgramAddressSync(
          [
            Buffer.from("election_voter"),
            electionPDA.toBuffer(),
            publicKey.toBuffer(),
          ],
          program.programId
        )[0];

        if (!ballotPDA) throw new Error("Could not derive ballot PDA");

        const tx = await program.methods
          .vote(Buffer.from(plusVotes), Buffer.from(minusVotes))
          .accounts({
            voter: publicKey,
            election: electionPDA,
            ballot: ballotPDA,
            electionVoter: electionVoterPDA,
            userVerification: userVerificationPDA,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        await program.provider.connection.confirmTransaction(tx);
        return tx;
      } finally {
        setIsLoading(false);
      }
    },
    [program, publicKey, electionPDA, getBallotPDA]
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
