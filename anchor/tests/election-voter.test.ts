// tests/election-voter.test.ts
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Vote } from "../target/types/vote";
import { expect } from "chai";

describe("election-specific voter registration and voting", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Vote as Program<Vote>;

  // Test wallets
  let authority: Keypair;
  let voter: Keypair;
  let voter2: Keypair;
  let candidates: Keypair[];

  // PDAs
  const electionId = "election-2024-01";
  let electionPDA: PublicKey;
  let electionBump: number;
  let electionVoterPDA: PublicKey;
  let electionVoterBump: number;
  let ballotPDA: PublicKey;
  let ballotBump: number;
  let voterVerificationPDA: PublicKey;
  let voter2VerificationPDA: PublicKey;

  const confirmTx = async (signature: string) => {
    const latestBlockhash = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction({
      signature,
      ...latestBlockhash,
    });
  };

  beforeEach(async () => {
    try {
      // Generate fresh keypairs for each test
      authority = Keypair.generate();
      voter = Keypair.generate();
      voter2 = Keypair.generate();
      candidates = Array(5)
        .fill(0)
        .map(() => Keypair.generate());

      // Fund wallets
      const authorityAirdrop = await provider.connection.requestAirdrop(
        authority.publicKey,
        100 * LAMPORTS_PER_SOL
      );
      await confirmTx(authorityAirdrop);

      const voterAirdrop = await provider.connection.requestAirdrop(
        voter.publicKey,
        100 * LAMPORTS_PER_SOL
      );
      await confirmTx(voterAirdrop);

      const voter2Airdrop = await provider.connection.requestAirdrop(
        voter2.publicKey,
        100 * LAMPORTS_PER_SOL
      );
      await confirmTx(voter2Airdrop);

      // Derive PDAs
      [electionPDA, electionBump] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("election"),
          authority.publicKey.toBuffer(),
          Buffer.from(electionId),
        ],
        program.programId
      );

      [voterVerificationPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("user_verification"), voter.publicKey.toBuffer()],
        program.programId
      );

      [voter2VerificationPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("user_verification"), voter2.publicKey.toBuffer()],
        program.programId
      );

      [electionVoterPDA, electionVoterBump] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("election_voter"),
          electionPDA.toBuffer(),
          voter.publicKey.toBuffer(),
        ],
        program.programId
      );

      [ballotPDA, ballotBump] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("ballot"),
          electionPDA.toBuffer(),
          voter.publicKey.toBuffer(),
        ],
        program.programId
      );

      // Initialize election for tests that need it
      const candidateKeys = candidates.map((c) => c.publicKey);
      await program.methods
        .initialize(
          electionId,
          "Test Election",
          candidateKeys,
          2, // num_winners
          3, // num_plus_votes
          1, // num_minus_votes
          [{ student: {} }, { staff: {} }] // Allow both types for most tests
        )
        .accounts({
          authority: authority.publicKey,
          election: electionPDA,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      // Verify voter as student by default
      await program.methods
        .verifyUser("170404021", { student: {} })
        .accounts({
          user: voter.publicKey,
          userVerification: voterVerificationPDA,
          systemProgram: SystemProgram.programId,
        })
        .signers([voter])
        .rpc();
    } catch (error) {
      console.error("Setup error:", error);
      throw error;
    }
  });

  it("Successfully registers a verified voter for an election", async () => {
    try {
      const tx = await program.methods
        .registerVoter()
        .accounts({
          voter: voter.publicKey,
          election: electionPDA,
          electionVoter: electionVoterPDA,
          userVerification: voterVerificationPDA,
          systemProgram: SystemProgram.programId,
        })
        .signers([voter])
        .rpc();

      await confirmTx(tx);

      const electionVoter = await program.account.electionVoter.fetch(
        electionVoterPDA
      );

      expect(electionVoter.voter.toString()).to.equal(
        voter.publicKey.toString()
      );
      expect(electionVoter.election.toString()).to.equal(
        electionPDA.toString()
      );
      expect(electionVoter.isEligible).to.be.true;
      expect(electionVoter.status).to.deep.equal({ active: {} });
      expect(electionVoter.hasVoted).to.be.false;
      expect(electionVoter.bump).to.equal(electionVoterBump);
    } catch (error) {
      console.error("Test error:", error);
      throw error;
    }
  });

  it("Prevents registering same voter twice for same election", async () => {
    // Register voter first time
    await program.methods
      .registerVoter()
      .accounts({
        voter: voter.publicKey,
        election: electionPDA,
        electionVoter: electionVoterPDA,
        userVerification: voterVerificationPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([voter])
      .rpc();

    // Try to register again
    try {
      await program.methods
        .registerVoter()
        .accounts({
          voter: voter.publicKey,
          election: electionPDA,
          electionVoter: electionVoterPDA,
          userVerification: voterVerificationPDA,
          systemProgram: SystemProgram.programId,
        })
        .signers([voter])
        .rpc();

      expect.fail("Should have thrown account already exists error");
    } catch (err) {
      expect(err.toString()).to.include("custom program error: 0x0");
      expect(err.toString()).to.include("already in use");
    }
  });

  it("Allows same voter to register for different elections", async () => {
    // Create second election
    const election2Id = "election-2024-02";
    const [election2PDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("election"),
        authority.publicKey.toBuffer(),
        Buffer.from(election2Id),
      ],
      program.programId
    );

    const [electionVoter2PDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("election_voter"),
        election2PDA.toBuffer(),
        voter.publicKey.toBuffer(),
      ],
      program.programId
    );

    // Initialize second election
    await program.methods
      .initialize(
        election2Id,
        "Second Election",
        candidates.map((c) => c.publicKey),
        2,
        3,
        1,
        [{ student: {} }] // Only students allowed in second election
      )
      .accounts({
        authority: authority.publicKey,
        election: election2PDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    // Register for first election
    await program.methods
      .registerVoter()
      .accounts({
        voter: voter.publicKey,
        election: electionPDA,
        electionVoter: electionVoterPDA,
        userVerification: voterVerificationPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([voter])
      .rpc();

    // Register for second election
    await program.methods
      .registerVoter()
      .accounts({
        voter: voter.publicKey,
        election: election2PDA,
        electionVoter: electionVoter2PDA,
        userVerification: voterVerificationPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([voter])
      .rpc();

    // Verify registrations
    const electionVoter1 = await program.account.electionVoter.fetch(
      electionVoterPDA
    );
    const electionVoter2 = await program.account.electionVoter.fetch(
      electionVoter2PDA
    );

    expect(electionVoter1.election.toString()).to.equal(electionPDA.toString());
    expect(electionVoter2.election.toString()).to.equal(
      election2PDA.toString()
    );
  });

  it("Successfully updates voter status for an election", async () => {
    // First register the verified voter
    await program.methods
      .registerVoter()
      .accounts({
        voter: voter.publicKey,
        election: electionPDA,
        electionVoter: electionVoterPDA,
        userVerification: voterVerificationPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([voter])
      .rpc();

    // Update status to suspended
    const tx = await program.methods
      .updateVoterStatus({ suspended: {} })
      .accounts({
        authority: authority.publicKey,
        election: electionPDA,
        electionVoter: electionVoterPDA,
      })
      .signers([authority])
      .rpc();

    await confirmTx(tx);

    const electionVoter = await program.account.electionVoter.fetch(
      electionVoterPDA
    );
    expect(electionVoter.status).to.deep.equal({ suspended: {} });
  });

  it("Successfully casts vote with verified and registered voter", async () => {
    // Register voter
    await program.methods
      .registerVoter()
      .accounts({
        voter: voter.publicKey,
        election: electionPDA,
        electionVoter: electionVoterPDA,
        userVerification: voterVerificationPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([voter])
      .rpc();

    // Cast votes
    const plusVotes = Buffer.from([0, 1, 2]);
    const minusVotes = Buffer.from([4]);

    const voteTx = await program.methods
      .vote(plusVotes, minusVotes)
      .accounts({
        voter: voter.publicKey,
        election: electionPDA,
        ballot: ballotPDA,
        electionVoter: electionVoterPDA,
        userVerification: voterVerificationPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([voter])
      .rpc();

    await confirmTx(voteTx);

    const election = await program.account.election.fetch(electionPDA);
    expect(election.totalVoters).to.equal(1);

    const electionVoter = await program.account.electionVoter.fetch(
      electionVoterPDA
    );
    expect(electionVoter.hasVoted).to.be.true;
  });

  it("Prevents voting from suspended voter", async () => {
    // Register voter
    await program.methods
      .registerVoter()
      .accounts({
        voter: voter.publicKey,
        election: electionPDA,
        electionVoter: electionVoterPDA,
        userVerification: voterVerificationPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([voter])
      .rpc();

    // Suspend voter
    await program.methods
      .updateVoterStatus({ suspended: {} })
      .accounts({
        authority: authority.publicKey,
        election: electionPDA,
        electionVoter: electionVoterPDA,
      })
      .signers([authority])
      .rpc();

    // Try to vote
    try {
      const plusVotes = Buffer.from([0, 1]);
      const minusVotes = Buffer.from([4]);

      await program.methods
        .vote(plusVotes, minusVotes)
        .accounts({
          voter: voter.publicKey,
          election: electionPDA,
          ballot: ballotPDA,
          electionVoter: electionVoterPDA,
          userVerification: voterVerificationPDA,
          systemProgram: SystemProgram.programId,
        })
        .signers([voter])
        .rpc();

      expect.fail("Should have thrown VoterNotEligible error");
    } catch (err) {
      expect(err.error.errorCode.code).to.equal("VoterNotEligible");
    }
  });

  it("Multiple voters of different types can register and vote in same election", async () => {
    // Set up second voter as staff
    await program.methods
      .verifyUser("170404053", { staff: {} })
      .accounts({
        user: voter2.publicKey,
        userVerification: voter2VerificationPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([voter2])
      .rpc();

    // Derive PDAs for second voter
    const [voter2ElectionVoterPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("election_voter"),
        electionPDA.toBuffer(),
        voter2.publicKey.toBuffer(),
      ],
      program.programId
    );

    const [voter2BallotPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("ballot"),
        electionPDA.toBuffer(),
        voter2.publicKey.toBuffer(),
      ],
      program.programId
    );

    // Register first voter (student)
    await program.methods
      .registerVoter()
      .accounts({
        voter: voter.publicKey,
        election: electionPDA,
        electionVoter: electionVoterPDA,
        userVerification: voterVerificationPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([voter])
      .rpc();

    // Register second voter (staff)
    await program.methods
      .registerVoter()
      .accounts({
        voter: voter2.publicKey,
        election: electionPDA,
        electionVoter: voter2ElectionVoterPDA,
        userVerification: voter2VerificationPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([voter2])
      .rpc();

    // First voter (student) votes
    await program.methods
      .vote(Buffer.from([0, 1]), Buffer.from([4]))
      .accounts({
        voter: voter.publicKey,
        election: electionPDA,
        ballot: ballotPDA,
        electionVoter: electionVoterPDA,
        userVerification: voterVerificationPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([voter])
      .rpc();

    // Second voter (staff) votes
    await program.methods
      .vote(Buffer.from([1, 2]), Buffer.from([3]))
      .accounts({
        voter: voter2.publicKey,
        election: electionPDA,
        ballot: voter2BallotPDA,
        electionVoter: voter2ElectionVoterPDA,
        userVerification: voter2VerificationPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([voter2])
      .rpc();

    // Verify election state
    const election = await program.account.election.fetch(electionPDA);
    expect(election.totalVoters).to.equal(2);

    // Verify both voters are marked as having voted
    const voter1Account = await program.account.electionVoter.fetch(
      electionVoterPDA
    );
    const voter2Account = await program.account.electionVoter.fetch(
      voter2ElectionVoterPDA
    );
    expect(voter1Account.hasVoted).to.be.true;
    expect(voter2Account.hasVoted).to.be.true;

    // Verify vote counts
    expect(election.candidates[0].plusVotes.toString()).to.equal("1"); // Only voter1
    expect(election.candidates[1].plusVotes.toString()).to.equal("2"); // Both voters
    expect(election.candidates[2].plusVotes.toString()).to.equal("1"); // Only voter2
    expect(election.candidates[3].minusVotes.toString()).to.equal("1"); // Only voter2
    expect(election.candidates[4].minusVotes.toString()).to.equal("1"); // Only voter1
  });

  it("Prevents voting twice in same election", async () => {
    // Register voter
    await program.methods
      .registerVoter()
      .accounts({
        voter: voter.publicKey,
        election: electionPDA,
        electionVoter: electionVoterPDA,
        userVerification: voterVerificationPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([voter])
      .rpc();

    // Cast first vote
    const plusVotes = Buffer.from([0, 1]);
    const minusVotes = Buffer.from([4]);

    await program.methods
      .vote(plusVotes, minusVotes)
      .accounts({
        voter: voter.publicKey,
        election: electionPDA,
        ballot: ballotPDA,
        electionVoter: electionVoterPDA,
        userVerification: voterVerificationPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([voter])
      .rpc();

    // Try to vote again
    try {
      await program.methods
        .vote(plusVotes, minusVotes)
        .accounts({
          voter: voter.publicKey,
          election: electionPDA,
          ballot: ballotPDA,
          electionVoter: electionVoterPDA,
          userVerification: voterVerificationPDA,
          systemProgram: SystemProgram.programId,
        })
        .signers([voter])
        .rpc();

      expect.fail("Should have thrown AlreadyVoted error");
    } catch (err) {
      expect(err.toString()).to.include("custom program error: 0x0");
      expect(err.toString()).to.include("already in use");
    }
  });

  it("Prevents unauthorized status updates", async () => {
    // Register voter
    await program.methods
      .registerVoter()
      .accounts({
        voter: voter.publicKey,
        election: electionPDA,
        electionVoter: electionVoterPDA,
        userVerification: voterVerificationPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([voter])
      .rpc();

    // Try to update status with wrong authority
    try {
      await program.methods
        .updateVoterStatus({ suspended: {} })
        .accounts({
          authority: voter.publicKey, // Using voter instead of authority
          election: electionPDA,
          electionVoter: electionVoterPDA,
        })
        .signers([voter])
        .rpc();

      expect.fail("Should have thrown Unauthorized error");
    } catch (err) {
      expect(err.error.errorCode.code).to.equal("Unauthorized");
    }
  });

  it("Prevents registering for ended election", async () => {
    // End the election first
    await program.methods
      .end()
      .accounts({
        authority: authority.publicKey,
        election: electionPDA,
      })
      .signers([authority])
      .rpc();

    // Try to register after election has ended
    try {
      await program.methods
        .registerVoter()
        .accounts({
          voter: voter.publicKey,
          election: electionPDA,
          electionVoter: electionVoterPDA,
          userVerification: voterVerificationPDA,
          systemProgram: SystemProgram.programId,
        })
        .signers([voter])
        .rpc();

      expect.fail("Should have thrown ElectionNotActive error");
    } catch (err) {
      expect(err.error.errorCode.code).to.equal("ElectionNotActive");
    }
  });

  it("Prevents unverified voter from voting", async () => {
    // Try to vote with unverified voter2
    try {
      const [voter2BallotPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("ballot"),
          electionPDA.toBuffer(),
          voter2.publicKey.toBuffer(),
        ],
        program.programId
      );

      const [voter2ElectionVoterPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("election_voter"),
          electionPDA.toBuffer(),
          voter2.publicKey.toBuffer(),
        ],
        program.programId
      );

      await program.methods
        .vote(Buffer.from([0, 1]), Buffer.from([4]))
        .accounts({
          voter: voter2.publicKey,
          election: electionPDA,
          ballot: voter2BallotPDA,
          electionVoter: voter2ElectionVoterPDA,
          userVerification: voter2VerificationPDA,
          systemProgram: SystemProgram.programId,
        })
        .signers([voter2])
        .rpc();

      expect.fail("Should have thrown VoterNotVerified error");
    } catch (err) {
      expect(err.toString()).to.include("AccountNotInitialized");
    }
  });

  it("Prevents invalid voter status transitions", async () => {
    // Register voter
    await program.methods
      .registerVoter()
      .accounts({
        voter: voter.publicKey,
        election: electionPDA,
        electionVoter: electionVoterPDA,
        userVerification: voterVerificationPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([voter])
      .rpc();

    // Try invalid transition from Active to Pending
    try {
      await program.methods
        .updateVoterStatus({ pending: {} })
        .accounts({
          authority: authority.publicKey,
          election: electionPDA,
          electionVoter: electionVoterPDA,
        })
        .signers([authority])
        .rpc();

      expect.fail("Should have thrown InvalidStatusTransition error");
    } catch (err) {
      expect(err.error.errorCode.code).to.equal("InvalidStatusTransition");
    }
  });
});
