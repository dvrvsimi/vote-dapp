// instructions/register_voter.rs
use anchor_lang::prelude::*;

use crate::{ D21Error, Election, ElectionStatus, ElectionVoter, UserVerification, VoterStatus };

#[derive(Accounts)]
#[instruction()]
pub struct RegisterVoter<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,

    // The election account must exist and be active
    #[account(
        mut,
        constraint = election.status == ElectionStatus::Active @ crate::error::D21Error::ElectionNotActive
    )]
    pub election: Account<'info, Election>,

    // Verify that the user is verified before allowing registration
    #[account(
        seeds = [b"user_verification", voter.key().as_ref()],
        bump,
        constraint = user_verification.is_verified @ crate::error::VerificationError::VoterNotVerified,
        constraint = election.is_voter_type_allowed(&user_verification.user_type) @ D21Error::UserTypeNotAllowed
    )]
    pub user_verification: Account<'info, UserVerification>,

    // Initialize the election-specific voter account
    #[account(
        init,
        payer = voter,
        space = ElectionVoter::SPACE,
        seeds = [b"election_voter", election.key().as_ref(), voter.key().as_ref()],
        bump
    )]
    pub election_voter: Account<'info, ElectionVoter>,

    pub system_program: Program<'info, System>,
}

pub fn register_voter(ctx: Context<RegisterVoter>) -> Result<()> {
    let election_voter = &mut ctx.accounts.election_voter;

    election_voter.voter = ctx.accounts.voter.key();
    election_voter.election = ctx.accounts.election.key();
    election_voter.registration_time = Clock::get()?.unix_timestamp;
    election_voter.is_eligible = true;
    election_voter.status = VoterStatus::Active;
    election_voter.has_voted = false;
    election_voter.bump = ctx.bumps.election_voter;

    // Emit event for voter registration
    emit!(VoterRegistered {
        election: ctx.accounts.election.key(),
        voter: ctx.accounts.voter.key(),
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

#[event]
pub struct VoterRegistered {
    pub election: Pubkey,
    pub voter: Pubkey,
    pub timestamp: i64,
}
