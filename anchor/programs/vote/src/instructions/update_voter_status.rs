// instructions/update_voter_status.rs
use anchor_lang::prelude::*;
use crate::{ D21Error, Election, ElectionVoter, VoterError, VoterStatus };

#[derive(Accounts)]
pub struct UpdateVoterStatus<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    // The election this voter registration belongs to
    #[account(
        constraint = authority.key() == election.authority @ D21Error::Unauthorized
    )]
    pub election: Account<'info, Election>,

    #[account(
        mut,
        seeds = [
            b"election_voter", 
            election.key().as_ref(),
            election_voter.voter.as_ref()
        ],
        bump = election_voter.bump,
    )]
    pub election_voter: Account<'info, ElectionVoter>,
}

pub fn update_voter_status(ctx: Context<UpdateVoterStatus>, new_status: VoterStatus) -> Result<()> {
    let election_voter = &mut ctx.accounts.election_voter;

    // Check if transition is allowed
    if !election_voter.can_transition_to(&new_status) {
        return err!(VoterError::InvalidStatusTransition);
    }

    // Record the status change
    let old_status = election_voter.status.clone();
    election_voter.status = new_status.clone();

    // Emit event for status change
    emit!(ElectionVoterStatusChanged {
        election: ctx.accounts.election.key(),
        voter: election_voter.voter,
        old_status,
        new_status,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

// Event definition
#[event]
pub struct ElectionVoterStatusChanged {
    pub election: Pubkey,
    pub voter: Pubkey, 
    pub old_status: VoterStatus,
    pub new_status: VoterStatus,
    pub timestamp: i64,
}