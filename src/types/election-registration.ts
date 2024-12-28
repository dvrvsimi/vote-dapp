// src/types/election-registration.ts
import { PublicKey } from "@solana/web3.js";

export interface ElectionData {
  name: string;
  startTime: number;
  endTime: number | null;
  allowedVoterTypes: Array<"student" | "staff">;
  status: "created" | "active" | "ended";
  totalVoters: number;
}

export interface VoterInfo {
  status: {
    pending?: {};
    active?: {};
    suspended?: {};
    revoked?: {};
    onHold?: {};
  };
  registrationTime: { toNumber: () => number };
  isEligible: boolean;
  hasVoted: boolean;
}

export type RegistrationError =
  | "WALLET_NOT_CONNECTED"
  | "VERIFICATION_REQUIRED"
  | "REGISTRATION_FAILED"
  | "FETCH_ERROR"
  | "ELIGIBILITY_ERROR";
