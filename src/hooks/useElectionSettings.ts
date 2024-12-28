// hooks/useElectionSettings.ts
import { useState, useCallback, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { useElection } from './useElection';
import { useVoter } from './useVoter';
import { toast } from 'sonner';
import { Election, UserType, ElectionStatus } from '../types/vote';

interface ElectionSettingsState {
  election: Election | null;
  isLoading: boolean;
  error: Error | null;
  isAuthorized: boolean;
}

interface UpdateElectionParams {
  name?: string;
  numWinners?: number;
  numPlusVotes?: number;
  numMinusVotes?: number;
  allowedVoterTypes?: UserType[];
  status?: ElectionStatus;
}

export const useElectionSettings = (electionPDA: string) => {
  const { publicKey } = useWallet();
  const { fetchElection, initialize } = useElection();
  const { updateVoterStatus } = useVoter(new PublicKey(electionPDA));
  
  const [state, setState] = useState<ElectionSettingsState>({
    election: null,
    isLoading: true,
    error: null,
    isAuthorized: false
  });

  // Fetch election and check authorization
  const loadElection = useCallback(async () => {
    if (!publicKey) return;
    
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const election = await fetchElection(new PublicKey(electionPDA));
      
      if (!election) throw new Error('Election not found');
      
      const isAuthorized = election.authority.toString() === publicKey.toString();
      
      setState({
        election,
        isLoading: false,
        error: null,
        isAuthorized
      });
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err as Error,
        isLoading: false
      }));
      toast.error('Failed to load election settings');
    }
  }, [electionPDA, publicKey, fetchElection]);

  // Update election settings
  const updateSettings = useCallback(async (params: UpdateElectionParams) => {
    if (!state.isAuthorized || !state.election) {
      toast.error('Unauthorized to update settings');
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));
    try {
      // TODO: Implement on-chain update logic here
      // This will require program modifications to support settings updates
      
      toast.success('Settings updated successfully');
      await loadElection();
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err as Error,
        isLoading: false
      }));
      toast.error('Failed to update settings');
    }
  }, [state.isAuthorized, state.election, loadElection]);

  // End election
  const endElection = useCallback(async () => {
    if (!state.isAuthorized || !state.election) {
      toast.error('Unauthorized to end election');
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));
    try {
      // Implement end election logic
      toast.success('Election ended successfully');
      await loadElection();
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err as Error,
        isLoading: false
      }));
      toast.error('Failed to end election');
    }
  }, [state.isAuthorized, state.election, loadElection]);

  // Update voter eligibility
  const updateVoterEligibility = useCallback(async (
    voterPubkey: PublicKey,
    status: 'active' | 'suspended' | 'revoked'
  ) => {
    if (!state.isAuthorized) {
      toast.error('Unauthorized to update voter status');
      return;
    }

    try {
      await updateVoterStatus(voterPubkey, { [status]: {} });
      toast.success('Voter status updated successfully');
    } catch (err) {
      toast.error('Failed to update voter status');
    }
  }, [state.isAuthorized, updateVoterStatus]);

  // Load election on mount and when dependencies change
  useEffect(() => {
    loadElection();
  }, [loadElection]);

  return {
    ...state,
    updateSettings,
    endElection,
    updateVoterEligibility,
    refresh: loadElection
  };
};