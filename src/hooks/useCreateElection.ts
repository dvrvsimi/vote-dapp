import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PublicKey } from "@solana/web3.js";
import { toast } from "sonner";
import { useElection } from "./useElection";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  ElectionFormData,
  CandidateFormData,
  ELECTION_CONSTRAINTS,
} from "../types/election";
import {
  calculateD21Votes,
  validateVoteConfiguration,
} from "../utils/voteCalculations";

interface CreateElectionState {
  step: number;
  data: ElectionFormData;
  isSubmitting: boolean;
  error: string | null;
}

export const useCreateElection = () => {
  const { publicKey } = useWallet();

  const router = useRouter();
  const { initialize, isLoading, getElectionPDA } = useElection();

  // Initialize with default values and D21 calculations for minimum required candidates
  const initialVotes = calculateD21Votes(
    1,
    ELECTION_CONSTRAINTS.candidates.min
  );
  const [state, setState] = useState<CreateElectionState>({
    step: 1,
    data: {
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      voterGroups: [],
      candidates: [],
      numWinners: 1,
      numPlusVotes: initialVotes.numPlusVotes,
      numMinusVotes: initialVotes.numMinusVotes,
    },
    isSubmitting: false,
    error: null,
  });

  // Update vote counts when number of winners or candidates changes
  const handleWinnersChange = useCallback((numWinners: number) => {
    setState((prev) => {
      const numCandidates = Math.max(
        prev.data.candidates.length,
        ELECTION_CONSTRAINTS.candidates.min
      );
      const { numPlusVotes, numMinusVotes } = calculateD21Votes(
        numWinners,
        numCandidates
      );
      return {
        ...prev,
        data: {
          ...prev.data,
          numWinners,
          numPlusVotes,
          numMinusVotes,
        },
      };
    });
  }, []);

  // Basic validation
  const validateForm = useCallback((data: ElectionFormData): string | null => {
    if (data.title.length < ELECTION_CONSTRAINTS.title.min) {
      return "Title is too short";
    }
    if (data.title.length > ELECTION_CONSTRAINTS.title.max) {
      return "Title is too long";
    }
    if (data.description.length > ELECTION_CONSTRAINTS.description.max) {
      return "Description is too long";
    }
    if (data.candidates.length < ELECTION_CONSTRAINTS.candidates.min) {
      return "Not enough candidates";
    }
    if (data.candidates.length > ELECTION_CONSTRAINTS.candidates.max) {
      return "Too many candidates";
    }
    if (data.voterGroups.length === 0) {
      return "At least one voter group must be selected";
    }
    if (new Date(data.startDate) >= new Date(data.endDate)) {
      return "End date must be after start date";
    }

    // Validate D21 vote configuration with current number of candidates
    const voteConfigError = validateVoteConfiguration(
      data.numWinners,
      data.numPlusVotes,
      data.numMinusVotes,
      data.candidates.length
    );
    if (voteConfigError) return voteConfigError;

    return null;
  }, []);

  // Update form data
  const updateFormData = useCallback((updates: Partial<ElectionFormData>) => {
    setState((prev) => {
      // If numWinners is being updated or candidates are being modified, recalculate votes
      if ("numWinners" in updates || "candidates" in updates) {
        const numWinners = updates.numWinners || prev.data.numWinners;
        const candidates = updates.candidates || prev.data.candidates;
        const numCandidates = Math.max(
          candidates.length,
          ELECTION_CONSTRAINTS.candidates.min
        );

        const { numPlusVotes, numMinusVotes } = calculateD21Votes(
          numWinners,
          numCandidates
        );

        updates = {
          ...updates,
          numPlusVotes,
          numMinusVotes,
        };
      }

      return {
        ...prev,
        data: { ...prev.data, ...updates },
        error: null,
      };
    });
  }, []);

  // Handle candidate updates
  const updateCandidates = useCallback((candidates: CandidateFormData[]) => {
    setState((prev) => {
      const numCandidates = Math.max(
        candidates.length,
        ELECTION_CONSTRAINTS.candidates.min
      );
      const { numPlusVotes, numMinusVotes } = calculateD21Votes(
        prev.data.numWinners,
        numCandidates
      );

      return {
        ...prev,
        data: {
          ...prev.data,
          candidates,
          numPlusVotes,
          numMinusVotes,
        },
        error: null,
      };
    });
  }, []);

  // Rest of the hook implementation remains the same...
  const nextStep = useCallback(() => {
    setState((prev) => ({ ...prev, step: prev.step + 1, error: null }));
  }, []);

  const prevStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      step: Math.max(1, prev.step - 1),
      error: null,
    }));
  }, []);

  const submitElection = useCallback(async () => {
    if (!publicKey) {
      toast.error("Please connect your wallet");
      return;
    }
    setState((prev) => ({ ...prev, isSubmitting: true, error: null }));

    try {
      const validationError = validateForm(state.data);
      if (validationError) {
        throw new Error(validationError);
      }

      // Generate election ID
      const electionId = `election-${Date.now()}`;

      // Convert candidate wallet addresses to PublicKeys
      const candidateKeys = state.data.candidates.map(
        (candidate) => new PublicKey(candidate.walletAddress)
      );

      // Map voter groups to their corresponding types
      const allowedVoterTypes = state.data.voterGroups.map((group) =>
        group === "student" ? { student: {} } : { staff: {} }
      );

      // Initialize the election
      await initialize(
        electionId,
        state.data.title,
        candidateKeys,
        state.data.numWinners,
        state.data.numPlusVotes,
        state.data.numMinusVotes,
        allowedVoterTypes
      );

      // Get the election PDA

      // Then in your try block:
      const electionPDA = getElectionPDA(publicKey, electionId);

      if (!electionPDA) {
        throw new Error("Could not generate election PDA");
      }

      toast.success("Election created successfully!");
      router.push(`/election/${electionPDA.toString()}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create election";
      setState((prev) => ({ ...prev, error: message }));
      toast.error(message);
    } finally {
      setState((prev) => ({ ...prev, isSubmitting: false }));
    }
  }, [state.data, initialize, getElectionPDA, router]);

  return {
    state: state.data,
    step: state.step,
    error: state.error,
    isSubmitting: state.isSubmitting || isLoading,
    updateFormData,
    updateCandidates,
    nextStep,
    prevStep,
    submitElection,
    handleWinnersChange,
  };
};
