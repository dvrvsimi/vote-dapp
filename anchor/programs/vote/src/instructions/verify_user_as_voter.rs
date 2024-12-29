use anchor_lang::prelude::*;

use crate::{ UserType, UserVerification, VerificationError };

#[derive(Accounts)]
pub struct VerifyUser<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init,
        payer = user,
        space = UserVerification::SPACE,
        seeds = [b"user_verification", user.key().as_ref()],
        bump
    )]
    pub user_verification: Account<'info, UserVerification>,

    pub system_program: Program<'info, System>,
}

#[event]
pub struct UserVerified {
    pub user: Pubkey,
    pub id_number: String,
    pub user_type: UserType,
    pub timestamp: i64,
}

pub fn verify_user(ctx: Context<VerifyUser>, id_number: String, user_type: UserType) -> Result<()> {
    // Validate ID number format (adjust regex based on your ID format)
    if id_number.len() < 7 || id_number.len() > 12 {
        return err!(VerificationError::InvalidIdNumber);
    }

    let verification = &mut ctx.accounts.user_verification;
    verification.user = ctx.accounts.user.key();
    verification.id_number = id_number.clone();
    verification.user_type = user_type.clone();
    verification.is_verified = true;
    verification.verification_time = Clock::get()?.unix_timestamp;
    verification.bump = ctx.bumps.user_verification;

    // Emit verification event
    emit!(UserVerified {
        user: ctx.accounts.user.key(),
        id_number,
        user_type,
        timestamp: verification.verification_time,
    });

    Ok(())
}
