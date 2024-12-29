// instructions/end.rs

use anchor_lang::prelude::*;
use crate::{ D21Error, Election, ElectionStatus };

#[derive(Accounts)]
pub struct EndElection<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"election", election.authority.key().as_ref(), election.id.as_bytes()],
        bump = election.bump,
        constraint = authority.key() == election.authority @ D21Error::Unauthorized,
        constraint = election.status == ElectionStatus::Active @ D21Error::ElectionNotActive
    )]
    pub election: Account<'info, Election>,
}

pub fn end_election(ctx: Context<EndElection>) -> Result<()> {
    let election = &mut ctx.accounts.election;
    
    // Set end time and status
    election.status = ElectionStatus::Ended;
    election.end_time = Some(Clock::get()?.unix_timestamp);
    
    // Calculate final rankings
    let mut candidates = election.candidates.clone();
    candidates.sort_by(|a, b| {
        let a_score = a.plus_votes - a.minus_votes;
        let b_score = b.plus_votes - b.minus_votes;
        
        // Sort by score (descending) and then by plus votes if tied
        b_score.cmp(&a_score)
            .then(b.plus_votes.cmp(&a.plus_votes))
    });
    
    // Update rankings and set winners
    for (i, candidate) in candidates.iter().enumerate() {
        let idx = election.candidates
            .iter()
            .position(|c| c.address == candidate.address)
            .unwrap();
        election.candidates[idx].rank = i as u8;
        
        if i < election.num_winners as usize {
            election.winners.push(candidate.address);
        }
    }
    
    Ok(())
}