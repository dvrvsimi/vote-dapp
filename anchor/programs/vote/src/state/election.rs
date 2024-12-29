// state/election.rs

use anchor_lang::prelude::*;

use crate::D21Error;

use super::{ Candidate, ElectionStatus, UserType };
use crate::constant::*;

#[account]
#[derive(Default)]
pub struct Election {
    // Admin data
    pub authority: Pubkey,
    pub bump: u8,

    // Configuration
    pub id: String,
    pub name: String,
    pub num_winners: u8,
    pub num_plus_votes: u8,
    pub num_minus_votes: u8,

    // Voter type restrictions
    pub allowed_voter_types: Vec<UserType>,

    // Status
    pub status: ElectionStatus,
    pub start_time: i64,
    pub end_time: Option<i64>,

    // Results
    pub total_voters: u32,
    pub candidates: Vec<Candidate>,
    pub winners: Vec<Pubkey>,
}

// Constants for space calculation
impl Election {
    pub fn validate_config(
        &self,
        name: &str,
        candidates: &[Pubkey],
        num_winners: u8,
        num_plus_votes: u8,
        num_minus_votes: u8
    ) -> Result<()> {
        // Validate name
        require!(!name.is_empty() && name.len() <= MAX_NAME_LENGTH, D21Error::InvalidNameLength);

        // Validate candidates
        require!(
            candidates.len() >= MIN_CANDIDATES && candidates.len() <= MAX_CANDIDATES,
            D21Error::InvalidCandidateCount
        );

        // Check for duplicate candidates
        let mut unique_candidates = candidates.to_vec();
        unique_candidates.sort();
        unique_candidates.dedup();
        require!(unique_candidates.len() == candidates.len(), D21Error::DuplicateCandidates);

        // Validate winner count
        require!(
            num_winners > 0 && num_winners < (candidates.len() as u8),
            D21Error::InvalidWinnerCount
        );

        // Validate vote counts using D21 formula
        let max_plus = calculate_max_plus_votes(num_winners, candidates.len() as u8);
        require!(num_plus_votes > 0 && num_plus_votes <= max_plus, D21Error::InvalidPlusVoteCount);

        require!(num_minus_votes <= num_plus_votes / 3, D21Error::InvalidMinusVoteCount);

        Ok(())
    }

    pub fn space(max_candidates: usize) -> usize {
        8 + // discriminator
            32 + // authority
            1 + // bump
            4 +
            UUID_LENGTH + // uuid string (max 32 chars)
            4 +
            MAX_NAME_LENGTH + // name string
            1 + // num_winners
            1 + // num_plus_votesc
            1 + // num_minus_votes
            4 +
            2 * 2 + // allowed_voter_types vec (max 2 types)
            1 + // status enum
            8 + // start_time
            9 + // end_time option
            4 + // total_voters
            4 +
            max_candidates * std::mem::size_of::<Candidate>() + // candidates vec
            4 +
            max_candidates * 32 // winners vec
    }
    // Add method to check if user type is allowed
    pub fn is_voter_type_allowed(&self, voter_type: &UserType) -> bool {
        self.allowed_voter_types.contains(voter_type)
    }
}

// Helper function for D21 formula
fn calculate_max_plus_votes(num_winners: u8, num_candidates: u8) -> u8 {
    const PHI: f64 = 0.618;
    let w = num_winners as f64;

    let base_votes = (2.0 * w - (w - 2.0) * PHI).round() as u8;
    std::cmp::min(base_votes, num_candidates - 1)
}
