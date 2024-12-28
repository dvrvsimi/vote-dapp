// app/components/CastVote.tsx
"use client";

import { useState, useEffect } from "react";
import { Plus, Minus } from "lucide-react";
import { PublicKey } from "@solana/web3.js";
import { useElection } from "@/hooks/useElection";
import { useBallot } from "@/hooks/useBallot";
import { Election, Candidate } from "@/types/vote";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CastVoteProps {
  electionPDA: PublicKey | null;
  onVoteSuccess?: () => void;
}

export default function CastVote({
  electionPDA,
  onVoteSuccess,
}: CastVoteProps) {
  const { fetchElection } = useElection();
  const { castVote, isLoading: isCastingVote } = useBallot(
    electionPDA || undefined
  );
  const [election, setElection] = useState<Election | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [votes, setVotes] = useState({
    plusVotes: [] as number[],
    minusVotes: [] as number[],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchElectionData() {
      if (!electionPDA) return;

      setIsLoading(true);
      setError(null);

      try {
        const electionData = await fetchElection(electionPDA);
        if (electionData) {
          setElection(electionData);
        } else {
          setError("Failed to fetch election data");
        }
      } catch (err) {
        console.error("Error fetching election:", err);
        setError("Failed to fetch election data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchElectionData();
  }, [electionPDA, fetchElection]);

  const handleVote = async () => {
    if (!electionPDA || !election) return;

    try {
      setError(null);
      setSuccessMessage(null);
      await castVote(votes.plusVotes, votes.minusVotes);
      setVotes({ plusVotes: [], minusVotes: [] });
      setSuccessMessage(
        "Vote cast successfully! Redirecting to election page..."
      );
      onVoteSuccess?.();
    } catch (err) {
      console.error("Failed to cast vote:", err);
      setError("Failed to cast vote. Please try again.");
    }
  };

  const togglePlusVote = (index: number) => {
    setVotes((prev) => {
      if (prev.plusVotes.includes(index)) {
        return {
          ...prev,
          plusVotes: prev.plusVotes.filter((i) => i !== index),
        };
      }
      if (prev.plusVotes.length >= (election?.numPlusVotes || 0)) return prev;
      return {
        ...prev,
        plusVotes: [...prev.plusVotes, index],
      };
    });
  };

  const toggleMinusVote = (index: number) => {
    setVotes((prev) => {
      if (prev.minusVotes.includes(index)) {
        return {
          ...prev,
          minusVotes: prev.minusVotes.filter((i) => i !== index),
        };
      }
      if (prev.minusVotes.length >= (election?.numMinusVotes || 0)) return prev;
      return {
        ...prev,
        minusVotes: [...prev.minusVotes, index],
      };
    });
  };

  if (!electionPDA) {
    return (
      <Alert>
        <AlertDescription>Please select an election first</AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Alert>
        <AlertDescription>Loading election details...</AlertDescription>
      </Alert>
    );
  }

  if (!election) {
    return (
      <Alert>
        <AlertDescription>{error || "Election not found"}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Cast Your Vote - {election.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert className="bg-green-50 text-green-700 border-green-200">
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {election.candidates.map((candidate: Candidate, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border rounded"
              >
                <span className="font-mono text-sm">
                  {candidate.address.toString()}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => togglePlusVote(index)}
                    disabled={isCastingVote}
                    className={`p-2 rounded transition-colors ${
                      votes.plusVotes.includes(index)
                        ? "bg-green-500 text-white hover:bg-green-600"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    onClick={() => toggleMinusVote(index)}
                    disabled={isCastingVote}
                    className={`p-2 rounded transition-colors ${
                      votes.minusVotes.includes(index)
                        ? "bg-red-500 text-white hover:bg-red-600"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    <Minus size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center p-4 bg-gray-50 rounded">
            <div className="space-y-1">
              <p className="text-sm">
                Plus votes: {votes.plusVotes.length}/{election.numPlusVotes}
              </p>
              <p className="text-sm">
                Minus votes: {votes.minusVotes.length}/{election.numMinusVotes}
              </p>
            </div>
            <button
              onClick={handleVote}
              disabled={isCastingVote}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 
                       disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isCastingVote ? "Submitting..." : "Submit Vote"}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
