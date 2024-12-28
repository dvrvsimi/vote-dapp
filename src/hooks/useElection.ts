// hooks/useElection.ts
import { useCallback, useState } from "react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { UserType, Election } from "../types/vote";
import { useProgram } from "./useProgram";
import { useWallet } from "@solana/wallet-adapter-react";

export const useElection = (electionId?: string) => {
  const { program } = useProgram();
  const { publicKey } = useWallet();
  const [isLoading, setIsLoading] = useState(false);

  const getElectionPDA = useCallback(
    (authority: PublicKey, id: string) => {
      if (!program) return null;

      const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("election"), authority.toBuffer(), Buffer.from(id)],
        program.programId
      );
      return pda;
    },
    [program]
  );

  const initialize = useCallback(
    async (
      id: string,
      name: string,
      candidates: PublicKey[],
      numWinners: number,
      numPlusVotes: number,
      numMinusVotes: number,
      allowedVoterTypes: UserType[]
    ) => {
      if (!program || !publicKey)
        throw new Error("Program or wallet not connected");

      setIsLoading(true);
      try {
        const electionPDA = getElectionPDA(publicKey, id);
        if (!electionPDA) throw new Error("Could not derive PDA");
        const tx = await program.methods
          .initialize(
            id,
            name,
            candidates,
            numWinners,
            numPlusVotes,
            numMinusVotes,
            allowedVoterTypes
          )
          .accounts({
            authority: publicKey,
            election: electionPDA,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        await program.provider.connection.confirmTransaction(tx);
        return tx;
      } finally {
        setIsLoading(false);
      }
    },
    [program, publicKey, getElectionPDA]
  );

  const fetchElectionById = useCallback(
    async (authority: PublicKey, id: string): Promise<Election | null> => {
      if (!program) return null;

      try {
        const pda = getElectionPDA(authority, id);
        if (!pda) return null;

        const election = await program.account.election.fetch(pda);
        return election as Election;
      } catch (err) {
        console.error("Error fetching election:", err);
        return null;
      }
    },
    [program, getElectionPDA]
  );

  const fetchElection = useCallback(
    async (electionPDA: PublicKey): Promise<Election | null> => {
      if (!program) return null;

      try {
        const election = await program.account.election.fetch(electionPDA);
        return election as Election;
      } catch (err) {
        console.error("Error fetching election:", err);
        return null;
      }
    },
    [program]
  );

  const endElection = useCallback(async () => {
    if (!program || !publicKey || !electionId) {
      throw new Error("Missing required parameters");
    }

    setIsLoading(true);
    try {
      const electionPDA = getElectionPDA(publicKey, electionId);
      if (!electionPDA) throw new Error("Could not derive PDA");

      const tx = await program.methods
        .end()
        .accounts({
          authority: publicKey,
          election: electionPDA,
        })
        .rpc();

      await program.provider.connection.confirmTransaction(tx);
      return tx;
    } finally {
      setIsLoading(false);
    }
  }, [program, publicKey, electionId, getElectionPDA]);

  return {
    initialize,
    fetchElection,
    fetchElectionById: fetchElectionById,
    endElection,
    isLoading,
    getElectionPDA,
  };
};
