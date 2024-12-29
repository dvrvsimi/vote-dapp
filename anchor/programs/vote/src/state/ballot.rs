// state/ballot.rs

use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct Ballot {
    pub voter: Pubkey,
    pub election: Pubkey,
    pub plus_votes: Vec<u8>,
    pub minus_votes: Vec<u8>,
    pub bump: u8,
}

impl Ballot {
    pub const SPACE: usize =
        8 + // discriminator
        32 + // voter
        32 + // election
        4 +
        1 * 10 + // plus_votes vec (max 10)
        4 +
        1 * 5 + // minus_votes vec (max 5)
        1; // bump
}
