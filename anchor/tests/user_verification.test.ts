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

describe("user verification", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Vote as Program<Vote>;

  // Test wallets
  let user: Keypair;
  let authority: Keypair;

  // PDAs
  let userVerificationPDA: PublicKey;
  let verificationBump: number;

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
      user = Keypair.generate();
      authority = Keypair.generate();

      // Fund wallets
      const userAirdrop = await provider.connection.requestAirdrop(
        user.publicKey,
        100 * LAMPORTS_PER_SOL
      );
      await confirmTx(userAirdrop);

      const authorityAirdrop = await provider.connection.requestAirdrop(
        authority.publicKey,
        100 * LAMPORTS_PER_SOL
      );
      await confirmTx(authorityAirdrop);

      // Derive PDA
      [userVerificationPDA, verificationBump] =
        PublicKey.findProgramAddressSync(
          [Buffer.from("user_verification"), user.publicKey.toBuffer()],
          program.programId
        );
    } catch (error) {
      console.error("Setup error:", error);
      throw error;
    }
  });

  it("Successfully verifies a student user with matric number", async () => {
    try {
      const idNumber = "170404021";

      const tx = await program.methods
        .verifyUser(idNumber, { student: {} })
        .accounts({
          user: user.publicKey,
          userVerification: userVerificationPDA,
          systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc();

      await confirmTx(tx);

      const verificationAccount = await program.account.userVerification.fetch(
        userVerificationPDA
      );

      expect(verificationAccount.user.toString()).to.equal(
        user.publicKey.toString()
      );
      expect(verificationAccount.idNumber).to.equal(idNumber);
      expect(verificationAccount.userType).to.deep.equal({ student: {} });
      expect(verificationAccount.isVerified).to.be.true;
      expect(verificationAccount.verificationTime.toString()).to.not.equal("0");
      expect(verificationAccount.bump).to.equal(verificationBump);
    } catch (error) {
      console.error("Test error:", error);
      throw error;
    }
  });

  it("Successfully verifies a staff user with ID", async () => {
    const idNumber = "170404150";

    const tx = await program.methods
      .verifyUser(idNumber, { staff: {} })
      .accounts({
        user: user.publicKey,
        userVerification: userVerificationPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    await confirmTx(tx);

    const verificationAccount = await program.account.userVerification.fetch(
      userVerificationPDA
    );

    expect(verificationAccount.userType).to.deep.equal({ staff: {} });
    expect(verificationAccount.idNumber).to.equal(idNumber);
    expect(verificationAccount.isVerified).to.be.true;
  });

  it("Prevents verification with too short ID number", async () => {
    try {
      const invalidId = "123456"; // 6 chars, minimum is 7

      await program.methods
        .verifyUser(invalidId, { student: {} })
        .accounts({
          user: user.publicKey,
          userVerification: userVerificationPDA,
          systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc();

      expect.fail("Should have thrown InvalidIdNumber error");
    } catch (err) {
      expect(err.error.errorCode.code).to.equal("InvalidIdNumber");
    }
  });

  it("Prevents verification with too long ID number", async () => {
    try {
      const invalidId = "1234567890123"; // 13 chars, maximum is 12

      await program.methods
        .verifyUser(invalidId, { student: {} })
        .accounts({
          user: user.publicKey,
          userVerification: userVerificationPDA,
          systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc();

      expect.fail("Should have thrown InvalidIdNumber error");
    } catch (err) {
      expect(err.error.errorCode.code).to.equal("InvalidIdNumber");
    }
  });

  it("Prevents duplicate verification", async () => {
    // First verification
    await program.methods
      .verifyUser("170404021", { student: {} })
      .accounts({
        user: user.publicKey,
        userVerification: userVerificationPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    // Try to verify again
    try {
      await program.methods
        .verifyUser("170404150", { student: {} })
        .accounts({
          user: user.publicKey,
          userVerification: userVerificationPDA,
          systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc();

      expect.fail("Should have thrown account already exists error");
    } catch (err) {
      expect(err.toString()).to.include("custom program error: 0x0");
      expect(err.toString()).to.include("already in use");
    }
  });

  it("Only allows verified users to register for elections", async () => {
    // Create an election first
    const electionId = "test-election";

    // Create 5 candidate keypairs
    const candidates = Array(5)
      .fill(0)
      .map(() => Keypair.generate());
    const candidatePublicKeys = candidates.map((c) => c.publicKey);

    const [electionPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("election"),
        authority.publicKey.toBuffer(),
        Buffer.from(electionId),
      ],
      program.programId
    );

    // Initialize election with 5 candidates
    await program.methods
      .initialize(
        electionId,
        "Test Election",
        candidatePublicKeys, // Array of 5 candidate public keys
        2, // num_winners
        3, // num_plus_votes
        1, // num_minus_votes,
        [{ student: {} }]
      )
      .accounts({
        authority: authority.publicKey,
        election: electionPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    const [electionVoterPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("election_voter"),
        electionPDA.toBuffer(),
        user.publicKey.toBuffer(),
      ],
      program.programId
    );

    // Try to register without verification first
    try {
      await program.methods
        .registerVoter()
        .accounts({
          voter: user.publicKey,
          election: electionPDA,
          electionVoter: electionVoterPDA,
          userVerification: userVerificationPDA,
          systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc();

      expect.fail("Should have thrown AccountNotInitialized error");
    } catch (err) {
      expect(err.toString()).to.include("AccountNotInitialized");
    }

    // Now verify the user
    await program.methods
      .verifyUser("170404021", { student: {} })
      .accounts({
        user: user.publicKey,
        userVerification: userVerificationPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    // Try registration again after verification
    await program.methods
      .registerVoter()
      .accounts({
        voter: user.publicKey,
        election: electionPDA,
        electionVoter: electionVoterPDA,
        userVerification: userVerificationPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    // Verify registration was successful
    const electionVoter = await program.account.electionVoter.fetch(
      electionVoterPDA
    );
    expect(electionVoter.isEligible).to.be.true;
    expect(electionVoter.voter.toString()).to.equal(user.publicKey.toString());
    expect(electionVoter.election.toString()).to.equal(electionPDA.toString());
  });

  it("Only allows verified users with correct type to register for elections", async () => {
    // Create an election first
    const electionId = "test-election";

    // Create 5 candidate keypairs
    const candidates = Array(5)
      .fill(0)
      .map(() => Keypair.generate());
    const candidatePublicKeys = candidates.map((c) => c.publicKey);

    const [electionPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("election"),
        authority.publicKey.toBuffer(),
        Buffer.from(electionId),
      ],
      program.programId
    );

    // Initialize election with 5 candidates - now including allowed voter types
    await program.methods
      .initialize(
        electionId,
        "Test Election",
        candidatePublicKeys,
        2, // num_winners
        3, // num_plus_votes
        1, // num_minus_votes
        [{ student: {} }] // Only allow students to vote
      )
      .accounts({
        authority: authority.publicKey,
        election: electionPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    const [electionVoterPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("election_voter"),
        electionPDA.toBuffer(),
        user.publicKey.toBuffer(),
      ],
      program.programId
    );

    // Try to register without verification first
    try {
      await program.methods
        .registerVoter()
        .accounts({
          voter: user.publicKey,
          election: electionPDA,
          electionVoter: electionVoterPDA,
          userVerification: userVerificationPDA,
          systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc();

      expect.fail("Should have thrown AccountNotInitialized error");
    } catch (err) {
      expect(err.toString()).to.include("AccountNotInitialized");
    }

    // Verify the user as staff (wrong type for this election)
    await program.methods
      .verifyUser("170404021", { staff: {} })
      .accounts({
        user: user.publicKey,
        userVerification: userVerificationPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    // Try registration with wrong user type
    try {
      await program.methods
        .registerVoter()
        .accounts({
          voter: user.publicKey,
          election: electionPDA,
          electionVoter: electionVoterPDA,
          userVerification: userVerificationPDA,
          systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc();

      expect.fail("Should have thrown UserTypeNotAllowed error");
    } catch (err) {
      expect(err.error.errorCode.code).to.equal("UserTypeNotAllowed");
    }

    // Create a new user and verify as student (correct type)
    const studentUser = Keypair.generate();
    const studentAirdrop = await provider.connection.requestAirdrop(
      studentUser.publicKey,
      100 * LAMPORTS_PER_SOL
    );
    await confirmTx(studentAirdrop);

    const [studentVerificationPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_verification"), studentUser.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .verifyUser("170404053", { student: {} })
      .accounts({
        user: studentUser.publicKey,
        userVerification: studentVerificationPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([studentUser])
      .rpc();

    // Try registration with correct user type
    const [studentVoterPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("election_voter"),
        electionPDA.toBuffer(),
        studentUser.publicKey.toBuffer(),
      ],
      program.programId
    );

    await program.methods
      .registerVoter()
      .accounts({
        voter: studentUser.publicKey,
        election: electionPDA,
        electionVoter: studentVoterPDA,
        userVerification: studentVerificationPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([studentUser])
      .rpc();

    // Verify registration was successful
    const electionVoter = await program.account.electionVoter.fetch(
      studentVoterPDA
    );
    expect(electionVoter.isEligible).to.be.true;
    expect(electionVoter.voter.toString()).to.equal(
      studentUser.publicKey.toString()
    );
    expect(electionVoter.election.toString()).to.equal(electionPDA.toString());
  });

  it("Allows registration for elections with multiple voter types", async () => {
    const electionId = "multi-type-election";
    const candidates = Array(5)
      .fill(0)
      .map(() => Keypair.generate());
    const candidatePublicKeys = candidates.map((c) => c.publicKey);

    const [electionPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("election"),
        authority.publicKey.toBuffer(),
        Buffer.from(electionId),
      ],
      program.programId
    );

    // Initialize election allowing both students and staff
    await program.methods
      .initialize(
        electionId,
        "Multi-Type Election",
        candidatePublicKeys,
        2,
        3, // num_plus_votes
        1, // num_minus_votes
        [{ student: {} }, { staff: {} }] // Allow both types
      )
      .accounts({
        authority: authority.publicKey,
        election: electionPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    // Verify and register a student
    const studentUser = Keypair.generate();

    // Request and CONFIRM airdrop for student
    const studentAirdrop = await provider.connection.requestAirdrop(
      studentUser.publicKey,
      100 * LAMPORTS_PER_SOL
    );
    await confirmTx(studentAirdrop); // Make sure to wait for confirmation

    const [studentVerificationPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_verification"), studentUser.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .verifyUser("170404054", { student: {} })
      .accounts({
        user: studentUser.publicKey,
        userVerification: studentVerificationPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([studentUser])
      .rpc();

    const [studentVoterPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("election_voter"),
        electionPDA.toBuffer(),
        studentUser.publicKey.toBuffer(),
      ],
      program.programId
    );

    // Student should be able to register
    await program.methods
      .registerVoter()
      .accounts({
        voter: studentUser.publicKey,
        election: electionPDA,
        electionVoter: studentVoterPDA,
        userVerification: studentVerificationPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([studentUser])
      .rpc();

    // Verify and register a staff member
    const staffUser = Keypair.generate();

    // Request and CONFIRM airdrop for staff
    const staffAirdrop = await provider.connection.requestAirdrop(
      staffUser.publicKey,
      100 * LAMPORTS_PER_SOL
    );
    await confirmTx(staffAirdrop); // Make sure to wait for confirmation

    const [staffVerificationPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_verification"), staffUser.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .verifyUser("170404055", { staff: {} })
      .accounts({
        user: staffUser.publicKey,
        userVerification: staffVerificationPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([staffUser])
      .rpc();

    const [staffVoterPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("election_voter"),
        electionPDA.toBuffer(),
        staffUser.publicKey.toBuffer(),
      ],
      program.programId
    );

    // Staff should also be able to register
    await program.methods
      .registerVoter()
      .accounts({
        voter: staffUser.publicKey,
        election: electionPDA,
        electionVoter: staffVoterPDA,
        userVerification: staffVerificationPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([staffUser])
      .rpc();

    // Verify both registrations were successful
    const studentVoter = await program.account.electionVoter.fetch(
      studentVoterPDA
    );
    const staffVoter = await program.account.electionVoter.fetch(staffVoterPDA);

    expect(studentVoter.isEligible).to.be.true;
    expect(staffVoter.isEligible).to.be.true;
  });
});
