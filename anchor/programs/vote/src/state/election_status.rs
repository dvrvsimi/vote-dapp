// election_status.rs
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ElectionStatus {
    Created,
    Active,
    Ended,
}

impl Default for ElectionStatus {
    fn default() -> Self {
        ElectionStatus::Created
    }
}
