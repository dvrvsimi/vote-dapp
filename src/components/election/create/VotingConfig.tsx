// src/components/election/create/VotingConfig.tsx
import React, { useState, useEffect } from "react";
import { ElectionFormData } from "@/types/election";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  calculateD21Votes,
  calculateMaxPlusVotes,
} from "@/utils/voteCalculations";

interface VotingConfigProps {
  formData: ElectionFormData;
  onSubmit: (data: ElectionFormData) => void;
  onBack: () => void;
}

export default function VotingConfig({
  formData,
  onSubmit,
  onBack,
}: VotingConfigProps) {
  const [localData, setLocalData] = useState(formData);
  const [error, setError] = useState<string | null>(null);

  // Set initial winner count and vote calculations
  useEffect(() => {
    if (localData.candidates.length >= 2) {
      const defaultWinners = Math.min(2, localData.candidates.length - 1);
      const { numPlusVotes, numMinusVotes } = calculateD21Votes(
        defaultWinners,
        localData.candidates.length
      );

      setLocalData((prev) => ({
        ...prev,
        numWinners: defaultWinners,
        numPlusVotes,
        numMinusVotes,
      }));
    }
  }, []);

  const handleWinnersChange = (newValue: number) => {
    const numCandidates = localData.candidates.length;

    // Ensure winner count is valid
    const validValue = Math.max(1, Math.min(newValue, numCandidates - 1));

    // Recalculate votes based on new winner count
    const { numPlusVotes, numMinusVotes } = calculateD21Votes(
      validValue,
      numCandidates
    );

    setLocalData((prev) => ({
      ...prev,
      numWinners: validValue,
      numPlusVotes,
      numMinusVotes,
    }));
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (localData.candidates.length < 2) {
      setError("At least 2 candidates are required");
      return;
    }

    if (localData.numWinners >= localData.candidates.length) {
      setError("Number of winners must be less than the number of candidates");
      return;
    }

    onSubmit(localData);
  };

  const maxWinners = Math.max(1, localData.candidates.length - 1);
  const maxPlus = calculateMaxPlusVotes(
    localData.numWinners,
    localData.candidates.length
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>
      )}

      <div className="space-y-4">
        <div>
          <Label>Number of Winners</Label>
          <Input
            type="number"
            required
            min={1}
            max={maxWinners}
            value={localData.numWinners}
            onChange={(e) => handleWinnersChange(Number(e.target.value))}
          />
          <p className="text-xs text-gray-500 mt-1">
            Must be between 1 and {maxWinners} winner
            {maxWinners !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Plus Votes per Voter (Auto-calculated)</Label>
            <Input
              type="number"
              value={localData.numPlusVotes}
              disabled
              className="bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Based on D21 formula: Maximum {maxPlus} votes
            </p>
          </div>

          <div>
            <Label>Minus Votes per Voter (Auto-calculated)</Label>
            <Input
              type="number"
              value={localData.numMinusVotes}
              disabled
              className="bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Based on D21 formula: Maximum 1/3 of plus votes (≤{" "}
              {Math.floor(localData.numPlusVotes / 3)})
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6 border-t">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Back
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          Continue
        </button>
      </div>
    </form>
  );
}