use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum UserType {
    Student,
    Staff,
}

#[account]
pub struct UserVerification {
    pub user: Pubkey, // The user's wallet address
    pub id_number: String, // Student/Staff ID
    pub user_type: UserType, // Student or Staff
    pub is_verified: bool, // Verification status
    pub verification_time: i64, // When they were verified
    pub bump: u8, // PDA bump
}

impl UserVerification {
    pub const SPACE: usize =
        8 + // discriminator
        32 + // pubkey
        4 +
        10 + // id_number (String with max 50 chars)
        1 + // user_type (enum)
        1 + // is_verified
        8 + // verification_time
        1; // bump
}
