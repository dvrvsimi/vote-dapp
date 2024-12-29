// tests/vote.test.ts
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

describe("vote", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Vote as Program<Vote>;

  // Test wallets
  let authority: Keypair;
  let voter: Keypair;
  let candidates: Keypair[];

  // PDAs
  const electionId = "election-2024-01";
  let electionPDA: PublicKey;
  let electionBump: number;
  let ballotPDA: PublicKey;
  let ballotBump: number;
  let voterVerificationPDA: PublicKey;
  let electionVoterPDA: PublicKey;
  let electionVoterBump: number;

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

      [ballotPDA, ballotBump] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("ballot"),
          electionPDA.toBuffer(),
          voter.publicKey.toBuffer(),
        ],
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
    } catch (error) {
      console.error("Setup error:", error);
      throw error;
    }
  });

  it("Initialize election", async () => {
    try {
      const electionName = "Test Election";
      const candidateKeys = candidates.map((c) => c.publicKey);

      const tx = await program.methods
        .initialize(
          electionId,
          electionName,
          candidateKeys,
          2, // two winners
          3, // 3 plus votes allowed
          1, // 1 minus vote allowed
          [{ student: {} }, { staff: {} }] // Allow both student and staff voters
        )
        .accounts({
          authority: authority.publicKey,
          election: electionPDA,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      await confirmTx(tx);

      // Fetch and verify the election account
      const election = await program.account.election.fetch(electionPDA);

      expect(election.authority.toString()).to.equal(
        authority.publicKey.toString()
      );
      expect(election.name).to.equal(electionName);
      expect(election.numWinners).to.equal(2);
      expect(election.numPlusVotes).to.equal(3);
      expect(election.numMinusVotes).to.equal(1);
      expect(election.allowedVoterTypes).to.have.lengthOf(2);
      expect(election.status).to.deep.equal({ active: {} });
      expect(election.totalVoters).to.equal(0);
      expect(election.candidates.length).to.equal(5);
      expect(election.winners.length).to.equal(0);
      expect(election.bump).to.equal(electionBump);

      // Verify initial candidate states
      election.candidates.forEach((candidate, index) => {
        expect(candidate.address.toString()).to.equal(
          candidateKeys[index].toString()
        );
        expect(candidate.plusVotes.toString()).to.equal("0");
        expect(candidate.minusVotes.toString()).to.equal("0");
        expect(candidate.rank).to.equal(0);
      });
    } catch (err) {
      console.error("Error:", err);
      throw err;
    }
  });

  it("Vote in election", async () => {
    // First initialize election
    const electionName = "Test Election";
    const candidateKeys = candidates.map((c) => c.publicKey);

    const initTx = await program.methods
      .initialize(
        electionId,
        electionName,
        candidateKeys,
        2, // two winners
        3, // 3 plus votes allowed
        1, // 1 minus vote allowed
        [{ student: {} }] // Only allow student voters for this test
      )
      .accounts({
        authority: authority.publicKey,
        election: electionPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    await confirmTx(initTx);

    // First verify the voter as a student
    const verifyTx = await program.methods
      .verifyUser("170404021", { student: {} })
      .accounts({
        user: voter.publicKey,
        userVerification: voterVerificationPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([voter])
      .rpc();

    await confirmTx(verifyTx);

    // Then register voter for the election
    await program.methods
      .registerVoter()
      .accounts({
        voter: voter.publicKey,
        election: electionPDA,
        userVerification: voterVerificationPDA,
        electionVoter: electionVoterPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([voter])
      .rpc();

    // Cast votes
    const plusVotes = Buffer.from([0, 1, 2]); // 3 plus votes
    const minusVotes = Buffer.from([4]); // 1 minus vote

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

    // Verify election state
    const election = await program.account.election.fetch(electionPDA);
    expect(election.totalVoters).to.equal(1);

    // Verify candidate vote counts
    expect(election.candidates[0].plusVotes.toString()).to.equal("1");
    expect(election.candidates[0].minusVotes.toString()).to.equal("0");

    expect(election.candidates[1].plusVotes.toString()).to.equal("1");
    expect(election.candidates[1].minusVotes.toString()).to.equal("0");

    expect(election.candidates[2].plusVotes.toString()).to.equal("1");
    expect(election.candidates[2].minusVotes.toString()).to.equal("0");

    expect(election.candidates[4].plusVotes.toString()).to.equal("0");
    expect(election.candidates[4].minusVotes.toString()).to.equal("1");

    // Verify ballot account
    const ballot = await program.account.ballot.fetch(ballotPDA);
    expect(ballot.voter.toString()).to.equal(voter.publicKey.toString());
    expect(ballot.election.toString()).to.equal(electionPDA.toString());
    expect(Buffer.from(ballot.plusVotes)).to.deep.equal(plusVotes);
    expect(Buffer.from(ballot.minusVotes)).to.deep.equal(minusVotes);
    expect(ballot.bump).to.equal(ballotBump);

    // Verify election voter account
    const electionVoter = await program.account.electionVoter.fetch(
      electionVoterPDA
    );
    expect(electionVoter.voter.toString()).to.equal(voter.publicKey.toString());
    expect(electionVoter.election.toString()).to.equal(electionPDA.toString());
    expect(electionVoter.hasVoted).to.be.true;
    expect(electionVoter.status).to.deep.equal({ active: {} });
  });

  it("Should prevent initializing with invalid vote counts", async () => {
    const electionName = "Invalid Test Election";
    const candidateKeys = candidates.map((c) => c.publicKey);

    try {
      await program.methods
        .initialize(
          electionId,
          electionName,
          candidateKeys,
          1, // one winner
          2, // 2 plus votes
          3, // 3 minus votes (invalid: more minus than plus votes)
          [{ student: {} }] // Allow student voters
        )
        .accounts({
          authority: authority.publicKey,
          election: electionPDA,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      expect.fail("Should have thrown InvalidMinusVoteCount error");
    } catch (err) {
      expect(err.error.errorCode.code).to.equal("InvalidMinusVoteCount");
    }
  });

  it("Should prevent voting without verification", async () => {
    // Initialize election first
    const electionName = "Test Election";
    const candidateKeys = candidates.map((c) => c.publicKey);

    await program.methods
      .initialize(electionId, electionName, candidateKeys, 2, 3, 1, [
        { student: {} },
      ])
      .accounts({
        authority: authority.publicKey,
        election: electionPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    // Try to register without verification
    try {
      await program.methods
        .registerVoter()
        .accounts({
          voter: voter.publicKey,
          election: electionPDA,
          userVerification: voterVerificationPDA,
          electionVoter: electionVoterPDA,
          systemProgram: SystemProgram.programId,
        })
        .signers([voter])
        .rpc();

      expect.fail("Should have thrown VoterNotVerified error");
    } catch (err) {
      expect(err.toString()).to.include("AccountNotInitialized");
    }
  });

  it("Should prevent voting with wrong voter type", async () => {
    // Initialize election for students only
    const electionName = "Students Only Election";
    const candidateKeys = candidates.map((c) => c.publicKey);

    await program.methods
      .initialize(
        electionId,
        electionName,
        candidateKeys,
        2,
        3,
        1,
        [{ student: {} }] // Only students allowed
      )
      .accounts({
        authority: authority.publicKey,
        election: electionPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    // Verify voter as staff (wrong type)
    await program.methods
      .verifyUser("170404021", { staff: {} })
      .accounts({
        user: voter.publicKey,
        userVerification: voterVerificationPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([voter])
      .rpc();

    // Try to register with wrong voter type
    try {
      await program.methods
        .registerVoter()
        .accounts({
          voter: voter.publicKey,
          election: electionPDA,
          userVerification: voterVerificationPDA,
          electionVoter: electionVoterPDA,
          systemProgram: SystemProgram.programId,
        })
        .signers([voter])
        .rpc();

      expect.fail("Should have thrown UserTypeNotAllowed error");
    } catch (err) {
      expect(err.error.errorCode.code).to.equal("UserTypeNotAllowed");
    }
  });

  it("Should prevent voting with too many minus votes", async () => {
    // Initialize election and verify voter first
    const electionName = "Test Election";
    const candidateKeys = candidates.map((c) => c.publicKey);

    await program.methods
      .initialize(electionId, electionName, candidateKeys, 2, 3, 1, [
        { student: {} },
      ])
      .accounts({
        authority: authority.publicKey,
        election: electionPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    // Verify voter as student
    await program.methods
      .verifyUser("170404021", { student: {} })
      .accounts({
        user: voter.publicKey,
        userVerification: voterVerificationPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([voter])
      .rpc();

    // Register voter
    await program.methods
      .registerVoter()
      .accounts({
        voter: voter.publicKey,
        election: electionPDA,
        userVerification: voterVerificationPDA,
        electionVoter: electionVoterPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([voter])
      .rpc();

    // Try to vote with too many minus votes
    const plusVotes = Buffer.from([0, 1]); // 2 plus votes
    const tooManyMinusVotes = Buffer.from([3, 4]); // 2 minus votes when only 1 is allowed

    try {
      await program.methods
        .vote(plusVotes, tooManyMinusVotes)
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

      expect.fail("Should have thrown TooManyMinusVotes error");
    } catch (err) {
      expect(err.error.errorCode.code).to.equal("TooManyMinusVotes");
    }
  });

  it("Should prevent voting with duplicate candidates", async () => {
    // Initialize election
    const electionName = "Test Election";
    const candidateKeys = candidates.map((c) => c.publicKey);

    await program.methods
      .initialize(electionId, electionName, candidateKeys, 2, 3, 1, [
        { student: {} },
      ])
      .accounts({
        authority: authority.publicKey,
        election: electionPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    // Verify voter as student
    await program.methods
      .verifyUser("170404021", { student: {} })
      .accounts({
        user: voter.publicKey,
        userVerification: voterVerificationPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([voter])
      .rpc();

    // Register voter
    await program.methods
      .registerVoter()
      .accounts({
        voter: voter.publicKey,
        election: electionPDA,
        userVerification: voterVerificationPDA,
        electionVoter: electionVoterPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([voter])
      .rpc();

    // Try to vote with duplicate plus votes
    const duplicatePlusVotes = Buffer.from([0, 0, 1]); // Duplicate 0
    const minusVotes = Buffer.from([4]);

    try {
      await program.methods
        .vote(duplicatePlusVotes, minusVotes)
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

      expect.fail("Should have thrown DuplicateVotes error");
    } catch (err) {
      expect(err.error.errorCode.code).to.equal("DuplicateVotes");
    }
  });

  it("Should prevent voting with overlapping plus and minus votes", async () => {
    // Initialize election
    const electionName = "Test Election";
    const candidateKeys = candidates.map((c) => c.publicKey);

    await program.methods
      .initialize(electionId, electionName, candidateKeys, 2, 3, 1, [
        { student: {} },
      ])
      .accounts({
        authority: authority.publicKey,
        election: electionPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    // Verify voter as student
    await program.methods
      .verifyUser("170404021", { student: {} })
      .accounts({
        user: voter.publicKey,
        userVerification: voterVerificationPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([voter])
      .rpc();

    // Register voter
    await program.methods
      .registerVoter()
      .accounts({
        voter: voter.publicKey,
        election: electionPDA,
        userVerification: voterVerificationPDA,
        electionVoter: electionVoterPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([voter])
      .rpc();

    // Try to vote with overlapping votes
    const plusVotes = Buffer.from([0, 1, 2]);
    const minusVotes = Buffer.from([1]); // 1 appears in both plus and minus

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

      expect.fail("Should have thrown OverlappingVotes error");
    } catch (err) {
      expect(err.error.errorCode.code).to.equal("OverlappingVotes");
    }
  });

  it("Should prevent voting with invalid candidate index", async () => {
    // Initialize election
    const electionName = "Test Election";
    const candidateKeys = candidates.map((c) => c.publicKey);

    await program.methods
      .initialize(electionId, electionName, candidateKeys, 2, 3, 1, [
        { student: {} },
      ])
      .accounts({
        authority: authority.publicKey,
        election: electionPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    // Verify voter as student
    await program.methods
      .verifyUser("170404021", { student: {} })
      .accounts({
        user: voter.publicKey,
        userVerification: voterVerificationPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([voter])
      .rpc();

    // Register voter
    await program.methods
      .registerVoter()
      .accounts({
        voter: voter.publicKey,
        election: electionPDA,
        userVerification: voterVerificationPDA,
        electionVoter: electionVoterPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([voter])
      .rpc();

    // Try to vote with invalid candidate index
    const plusVotes = Buffer.from([0, 1, 10]); // 10 is invalid index
    const minusVotes = Buffer.from([4]);

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

      expect.fail("Should have thrown InvalidCandidate error");
    } catch (err) {
      expect(err.error.errorCode.code).to.equal("InvalidCandidate");
    }
  });

  it("Should allow multiple elections per authority", async () => {
    const candidateKeys = candidates.map((c) => c.publicKey);

    // Derive PDAs for both elections
    const [electionPDA1] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("election"),
        authority.publicKey.toBuffer(),
        Buffer.from("election-1"),
      ],
      program.programId
    );

    const [electionPDA2] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("election"),
        authority.publicKey.toBuffer(),
        Buffer.from("election-2"),
      ],
      program.programId
    );

    // Initialize first election
    await program.methods
      .initialize(
        "election-1",
        "First Election",
        candidateKeys,
        2,
        3,
        1,
        [{ student: {} }] // Only students can vote
      )
      .accounts({
        authority: authority.publicKey,
        election: electionPDA1,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    // Initialize second election
    await program.methods
      .initialize(
        "election-2",
        "Second Election",
        candidateKeys,
        2,
        3,
        1,
        [{ staff: {} }] // Only staff can vote
      )
      .accounts({
        authority: authority.publicKey,
        election: electionPDA2,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    // Verify both elections exist and are different
    const election1 = await program.account.election.fetch(electionPDA1);
    const election2 = await program.account.election.fetch(electionPDA2);

    expect(election1.name).to.equal("First Election");
    expect(election2.name).to.equal("Second Election");
    expect(election1.allowedVoterTypes[0]).to.deep.equal({ student: {} });
    expect(election2.allowedVoterTypes[0]).to.deep.equal({ staff: {} });
  });

  it("Should successfully end election", async () => {
    // Initialize election first
    const electionName = "Test Election";
    const candidateKeys = candidates.map((c) => c.publicKey);

    await program.methods
      .initialize(electionId, electionName, candidateKeys, 2, 3, 1, [
        { student: {} },
      ])
      .accounts({
        authority: authority.publicKey,
        election: electionPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    // Verify voter as student
    await program.methods
      .verifyUser("170404021", { student: {} })
      .accounts({
        user: voter.publicKey,
        userVerification: voterVerificationPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([voter])
      .rpc();

    // Register voter
    await program.methods
      .registerVoter()
      .accounts({
        voter: voter.publicKey,
        election: electionPDA,
        userVerification: voterVerificationPDA,
        electionVoter: electionVoterPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([voter])
      .rpc();

    // Cast some votes
    const plusVotes = Buffer.from([0, 1, 2]); // Vote for first three candidates
    const minusVotes = Buffer.from([4]); // Minus vote for last candidate

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

    // End the election
    const endTx = await program.methods
      .end()
      .accounts({
        authority: authority.publicKey,
        election: electionPDA,
      })
      .signers([authority])
      .rpc();

    await confirmTx(endTx);

    // Verify election state after ending
    const election = await program.account.election.fetch(electionPDA);

    // Check status is ended
    expect(election.status).to.deep.equal({ ended: {} });

    // Verify end time is set
    expect(election.endTime).to.not.be.null;

    // Verify winners array length
    expect(election.winners.length).to.equal(2);

    // Get candidates with their scores
    const scoredCandidates = election.candidates.map((c, index) => ({
      address: c.address,
      score: Number(c.plusVotes) - Number(c.minusVotes),
      plusVotes: Number(c.plusVotes),
      rank: c.rank,
      originalIndex: index,
    }));

    // Sort candidates by score (descending) and then by plus votes if tied
    const sortedCandidates = [...scoredCandidates].sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return Number(b.plusVotes) - Number(a.plusVotes);
    });

    // Get expected winners (top 2 candidates)
    const expectedWinners = sortedCandidates.slice(0, 2).map((c) => c.address);

    // Verify winners are correct
    expect(election.winners.map((w) => w.toString())).to.deep.equal(
      expectedWinners.map((w) => w.toString())
    );

    // Verify rankings
    scoredCandidates.forEach((candidate) => {
      const expectedRank = sortedCandidates.findIndex((c) =>
        c.address.equals(candidate.address)
      );
      expect(candidate.rank).to.equal(expectedRank);
    });
  });

  it("Should prevent non-authority from ending election", async () => {
    // Initialize election
    const electionName = "Test Election";
    const candidateKeys = candidates.map((c) => c.publicKey);

    await program.methods
      .initialize(electionId, electionName, candidateKeys, 2, 3, 1, [
        { student: {} },
      ])
      .accounts({
        authority: authority.publicKey,
        election: electionPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    // Try to end election with wrong signer (voter instead of authority)
    try {
      await program.methods
        .end()
        .accounts({
          authority: voter.publicKey,
          election: electionPDA,
        })
        .signers([voter])
        .rpc();

      expect.fail("Should have thrown Unauthorized error");
    } catch (err) {
      expect(err.error.errorCode.code).to.equal("Unauthorized");
    }
  });

  it("Should prevent ending already ended election", async () => {
    // Initialize election
    const electionName = "Test Election";
    const candidateKeys = candidates.map((c) => c.publicKey);

    await program.methods
      .initialize(electionId, electionName, candidateKeys, 2, 3, 1, [
        { student: {} },
      ])
      .accounts({
        authority: authority.publicKey,
        election: electionPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    // End election first time
    await program.methods
      .end()
      .accounts({
        authority: authority.publicKey,
        election: electionPDA,
      })
      .signers([authority])
      .rpc();

    // Try to end election second time
    try {
      await program.methods
        .end()
        .accounts({
          authority: authority.publicKey,
          election: electionPDA,
        })
        .signers([authority])
        .rpc();

      expect.fail("Should have thrown ElectionNotActive error");
    } catch (err) {
      expect(err.error.errorCode.code).to.equal("ElectionNotActive");
    }
  });

  it("Should prevent voting after election is ended", async () => {
    // Initialize election
    const electionName = "Test Election";
    const candidateKeys = candidates.map((c) => c.publicKey);

    await program.methods
      .initialize(electionId, electionName, candidateKeys, 2, 3, 1, [
        { student: {} },
      ])
      .accounts({
        authority: authority.publicKey,
        election: electionPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    // Verify voter as student
    await program.methods
      .verifyUser("170404021", { student: {} })
      .accounts({
        user: voter.publicKey,
        userVerification: voterVerificationPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([voter])
      .rpc();

    // End election
    await program.methods
      .end()
      .accounts({
        authority: authority.publicKey,
        election: electionPDA,
      })
      .signers([authority])
      .rpc();

    // Try to register and vote after election is ended
    try {
      // Try to register after election ended
      await program.methods
        .registerVoter()
        .accounts({
          voter: voter.publicKey,
          election: electionPDA,
          userVerification: voterVerificationPDA,
          electionVoter: electionVoterPDA,
          systemProgram: SystemProgram.programId,
        })
        .signers([voter])
        .rpc();

      expect.fail("Should have thrown ElectionNotActive error");
    } catch (err) {
      expect(err.error.errorCode.code).to.equal("ElectionNotActive");
    }
  });

  it("Should prevent registering for election with wrong voter type", async () => {
    // Initialize election that only allows students
    const electionName = "Students Only Election";
    const candidateKeys = candidates.map((c) => c.publicKey);

    await program.methods
      .initialize(
        electionId,
        electionName,
        candidateKeys,
        2,
        3,
        1,
        [{ student: {} }] // Only students allowed
      )
      .accounts({
        authority: authority.publicKey,
        election: electionPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    // Verify voter as staff (wrong type)
    await program.methods
      .verifyUser("170404021", { staff: {} })
      .accounts({
        user: voter.publicKey,
        userVerification: voterVerificationPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([voter])
      .rpc();

    try {
      // Try to register with wrong voter type
      await program.methods
        .registerVoter()
        .accounts({
          voter: voter.publicKey,
          election: electionPDA,
          userVerification: voterVerificationPDA,
          electionVoter: electionVoterPDA,
          systemProgram: SystemProgram.programId,
        })
        .signers([voter])
        .rpc();

      expect.fail("Should have thrown UserTypeNotAllowed error");
    } catch (err) {
      expect(err.error.errorCode.code).to.equal("UserTypeNotAllowed");
    }
  });
});
