// state/voter.rs
use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct ElectionVoter {
    // The voter's public key
    pub voter: Pubkey,
    // The election this registration is for
    pub election: Pubkey,
    // Timestamp when registered for this election
    pub registration_time: i64,
    // Whether the voter is currently eligible for this election
    pub is_eligible: bool,
    // Registration status for this election
    pub status: VoterStatus,
    // Has the voter cast their ballot in this election
    pub has_voted: bool,
    // Space for future updates
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum VoterStatus {
    Pending, // Initial state when registered
    Active, // Verified and can vote
    Suspended, // Temporarily blocked
    Revoked, // Permanently disabled
    OnHold, // Under review/investigation
}

impl Default for VoterStatus {
    fn default() -> Self {
        VoterStatus::Pending
    }
}


impl ElectionVoter {
    pub const SPACE: usize =
        8 + // discriminator
        32 + // voter pubkey
        32 + // election pubkey
        8 + // registration_time
        1 + // is_eligible
        1 + // status
        1 + // has_voted
        1;

    pub fn allowed_transitions(&self) -> Vec<VoterStatus> {
        match self.status {
            VoterStatus::Pending =>
                vec![
                    VoterStatus::Active, // Verification successful
                    VoterStatus::Revoked // Failed verification
                ],
            VoterStatus::Active =>
                vec![
                    VoterStatus::Suspended, // Temporary suspension
                    VoterStatus::OnHold, // Place under review
                    VoterStatus::Revoked // Permanent removal
                ],
            VoterStatus::Suspended =>
                vec![
                    VoterStatus::Active, // Suspension lifted
                    VoterStatus::Revoked, // Convert to permanent
                    VoterStatus::OnHold // Need investigation
                ],
            VoterStatus::OnHold =>
                vec![
                    VoterStatus::Active, // Investigation cleared
                    VoterStatus::Suspended, // Need temporary suspension
                    VoterStatus::Revoked // Investigation failed
                ],
            VoterStatus::Revoked =>
                vec![
                    // No transitions allowed from Revoked
                ],
        }
    }

    pub fn can_transition_to(&self, new_status: &VoterStatus) -> bool {
        self.allowed_transitions().contains(new_status)
    }
}

// Struct to manage state transitions
pub struct StatusTransition {
    pub from: VoterStatus,
    pub to: Vec<VoterStatus>,
}

