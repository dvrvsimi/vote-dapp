//  instructions/vote.rs

use anchor_lang::prelude::*;
use crate::{
    Ballot,
    D21Error,
    Election,
    ElectionStatus,
    ElectionVoter,
    UserVerification,
    VerificationError,
    VoterError,
    VoterStatus,
};

#[derive(Accounts)]
pub struct CastVote<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,

    #[account(
        mut,
        seeds = [b"election", election.authority.key().as_ref(), election.id.as_bytes()],
        bump = election.bump,
        constraint = election.status == ElectionStatus::Active @ D21Error::ElectionNotActive
    )]
    pub election: Account<'info, Election>,

    // Add verification check
    #[account(
        seeds = [b"user_verification", voter.key().as_ref()],
        bump,
        constraint = user_verification.is_verified @ VerificationError::VoterNotVerified,
    )]
    pub user_verification: Account<'info, UserVerification>,

    #[account(
        mut,
        seeds = [b"election_voter", election.key().as_ref(), voter.key().as_ref()],
        bump = election_voter.bump,
        constraint = election_voter.voter == voter.key(),
        constraint = election_voter.election == election.key(),
        constraint = election_voter.status == VoterStatus::Active @ VoterError::VoterNotEligible,
        constraint = election_voter.is_eligible @VoterError::VoterNotEligible,
        constraint = !election_voter.has_voted @ D21Error::AlreadyVoted,
    )]
    pub election_voter: Account<'info, ElectionVoter>,

    #[account(
        init,
        payer = voter,
        space = Ballot::SPACE,
        seeds = [b"ballot", election.key().as_ref(), voter.key().as_ref()],
        bump
    )]
    pub ballot: Account<'info, Ballot>,

    pub system_program: Program<'info, System>,
}

pub fn process_vote(
    ctx: Context<CastVote>,
    plus_votes: Vec<u8>,
    minus_votes: Vec<u8>
) -> Result<()> {
    let election = &mut ctx.accounts.election;
    let ballot = &mut ctx.accounts.ballot;
    let election_voter = &mut ctx.accounts.election_voter;

    // Validate vote counts
    require!(plus_votes.len() <= (election.num_plus_votes as usize), D21Error::TooManyPlusVotes);
    require!(minus_votes.len() <= (election.num_minus_votes as usize), D21Error::TooManyMinusVotes);
    require!(plus_votes.len() >= 2 || minus_votes.is_empty(), D21Error::InsufficientPlusVotes);

    // Validate candidate indices
    let candidate_count = election.candidates.len();
    for &idx in plus_votes.iter().chain(minus_votes.iter()) {
        require!((idx as usize) < candidate_count, D21Error::InvalidCandidate);
    }

    // Check for overlapping votes
    for &plus_idx in plus_votes.iter() {
        require!(!minus_votes.contains(&plus_idx), D21Error::OverlappingVotes);
    }

    // Check for duplicate votes
    let mut all_votes = plus_votes.clone();
    all_votes.extend(minus_votes.iter());
    let mut vote_set = all_votes.clone();
    vote_set.sort();
    vote_set.dedup();
    require!(vote_set.len() == all_votes.len(), D21Error::DuplicateVotes);

    // Store ballot
    ballot.voter = ctx.accounts.voter.key();
    ballot.election = election.key();
    ballot.plus_votes = plus_votes.clone();
    ballot.minus_votes = minus_votes.clone();
    ballot.bump = ctx.bumps.ballot;

    // Update vote counts
    for idx in plus_votes {
        election.candidates[idx as usize].plus_votes += 1;
    }
    for idx in minus_votes {
        election.candidates[idx as usize].minus_votes += 1;
    }

    // Mark voter as having voted
    election_voter.has_voted = true;

    // Increment total voters
    election.total_voters += 1;

    Ok(())
}
