// utils/settingsValidation.ts
import { PublicKey } from "@solana/web3.js";
import { ELECTION_CONSTRAINTS } from "../types/election";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateVoterAddress = (address: string): ValidationResult => {
  const errors: string[] = [];
  try {
    new PublicKey(address);
  } catch {
    errors.push("Invalid voter address");
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateElectionSettings = (settings: {
  title?: string;
  description?: string;
  numPlusVotes?: number;
  numMinusVotes?: number;
  numWinners?: number;
}): ValidationResult => {
  const errors: string[] = [];

  if (settings.title) {
    if (settings.title.length < ELECTION_CONSTRAINTS.title.min) {
      errors.push(
        `Title must be at least ${ELECTION_CONSTRAINTS.title.min} characters`
      );
    }
    if (settings.title.length > ELECTION_CONSTRAINTS.title.max) {
      errors.push(
        `Title cannot exceed ${ELECTION_CONSTRAINTS.title.max} characters`
      );
    }
  }

  if (
    settings.description &&
    settings.description.length > ELECTION_CONSTRAINTS.description.max
  ) {
    errors.push(
      `Description cannot exceed ${ELECTION_CONSTRAINTS.description.max} characters`
    );
  }

  if (settings.numPlusVotes !== undefined) {
    if (settings.numPlusVotes < ELECTION_CONSTRAINTS.plusVotes.min) {
      errors.push(
        `Number of plus votes must be at least ${ELECTION_CONSTRAINTS.plusVotes.min}`
      );
    }
    if (settings.numPlusVotes > ELECTION_CONSTRAINTS.plusVotes.max) {
      errors.push(
        `Number of plus votes cannot exceed ${ELECTION_CONSTRAINTS.plusVotes.max}`
      );
    }
  }

  if (settings.numMinusVotes !== undefined) {
    if (settings.numMinusVotes < ELECTION_CONSTRAINTS.minusVotes.min) {
      errors.push(
        `Number of minus votes must be at least ${ELECTION_CONSTRAINTS.minusVotes.min}`
      );
    }
    if (settings.numMinusVotes > ELECTION_CONSTRAINTS.minusVotes.max) {
      errors.push(
        `Number of minus votes cannot exceed ${ELECTION_CONSTRAINTS.minusVotes.max}`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
