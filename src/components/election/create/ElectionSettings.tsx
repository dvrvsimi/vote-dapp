// src/components/election/create/ElectionSettings.tsx
import React from "react";
import { ElectionFormData, ELECTION_CONSTRAINTS } from "@/types/election";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  calculateD21Votes,
  calculateMaxPlusVotes,
} from "@/utils/voteCalculations";

interface ElectionSettingsProps {
  formData: ElectionFormData;
  onSubmit: (data: ElectionFormData) => void;
  onBack: () => void;
}

const voterGroups = [
  { id: "student", label: "Students" },
  { id: "staff", label: "Staff" },
] as const;

export default function ElectionSettings({
  formData,
  onSubmit,
  onBack,
}: ElectionSettingsProps) {
  // Local form state to avoid direct modification of parent state
  const [localData, setLocalData] = React.useState<ElectionFormData>(formData);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localData.voterGroups.length === 0) {
      setError("Select at least one voter group");
      return;
    }
    if (new Date(localData.startDate) >= new Date(localData.endDate)) {
      setError("End date must be after start date");
      return;
    }
    onSubmit(localData);
  };

  const handleWinnersChange = (newValue: number) => {
    const numCandidates = localData.candidates.length;
    const validValue = Math.max(1, Math.min(newValue, numCandidates - 1));
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

  const updateField = <K extends keyof ElectionFormData>(
    field: K,
    value: ElectionFormData[K]
  ) => {
    setLocalData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleVoterGroupChange = (groupId: string, checked: boolean) => {
    const newGroups = checked
      ? [...localData.voterGroups, groupId as "student" | "staff"]
      : localData.voterGroups.filter((g) => g !== groupId);

    updateField("voterGroups", newGroups);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <div className="space-y-4">
        <div>
          <Label>Election Title</Label>
          <Input
            required
            value={localData.title}
            onChange={(e) => updateField("title", e.target.value)}
            placeholder="e.g., Student Council Election 2024"
            maxLength={ELECTION_CONSTRAINTS.title.max}
          />
          <p className="text-xs text-gray-500 mt-1">
            {localData.title.length}/{ELECTION_CONSTRAINTS.title.max} characters
          </p>
        </div>

        <div>
          <Label>Description</Label>
          <textarea
            className="min-h-[100px] w-full px-3 py-2 text-sm rounded-md border border-input bg-background ring-offset-background
                     placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2
                     focus-visible:ring-ring focus-visible:ring-offset-2"
            value={localData.description}
            onChange={(e) => updateField("description", e.target.value)}
            maxLength={ELECTION_CONSTRAINTS.description.max}
            placeholder="Provide details about the election..."
          />
          <p className="text-xs text-gray-500 mt-1">
            {localData.description.length}/
            {ELECTION_CONSTRAINTS.description.max} characters
          </p>
        </div>
      </div>

      {/* Schedule */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Start Date</Label>
          <Input
            type="datetime-local"
            required
            value={localData.startDate}
            onChange={(e) => updateField("startDate", e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
          />
        </div>
        <div>
          <Label>End Date</Label>
          <Input
            type="datetime-local"
            required
            value={localData.endDate}
            onChange={(e) => updateField("endDate", e.target.value)}
            min={localData.startDate || new Date().toISOString().slice(0, 16)}
          />
        </div>
      </div>

      {/* Voting Configuration */}
      <div>
        <Label>Number of Winners</Label>
        <Input
          type="number"
          required
          min={1}
          max={localData.candidates.length - 1}
          value={localData.numWinners}
          onChange={(e) => handleWinnersChange(Number(e.target.value))}
          className="max-w-[200px]"
        />
        <p className="text-xs text-gray-500 mt-1">
          Must be between 1 and {localData.candidates.length - 1} winner(s)
        </p>
      </div>

      {/* Voter Groups */}
      <div className="space-y-4">
        <Label>Eligible Voters</Label>
        <div className="space-y-2">
          {voterGroups.map((group) => (
            <div key={group.id} className="flex items-center space-x-2">
              <Checkbox
                id={group.id}
                checked={localData.voterGroups.includes(group.id)}
                onCheckedChange={(checked) =>
                  handleVoterGroupChange(group.id, checked as boolean)
                }
              />
              <Label htmlFor={group.id} className="font-normal">
                {group.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
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
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
          disabled={localData.voterGroups.length === 0}
        >
          Continue
        </button>
      </div>
    </form>
  );
}
