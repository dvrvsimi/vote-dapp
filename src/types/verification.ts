// src/types/verification.ts
import { PublicKey } from "@solana/web3.js";

export type UserType = {
  student: {};
} | {
  staff: {};
};

export interface UserVerificationAccount {
  authority: PublicKey;
  idNumber: string;
  userType: UserType;
  isVerified: boolean;
  signature: string | null;
  signatureTimestamp: string | null;
}

export interface VerificationSignature {
  signature: string;
  timestamp: string;
}