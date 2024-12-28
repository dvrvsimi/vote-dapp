import { RegistrationError } from "@/types/election-registration";

// src/constants/errors.ts
export const ERROR_MESSAGES: Record<RegistrationError, string> = {
  WALLET_NOT_CONNECTED:
    "Please connect your wallet to register for this election.",
  VERIFICATION_REQUIRED: "You must be verified to register for this election",
  REGISTRATION_FAILED: "Failed to register for election. Please try again.",
  FETCH_ERROR: "Failed to fetch election details. Please try again.",
  ELIGIBILITY_ERROR: "Failed to verify eligibility. Please check your status.",
};
