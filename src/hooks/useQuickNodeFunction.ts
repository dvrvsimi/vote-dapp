// hooks/useQuickNodeFunction.ts
import { useCallback, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { Election } from '../types/vote';

export const useQuickNodeFunction = () => {
  const [isLoading, setIsLoading] = useState(false);

  const calculateResults = useCallback(async (election: Election) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/quicknode/calculate-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ election })
      });
      
      const data = await response.json();
      return data;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyVoter = useCallback(async (idNumber: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/quicknode/verify-voter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idNumber })
      });
      
      return await response.json();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const aggregateVotes = useCallback(async (electionPDA: PublicKey) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/quicknode/aggregate-votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ electionPDA: electionPDA.toBase58() })
      });
      
      return await response.json();
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    calculateResults,
    verifyVoter,
    aggregateVotes,
    isLoading
  };
};