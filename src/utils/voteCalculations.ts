// src/utils/voteCalculations.ts

/**
 * Calculates the maximum number of plus votes based on D21 formula
 * @param numWinners The number of winners to be elected
 * @param numCandidates Total number of candidates
 * @returns Maximum number of plus votes allowed
 */
export const calculateMaxPlusVotes = (
  numWinners: number,
  numCandidates: number
): number => {
  // Ensure minimum of 1 winner and valid candidate count
  const validNumWinners = Math.max(1, numWinners);
  const validNumCandidates = Math.max(validNumWinners + 1, numCandidates);

  // Calculate maximum plus votes based on winners and candidates
  // You might want to adjust this formula based on your specific requirements
  return Math.min(validNumWinners + 1, validNumCandidates - 1);
};

/**
 * Calculates the recommended vote configuration based on D21 formula
 * @param numWinners The number of winners to be elected
 * @param numCandidates Total number of candidates
 * @returns Object containing calculated plus and minus votes
 */
export const calculateD21Votes = (
  numWinners: number,
  numCandidates: number
): D21VoteConfig => {
  // Calculate maximum allowed plus votes
  const maxPlus = calculateMaxPlusVotes(numWinners, numCandidates);

  // Use maximum allowed plus votes
  const numPlusVotes = maxPlus;

  // Calculate minus votes as 1/3 of plus votes (rounded down)
  const numMinusVotes = Math.floor(numPlusVotes / 3);

  return {
    numPlusVotes,
    numMinusVotes,
  };
};

/**
 * Validates the vote configuration according to D21 rules
 * @param numWinners Number of winners
 * @param numPlusVotes Number of plus votes
 * @param numMinusVotes Number of minus votes
 * @param numCandidates Total number of candidates
 * @returns Error message if invalid, null if valid
 */
export const validateVoteConfiguration = (
  numWinners: number,
  numPlusVotes: number,
  numMinusVotes: number,
  numCandidates: number
): string | null => {
  // Validate winner count against number of candidates
  if (numWinners <= 0) {
    return "Number of winners must be greater than 0";
  }

  if (numWinners >= numCandidates) {
    return "Number of winners must be less than the total number of candidates";
  }

  // Validate plus votes
  const maxPlus = calculateMaxPlusVotes(numWinners, numCandidates);
  if (numPlusVotes <= 0 || numPlusVotes > maxPlus) {
    return `Plus votes must be between 1 and ${maxPlus}`;
  }

  // Validate minus votes
  const maxMinus = Math.floor(numPlusVotes / 3);
  if (numMinusVotes > maxMinus) {
    return `Minus votes cannot exceed ${maxMinus} (1/3 of plus votes)`;
  }

  return null;
};

/**
 * Type for D21 vote calculation result
 */
export interface D21VoteConfig {
  numPlusVotes: number;
  numMinusVotes: number;
}
