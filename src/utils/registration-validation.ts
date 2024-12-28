// src/utils/registration-validaition.ts
import { PublicKey } from "@solana/web3.js";

export interface ValidationResponse {
  isValid: boolean;
  error?: string;
}

export class RegistrationValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RegistrationValidationError";
  }
}

export const validateElectionSelection = (
  electionPDA: PublicKey | null
): ValidationResponse => {
  if (!electionPDA) {
    return {
      isValid: false,
      error: "Please select an election to register for",
    };
  }
  return { isValid: true };
};

export const validateEligibilityStatus = (
  isEligible: boolean
): ValidationResponse => {
  if (!isEligible) {
    return {
      isValid: false,
      error: "You are not eligible to register for this election",
    };
  }
  return { isValid: true };
};

export const validateAgreements = (
  agreements: Record<string, boolean>
): ValidationResponse => {
  const allAgreed = Object.values(agreements).every((value) => value === true);
  if (!allAgreed) {
    return {
      isValid: false,
      error: "You must accept all agreements to proceed",
    };
  }
  return { isValid: true };
};

export const validateRegistrationSubmission = (
  electionPDA: PublicKey | null,
  isEligible: boolean,
  agreements: Record<string, boolean>
): ValidationResponse => {
  // Check election selection
  const electionValidation = validateElectionSelection(electionPDA);
  if (!electionValidation.isValid) {
    return electionValidation;
  }

  // Check eligibility
  const eligibilityValidation = validateEligibilityStatus(isEligible);
  if (!eligibilityValidation.isValid) {
    return eligibilityValidation;
  }

  // Check agreements
  const agreementsValidation = validateAgreements(agreements);
  if (!agreementsValidation.isValid) {
    return agreementsValidation;
  }

  return { isValid: true };
};

export const formatRegistrationError = (error: unknown): string => {
  if (error instanceof RegistrationValidationError) {
    return error.message;
  }

  if (error instanceof Error) {
    // Handle specific error types from Solana or other sources
    if (error.message.includes("wallet")) {
      return "Wallet connection error. Please reconnect your wallet and try again.";
    }
    if (error.message.includes("network")) {
      return "Network error. Please check your connection and try again.";
    }
    if (error.message.includes("timeout")) {
      return "Request timed out. Please try again.";
    }
    return error.message;
  }

  return "An unexpected error occurred during registration.";
};
