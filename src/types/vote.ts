// types/vote.ts
import { PublicKey } from "@solana/web3.js";

export type Vote = {
  version: "0.1.0";
  name: "vote";
  address: string;
};

// types/program-interfaces.ts
export interface UserType {
  student?: {};
  staff?: {};
}

export interface VoterStatus {
  pending?: {};
  active?: {};
  suspended?: {};
  revoked?: {};
  onHold?: {};
}

export interface ElectionStatus {
  created?: {};
  active?: {};
  ended?: {};
}

// types/user-verification.ts
export interface UserVerification {
  user: PublicKey;
  idNumber: string;
  userType: UserType;
  isVerified: boolean;
  verificationTime: number;
  bump: number;
}

export interface UserVerified {
  user: PublicKey;
  idNumber: string;
  userType: UserType;
  timestamp: number;
}

// types/election.ts
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

export interface Candidate {
  address: PublicKey;
  plusVotes: number;
  minusVotes: number;
  rank: number;
}

// types/voter.ts
export interface ElectionVoter {
  voter: PublicKey;
  election: PublicKey;
  registrationTime: number;
  isEligible: boolean;
  status: VoterStatus;
  hasVoted: boolean;
  bump: number;
}

// types/ballot.ts
export interface Ballot {
  voter: PublicKey;
  election: PublicKey;
  plusVotes: Uint8Array;
  minusVotes: Uint8Array;
  bump: number;
}

// types/events.ts
export interface ElectionVoterStatusChanged {
  election: PublicKey;
  voter: PublicKey;
  oldStatus: VoterStatus;
  newStatus: VoterStatus;
  timestamp: number;
}

export interface VoterRegistered {
  election: PublicKey;
  voter: PublicKey;
  timestamp: number;
}

// types/errors.ts
export enum VoteError {
  VoterNotRegistered = "VoterNotRegistered",
  VoterAlreadyRegistered = "VoterAlreadyRegistered",
  VoterNotEligible = "VoterNotEligible",
  VoterSuspended = "VoterSuspended",
  InvalidStatusTransition = "InvalidStatusTransition",
  UserTypeNotAllowed = "UserTypeNotAllowed",
  ElectionNotActive = "ElectionNotActive",
  InvalidCandidate = "InvalidCandidate",
  DuplicateVotes = "DuplicateVotes",
  OverlappingVotes = "OverlappingVotes",
  TooManyMinusVotes = "TooManyMinusVotes",
  InvalidIdNumber = "InvalidIdNumber",
  Unauthorized = "Unauthorized",
}
