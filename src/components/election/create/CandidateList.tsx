import React, { useState, useEffect } from "react";
import { CandidateFormData, ELECTION_CONSTRAINTS } from "@/types/election";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, ChevronUp, ChevronDown } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CandidateListProps {
  candidates: CandidateFormData[];
  onSubmit: (candidates: CandidateFormData[]) => void;
  minCandidates: number;
}

export default function CandidateList({
  candidates: initialCandidates,
  onSubmit,
  minCandidates,
}: CandidateListProps) {
  const [candidates, setCandidates] = useState<CandidateFormData[]>(initialCandidates);
  const [editingCandidate, setEditingCandidate] = useState<Partial<CandidateFormData>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateCandidate = (candidate: Partial<CandidateFormData>): string | null => {
    if (!candidate.name?.trim()) return "Name is required";
    if (!candidate.position?.trim()) return "Position is required";
    if (!candidate.walletAddress?.trim()) return "Wallet address is required";
    if (candidates.length >= ELECTION_CONSTRAINTS.candidates.max) {
      return `Maximum ${ELECTION_CONSTRAINTS.candidates.max} candidates allowed`;
    }
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(candidate.walletAddress)) {
      return "Invalid Solana wallet address";
    }
    // Check for duplicate wallet addresses
    if (candidates.some((c) => c.walletAddress === candidate.walletAddress)) {
      return "A candidate with this wallet address already exists";
    }
    return null;
  };

  const handleAdd = () => {
    const validationError = validateCandidate(editingCandidate);
    if (validationError) {
      setError(validationError);
      return;
    }

    const newCandidate = {
      id: Date.now().toString(),
      name: editingCandidate.name!,
      position: editingCandidate.position!,
      bio: editingCandidate.bio || "",
      walletAddress: editingCandidate.walletAddress!,
    };

    setCandidates((prev) => [...prev, newCandidate]);
    setEditingCandidate({});
    setIsAdding(false);
    setError(null);
  };

  const handleRemove = (id: string) => {
    // Check if removing would violate minimum candidates requirement
    if (candidates.length <= minCandidates) {
      setError(`Minimum ${minCandidates} candidates required`);
      return;
    }

    setCandidates((prev) => prev.filter((c) => c.id !== id));
    setError(null);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setCandidates((prev) => {
      const newCandidates = [...prev];
      [newCandidates[index], newCandidates[index - 1]] = [
        newCandidates[index - 1],
        newCandidates[index],
      ];
      return newCandidates;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === candidates.length - 1) return;
    setCandidates((prev) => {
      const newCandidates = [...prev];
      [newCandidates[index], newCandidates[index + 1]] = [
        newCandidates[index + 1],
        newCandidates[index],
      ];
      return newCandidates;
    });
  };

  const handleSubmit = () => {
    if (candidates.length < minCandidates) {
      setError(`Minimum ${minCandidates} candidates required`);
      return;
    }
    onSubmit(candidates);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            Candidates
          </h2>
          <p className="text-sm text-black/60">
            Add at least {minCandidates} candidates to continue
          </p>
        </div>
        <button
          onClick={() => {
            setIsAdding(true);
            setError(null);
          }}
          disabled={candidates.length >= ELECTION_CONSTRAINTS.candidates.max}
          className="flex items-center px-4 py-2 text-sm bg-purple-600 text-white rounded-lg
                   hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all duration-200 transform hover:scale-105"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Candidate
        </button>
      </div>

      {/* Minimum Candidates Alert */}
      {candidates.length < minCandidates && (
        <Alert className="bg-purple-900/50 border border-purple-500/50 backdrop-blur-sm">
          <AlertDescription className="text-white">
            Add {minCandidates - candidates.length} more candidate
            {candidates.length === 1 ? "" : "s"} to continue
          </AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 text-sm text-red-200 bg-red-900/50 border border-red-500/50 rounded-lg backdrop-blur-sm">
          {error}
        </div>
      )}

      {/* Candidate List */}
      <div className="space-y-4">
        {candidates.map((candidate, index) => (
          <div key={candidate.id} className="bg-white/90 backdrop-blur-sm border border-purple-500/20 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-purple-900">{candidate.name}</h3>
                <p className="text-sm text-purple-700">{candidate.position}</p>
                {candidate.bio && (
                  <p className="text-sm mt-2 text-black/70">{candidate.bio}</p>
                )}
                <p className="text-xs text-purple-600/70 mt-1 break-all font-mono">
                  {candidate.walletAddress}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="p-1 hover:bg-purple-100 rounded disabled:opacity-50 transition-colors"
                  title="Move Up"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleMoveDown(index)}
                  disabled={index === candidates.length - 1}
                  className="p-1 hover:bg-purple-100 rounded disabled:opacity-50 transition-colors"
                  title="Move Down"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleRemove(candidate.id)}
                  className="p-1 hover:bg-red-100 rounded text-red-500 transition-colors"
                  title="Remove"
                  disabled={candidates.length <= minCandidates}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Candidate Form */}
      {isAdding && (
        <div className="border border-purple-500/20 bg-white/90 backdrop-blur-sm rounded-lg p-4 space-y-4">
          <div>
            <Label className="text-purple-900">Name</Label>
            <Input
              type="text"
              value={editingCandidate.name || ""}
              onChange={(e) =>
                setEditingCandidate((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              placeholder="Candidate's full name"
              maxLength={50}
              className="border-purple-500/20 focus:border-purple-500 bg-white text-black"
            />
          </div>
          <div>
            <Label className="text-purple-900">Position</Label>
            <Input
              type="text"
              value={editingCandidate.position || ""}
              onChange={(e) =>
                setEditingCandidate((prev) => ({
                  ...prev,
                  position: e.target.value,
                }))
              }
              placeholder="e.g., President, Secretary"
              maxLength={30}
              className="border-purple-500/20 focus:border-purple-500 bg-white text-black"
            />
          </div>
          <div>
            <Label className="text-purple-900">Bio (Optional)</Label>
            <textarea
              value={editingCandidate.bio || ""}
              onChange={(e) =>
                setEditingCandidate((prev) => ({
                  ...prev,
                  bio: e.target.value,
                }))
              }
              className="w-full px-3 py-2 text-sm rounded-md border border-purple-500/20 
                       focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 bg-white text-black"
              rows={3}
              maxLength={200}
              placeholder="Brief description of the candidate"
            />
          </div>
          <div>
            <Label className="text-purple-900">Wallet Address</Label>
            <Input
              type="text"
              value={editingCandidate.walletAddress || ""}
              onChange={(e) =>
                setEditingCandidate((prev) => ({
                  ...prev,
                  walletAddress: e.target.value,
                }))
              }
              placeholder="Solana wallet address"
              className="font-mono border-purple-500/20 focus:border-purple-500 bg-white text-black"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setEditingCandidate({});
                setError(null);
              }}
              className="px-4 py-2 text-purple-600 hover:text-purple-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 
                       transition-all duration-200 transform hover:scale-105"
            >
              Add Candidate
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-end pt-6 border-t border-purple-500/20">
        <button
          onClick={handleSubmit}
          disabled={candidates.length < minCandidates}
          className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-400 text-white rounded-lg
                   hover:from-purple-500 hover:to-purple-300 disabled:from-gray-700 disabled:to-gray-600
                   disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300
                   transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20
                   disabled:hover:scale-100 disabled:hover:shadow-none"
        >
          Continue
        </button>
      </div>
    </div>
  );
}