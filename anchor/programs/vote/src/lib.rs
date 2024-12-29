// In lib.rs
use anchor_lang::prelude::*;

mod instructions;
mod state;
mod error;
mod constant;

pub use instructions::*;
pub use error::*;
pub use state::*;
pub use constant::*;

declare_id!("CbwSkuSw474aJCRBaJE3wvpwnkRRkCQbZc1NMrmrTXMS");

#[program]
pub mod vote {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        election_id: String,
        election_name: String,
        candidates: Vec<Pubkey>,
        num_winners: u8,
        num_plus_votes: u8,
        num_minus_votes: u8,
        allowed_voter_types: Vec<UserType>
    ) -> Result<()> {
        instructions::initialize_election(
            ctx,
            election_id,
            election_name,
            candidates,
            num_winners,
            num_plus_votes,
            num_minus_votes,
            allowed_voter_types
        )
    }

    pub fn vote(ctx: Context<CastVote>, plus_votes: Vec<u8>, minus_votes: Vec<u8>) -> Result<()> {
        instructions::process_vote(ctx, plus_votes, minus_votes)
    }

    pub fn end(ctx: Context<EndElection>) -> Result<()> {
        instructions::end_election(ctx)
    }

    pub fn register_voter(ctx: Context<RegisterVoter>) -> Result<()> {
        instructions::register_voter(ctx)
    }

    pub fn update_voter_status(
        ctx: Context<UpdateVoterStatus>,
        new_status: VoterStatus
    ) -> Result<()> {
        instructions::update_voter_status(ctx, new_status)
    }

    pub fn verify_user(
        ctx: Context<VerifyUser>,
        id_number: String,
        user_type: UserType
    ) -> Result<()> {
        instructions::verify_user(ctx, id_number, user_type)
    }
}
