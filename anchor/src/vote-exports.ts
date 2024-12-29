// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { PublicKey } from '@solana/web3.js'
import VoteIDL from '../target/idl/vote.json'
import type { Vote } from '../target/types/vote'

// Re-export the generated IDL and type
export { Vote, VoteIDL }

// The programId is imported from the program IDL.
export const BASIC_PROGRAM_ID = new PublicKey(VoteIDL.address)

// This is a helper function to get the Basic Anchor program.
export function getBasicProgram(provider: AnchorProvider) {
  return new Program(VoteIDL as Vote, provider)
}