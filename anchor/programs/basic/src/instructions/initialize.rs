// instructions/initialize.rs
use anchor_lang::prelude::*;
use crate::{ state::{ Candidate, Election, ElectionStatus, UserType }, D21Error };

#[derive(Accounts)]
#[instruction(
    election_id: String,
    name: String,
    candidates: Vec<Pubkey>,
    num_winners: u8,
    num_plus_votes: u8,
    num_minus_votes: u8,
    allowed_voter_types: Vec<UserType>
)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = Election::space(candidates.len()),
        seeds = [b"election", authority.key().as_ref(), election_id.as_bytes()],
        bump
    )]
    pub election: Account<'info, Election>,

    pub system_program: Program<'info, System>,
}

pub fn initialize_election(
    ctx: Context<Initialize>,
    election_id: String,
    name: String,
    candidates: Vec<Pubkey>,
    num_winners: u8,
    num_plus_votes: u8,
    num_minus_votes: u8,
    allowed_voter_types: Vec<UserType>
) -> Result<()> {
    require!(!election_id.is_empty() && election_id.len() <= 32, D21Error::InvalidElectionId);
    require!(!allowed_voter_types.is_empty(), D21Error::InvalidVoterTypes);

    let election = &mut ctx.accounts.election;

    // Validate configuration
    election.validate_config(&name, &candidates, num_winners, num_plus_votes, num_minus_votes)?;

    // Set admin data
    election.authority = ctx.accounts.authority.key();
    election.bump = ctx.bumps.election;

    // Set configuration
    election.id = election_id;
    election.name = name;
    election.num_winners = num_winners;
    election.num_plus_votes = num_plus_votes;
    election.num_minus_votes = num_minus_votes;
    election.allowed_voter_types = allowed_voter_types;

    // Initialize candidates
    election.candidates = candidates
        .iter()
        .map(|&address| Candidate {
            address,
            plus_votes: 0,
            minus_votes: 0,
            rank: 0,
        })
        .collect();

    // Set initial state
    election.status = ElectionStatus::Active;
    election.start_time = Clock::get()?.unix_timestamp;
    election.end_time = None;
    election.total_voters = 0;
    election.winners = vec![];

    Ok(())
}
