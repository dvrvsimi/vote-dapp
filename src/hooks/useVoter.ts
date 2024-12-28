// hooks/useVoter.ts
import { useCallback, useState } from "react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { useProgram } from "./useProgram";
import { useWallet } from "@solana/wallet-adapter-react";
import { VoterStatus, ElectionVoter } from "../types/vote";

export const useVoter = (electionPDA?: PublicKey) => {
  const { program } = useProgram();
  const { publicKey } = useWallet();
  const [isLoading, setIsLoading] = useState(false);

  // Helper function to get voter PDA
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

  // Register a new voter
  const registerVoter = useCallback(async () => {
    if (!program || !publicKey || !electionPDA)
      throw new Error("Missing required parameters");
    setIsLoading(true);

    try {
      const electionVoterPDA = getElectionVoterPDA(electionPDA, publicKey);
      const userVerificationPDA = PublicKey.findProgramAddressSync(
        [Buffer.from("user_verification"), publicKey.toBuffer()],
        program.programId
      )[0];

      if (!electionVoterPDA) throw new Error("Could not derive PDA");

      const tx = await program.methods
        .registerVoter()
        .accounts({
          voter: publicKey,
          election: electionPDA,
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
  }, [program, publicKey, electionPDA, getElectionVoterPDA]);

  // Update voter status
  const updateVoterStatus = useCallback(
    async (voter: PublicKey, newStatus: VoterStatus) => {
      if (!program || !publicKey || !electionPDA)
        throw new Error("Missing required parameters");
      setIsLoading(true);

      try {
        const electionVoterPDA = getElectionVoterPDA(electionPDA, voter);
        if (!electionVoterPDA) throw new Error("Could not derive PDA");

        const tx = await program.methods
          .updateVoterStatus(newStatus)
          .accounts({
            authority: publicKey,
            election: electionPDA,
            electionVoter: electionVoterPDA,
          })
          .rpc();

        await program.provider.connection.confirmTransaction(tx);
        return tx;
      } finally {
        setIsLoading(false);
      }
    },
    [program, publicKey, electionPDA, getElectionVoterPDA]
  );

  // Fetch single voter info
  const fetchVoterInfo = useCallback(
    async (voter: PublicKey): Promise<ElectionVoter | null> => {
      if (!program || !electionPDA) return null;

      try {
        const pda = getElectionVoterPDA(electionPDA, voter);
        if (!pda) return null;
        return (await program.account.electionVoter.fetch(
          pda
        )) as ElectionVoter;
      } catch (err) {
        console.error("Error fetching voter info:", err);
        return null;
      }
    },
    [program, electionPDA, getElectionVoterPDA]
  );

  // Fetch recent voters
  const fetchRecentVoters = useCallback(async (): Promise<ElectionVoter[]> => {
    if (!program || !electionPDA) return [];
    setIsLoading(true);

    try {
      const ballots = await program.account.ballot.all([
        {
          memcmp: {
            offset: 40,
            bytes: electionPDA.toBase58(),
          },
        },
      ]);
      console.log("printing ballots info:", ballots);

      const voterInfos = await Promise.all(
        ballots.map((ballot) => fetchVoterInfo(ballot.account.voter))
      );

      console.log("printing voter infos:", voterInfos);
      return voterInfos
        .filter((voter): voter is ElectionVoter => voter !== null)
        .sort((a, b) => b.registrationTime - a.registrationTime);
    } catch (error) {
      console.error("Error fetching voters:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [program, electionPDA, fetchVoterInfo]);

  return {
    registerVoter,
    updateVoterStatus,
    fetchVoterInfo,
    fetchRecentVoters,
    isLoading,
    getElectionVoterPDA,
  };
};
