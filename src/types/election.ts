// types/election.ts
import { PublicKey } from "@solana/web3.js";

export interface ElectionFormData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  voterGroups: ("student" | "staff")[];
  candidates: CandidateFormData[];
  numWinners: number;
  numPlusVotes: number;
  numMinusVotes: number;
}

export interface CandidateFormData {
  id: string; // Frontend ID for form management
  name: string; // Display name
  position: string; // Role or position
  bio: string; // Brief description
  walletAddress: string; // Solana address
}

// On-chain data types
export type UserType = {
  student?: {};
  staff?: {};
};

export type VoterStatus = {
  pending?: {};
  active?: {};
  suspended?: {};
  revoked?: {};
  onHold?: {};
};

export type ElectionStatus = {
  created?: {};
  active?: {};
  ended?: {};
};

export interface Candidate {
  address: PublicKey;
  plusVotes: number;
  minusVotes: number;
  rank: number;
}

export interface Election {
  authority: PublicKey;
  bump: number;
  id: string;
  name: string;
  numWinners: number;
  numPlusVotes: number;
  numMinusVotes: number;
  allowedVoterTypes: UserType[];
  status: ElectionStatus;
  startTime: number;
  endTime: number | null;
  totalVoters: number;
  candidates: Candidate[];
  winners: PublicKey[];
}

// Validation
export const ELECTION_CONSTRAINTS = {
  title: {
    min: 3,
    max: 100,
  },
  description: {
    max: 300,
  },
  candidates: {
    min: 2,
    max: 50,
  },
  plusVotes: {
    min: 1,
    max: 10,
  },
  minusVotes: {
    min: 0,
    max: 5,
  },
} as const;
