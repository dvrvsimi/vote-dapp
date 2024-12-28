use anchor_lang::prelude::*;

#[account]
pub struct Candidate {
    pub address: Pubkey,
    pub plus_votes: i64,
    pub minus_votes: i64,
    pub rank: u8,
}
