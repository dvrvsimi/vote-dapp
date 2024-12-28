// src/hooks/useRegistrationState.ts
import { useState } from "react";
import type {
  ElectionData,
  VoterInfo,
  RegistrationError,
} from "@/types/election-registration";

interface RegistrationState {
  loading: boolean;
  error: RegistrationError | null;
  election: ElectionData | null;
  alreadyRegistered: boolean;
  voterInfo: VoterInfo | null;
}

export const useRegistrationState = () => {
  const [state, setState] = useState<RegistrationState>({
    loading: true,
    error: null,
    election: null,
    alreadyRegistered: false,
    voterInfo: null,
  });

  const setLoading = (loading: boolean) =>
    setState((prev) => ({ ...prev, loading }));

  const setError = (error: RegistrationError | null) =>
    setState((prev) => ({ ...prev, error }));

  const setElection = (election: ElectionData | null) =>
    setState((prev) => ({ ...prev, election }));

  const setVoterInfo = (voterInfo: VoterInfo | null) =>
    setState((prev) => ({ ...prev, voterInfo }));

  const setAlreadyRegistered = (alreadyRegistered: boolean) =>
    setState((prev) => ({ ...prev, alreadyRegistered }));

  return {
    state,
    actions: {
      setLoading,
      setError,
      setElection,
      setVoterInfo,
      setAlreadyRegistered,
    },
  };
};
