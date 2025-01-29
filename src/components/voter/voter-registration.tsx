// src/components/voter/voter-registration.tsx
import { useVoter } from "@/hooks/useVoter";
import { useAppKitAccount } from "@reown/appkit/react";
import { PublicKey } from "@solana/web3.js";
import { useState } from "react";

interface VoterRegistrationProps {
  electionPDA: PublicKey;
}

export function VoterRegistration({ electionPDA }: VoterRegistrationProps) {
  const { registerVoter, isLoading } = useVoter(electionPDA);
  const { isConnected } = useAppKitAccount();
  const [error, setError] = useState<string | null>(null);
  
  const handleRegistration = async () => {
    try {
      setError(null);
      const result = await registerVoter();
      console.log('Registration successful!', {
        tx: result.transaction,
        signature: result.signature
      });
    } catch (error) {
      console.error('Registration failed:', error);
      setError(error instanceof Error ? error.message : 'Registration failed');
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center p-4">
        <p className="text-gray-600">Please connect your wallet to register as a voter</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <button 
        onClick={handleRegistration}
        disabled={isLoading}
        className="inline-flex items-center px-4 py-2 border border-transparent 
                 rounded-md shadow-sm text-sm font-medium text-white 
                 bg-indigo-600 hover:bg-indigo-700 focus:outline-none 
                 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 
                 disabled:opacity-50"
      >
        {isLoading ? 'Registering...' : 'Register to Vote'}
      </button>
      
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
}