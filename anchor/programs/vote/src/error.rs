// error

use anchor_lang::error_code;

#[error_code]
pub enum D21Error {
    #[msg("Election is not active")]
    ElectionNotActive,

    #[msg("Voter has already cast their ballot")]
    AlreadyVoted,

    #[msg("Too many plus votes")]
    TooManyPlusVotes,

    #[msg("Too many minus votes")]
    TooManyMinusVotes,

    #[msg("Must cast at least 2 plus votes to use minus votes")]
    InsufficientPlusVotes,

    #[msg("Invalid candidate index")]
    InvalidCandidate,

    #[msg("Invalid number of candidates (1-50)")]
    InvalidCandidateCount,

    #[msg("Invalid number of winners")]
    InvalidWinnerCount,

    #[msg("Invalid number of plus votes")]
    InvalidPlusVoteCount,

    #[msg("Number of minus votes must be less than plus votes")]
    InvalidMinusVoteCount,

    #[msg("Election name must be between 1 and 50 characters")]
    InvalidNameLength,

    #[msg("Duplicate candidates not allowed")]
    DuplicateCandidates,

    #[msg("Duplicate votes not allowed")]
    DuplicateVotes,

    #[msg("Cannot vote for same candidate with plus and minus")]
    OverlappingVotes,

    #[msg("Election ID must be between 1 and 32 characters")]
    InvalidElectionId,

    #[msg("You are not authorized to modify this Election details")]
    Unauthorized,

    #[msg("User type not allowed for this election")]
    UserTypeNotAllowed,

    #[msg("Election must allow at least one voter type")]
    InvalidVoterTypes,
}

#[error_code]
pub enum VoterError {
    #[msg("Voter is not registered")]
    VoterNotRegistered,

    #[msg("Voter is already registered")]
    VoterAlreadyRegistered,

    #[msg("Voter is not eligible")]
    VoterNotEligible,

    #[msg("Voter is suspended")]
    VoterSuspended,

    #[msg("Invalid voter status transition")]
    InvalidStatusTransition,
}

#[error_code]
pub enum VerificationError {
    #[msg("Invalid ID number format")]
    InvalidIdNumber,
    #[msg("User already verified")]
    AlreadyVerified,
    #[msg("Voter is not verified")]
    VoterNotVerified,
}
