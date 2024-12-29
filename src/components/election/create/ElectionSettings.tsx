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
  const [localData, setLocalData] = React.useState<ElectionFormData>(formData);
  const [error, setError] = React.useState<string | null>(null);
  const [touched, setTouched] = React.useState({
    title: false,
    startDate: false,
    endDate: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched on submit attempt
    setTouched({
      title: true,
      startDate: true,
      endDate: true,
    });

    // Validate required fields
    if (!localData.title.trim()) {
      setError("Election title is required");
      return;
    }

    if (!localData.startDate) {
      setError("Start date is required");
      return;
    }

    if (!localData.endDate) {
      setError("End date is required");
      return;
    }

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
    if (field === 'title' || field === 'startDate' || field === 'endDate') {
      setTouched(prev => ({ ...prev, [field]: true }));
    }
    setError(null);
  };

  const handleVoterGroupChange = (groupId: string, checked: boolean) => {
    const newGroups = checked
      ? [...localData.voterGroups, groupId as "student" | "staff"]
      : localData.voterGroups.filter((g) => g !== groupId);

    updateField("voterGroups", newGroups);
  };

  const isFieldInvalid = (field: 'title' | 'startDate' | 'endDate') => {
    if (!touched[field]) return false;
    
    switch (field) {
      case 'title':
        return !localData.title.trim();
      case 'startDate':
        return !localData.startDate;
      case 'endDate':
        return !localData.endDate || (
          localData.startDate && new Date(localData.startDate) >= new Date(localData.endDate)
        );
      default:
        return false;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-red-200 bg-red-900/50 border border-red-500/50 rounded-lg backdrop-blur-sm">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <div className="space-y-4">
        <div>
          <Label className="text-purple-900">
            Election Title
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            required
            value={localData.title}
            onChange={(e) => updateField("title", e.target.value)}
            placeholder="e.g., Student Council Election 2024"
            maxLength={ELECTION_CONSTRAINTS.title.max}
            className={`border-purple-500/20 focus:border-purple-500 bg-white text-black${
              isFieldInvalid('title') ? 'border-red-500 focus:border-red-500' : ''
            }`}
          />
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-purple-600/70">
              {localData.title.length}/{ELECTION_CONSTRAINTS.title.max} characters
            </p>
            {isFieldInvalid('title') && (
              <p className="text-xs text-red-500">Title is required</p>
            )}
          </div>
        </div>

        <div>
          <Label className="text-purple-900">Description</Label>
          <textarea
            className="min-h-[100px] w-full px-3 py-2 text-sm rounded-md border border-purple-500/20 
                     focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20
                     bg-white text-black"
            value={localData.description}
            onChange={(e) => updateField("description", e.target.value)}
            maxLength={ELECTION_CONSTRAINTS.description.max}
            placeholder="Provide details about the election..."
          />
          <p className="text-xs text-purple-600/70 mt-1">
            {localData.description.length}/
            {ELECTION_CONSTRAINTS.description.max} characters
          </p>
        </div>
      </div>

      {/* Schedule */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-purple-900">
            Start Date
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            type="datetime-local"
            required
            value={localData.startDate}
            onChange={(e) => updateField("startDate", e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            className={`border-purple-500/20 focus:border-purple-500 bg-white  [color-scheme:light] text-black ${
              isFieldInvalid('startDate') ? 'border-red-500 focus:border-red-500' : ''
            }`}
          />
          {isFieldInvalid('startDate') && (
            <p className="text-xs text-red-500 mt-1">Start date is required</p>
          )}
        </div>
        <div>
          <Label className="text-purple-900">
            End Date
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            type="datetime-local"
            required
            value={localData.endDate}
            onChange={(e) => updateField("endDate", e.target.value)}
            min={localData.startDate || new Date().toISOString().slice(0, 16)}
            className={`border-purple-500/20 focus:border-purple-500 bg-white [color-scheme:light] text-black ${
              isFieldInvalid('endDate') ? 'border-red-500 focus:border-red-500' : ''
            }`}
          />
          {isFieldInvalid('endDate') && (
            <p className="text-xs text-red-500 mt-1">
              {!localData.endDate ? 'End date is required' : 'End date must be after start date'}
            </p>
          )}
        </div>
      </div>

      {/* Voting Configuration */}
      <div>
        <Label className="text-purple-900">Number of Winners</Label>
        <Input
          type="number"
          required
          min={1}
          max={localData.candidates.length - 1}
          value={localData.numWinners}
          onChange={(e) => handleWinnersChange(Number(e.target.value))}
          className="max-w-[200px] border-purple-500/20 focus:border-purple-500 bg-white text-black"
        />
        <p className="text-xs text-purple-600/70 mt-1">
          Must be between 1 and {localData.candidates.length - 1} winner(s)
        </p>
      </div>

      {/* Voter Groups, // come back and tweak accordingly*/} 
      <div className="space-y-4">
        <Label className="text-purple-900">
          Eligible Voters
          <span className="text-red-500 ml-1">*</span>
        </Label>
        <div className="space-y-2">
          {voterGroups.map((group) => (
            <div key={group.id} className="flex items-center space-x-2">
              <Checkbox
                id={group.id}
                checked={localData.voterGroups.includes(group.id)}
                onCheckedChange={(checked) =>
                  handleVoterGroupChange(group.id, checked as boolean)
                }
                className="border-purple-500/20 data-[state=checked]:bg-purple-600 
                         data-[state=checked]:border-purple-600"
              />
              <Label htmlFor={group.id} className="font-normal text-purple-900">
                {group.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-purple-500/20">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 text-purple-600 hover:text-purple-800 transition-colors"
        >
          Back
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-400 text-white rounded-lg
                   hover:from-purple-500 hover:to-purple-300 disabled:from-gray-700 disabled:to-gray-600
                   disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300
                   transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20
                   disabled:hover:scale-100 disabled:hover:shadow-none"
          disabled={
            !localData.title.trim() ||
            !localData.startDate ||
            !localData.endDate ||
            localData.voterGroups.length === 0 ||
            (localData.startDate && localData.endDate && 
              new Date(localData.startDate) >= new Date(localData.endDate))
          }
        >
          Continue
        </button>
      </div>
    </form>
  );
}