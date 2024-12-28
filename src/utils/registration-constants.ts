// src/utils/registration-constants.ts
export const REGISTRATION_STEPS = {
  SELECT_ELECTION: 0,
  ELIGIBILITY_CHECK: 1,
  COMPLETE_REGISTRATION: 2,
  CONFIRMATION: 3,
} as const;

export const REGISTRATION_STATUS = {
  IDLE: "idle",
  CHECKING: "checking",
  IN_PROGRESS: "inProgress",
  COMPLETED: "completed",
  ERROR: "error",
} as const;

export const VOTER_AGREEMENTS = [
  {
    id: "election_rules",
    title: "Election Rules",
    content:
      "I agree to follow all election rules and guidelines, including voting limitations and ethical conduct requirements.",
  },
  {
    id: "voter_responsibility",
    title: "Voter Responsibility",
    content:
      "I understand my responsibility to cast informed votes and maintain the integrity of the election process.",
  },
  {
    id: "privacy_policy",
    title: "Privacy Policy",
    content:
      "I acknowledge that my voting records will be stored on the blockchain while maintaining my privacy in accordance with the system's design.",
  },
  {
    id: "data_consent",
    title: "Data Usage Consent",
    content:
      "I consent to the collection and processing of my registration data for election purposes.",
  },
] as const;

export const REGISTRATION_ERRORS = {
  WALLET_NOT_CONNECTED: "Please connect your wallet to continue registration.",
  ELECTION_NOT_SELECTED: "Please select an election to register for.",
  ELIGIBILITY_CHECK_FAILED: "Unable to verify eligibility. Please try again.",
  REGISTRATION_FAILED: "Registration failed. Please try again.",
  NETWORK_ERROR: "Network error occurred. Please check your connection.",
  INVALID_STATE: "Invalid registration state. Please start over.",
} as const;

export const TIMEOUTS = {
  ELIGIBILITY_CHECK: 30000, // 30 seconds
  REGISTRATION_SUBMIT: 45000, // 45 seconds
} as const;

export const EVENT_TYPES = {
  REGISTRATION_STARTED: "REGISTRATION_STARTED",
  ELIGIBILITY_CHECKED: "ELIGIBILITY_CHECKED",
  REGISTRATION_COMPLETED: "REGISTRATION_COMPLETED",
  REGISTRATION_FAILED: "REGISTRATION_FAILED",
} as const;
