// components/election/settings/votingRules.tsx
import React, { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useElectionSettings } from "@/hooks/useElectionSettings";
import { validateElectionSettings } from "@/utils/settingsValidation";
import LoadingSpinner from "@/components/ui/loadingSpinner";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";

interface VotingRulesProps {
  electionPDA: string;
}

interface FormData {
  numWinners: number;
  numPlusVotes: number;
  numMinusVotes: number;
  allowedVoterTypes: {
    student: boolean;
    staff: boolean;
  };
}

const VotingRules: React.FC<VotingRulesProps> = ({ electionPDA }) => {
  const { election, isLoading, isAuthorized, updateSettings } =
    useElectionSettings(electionPDA);

  const [formData, setFormData] = useState<FormData>({
    numWinners: election?.numWinners || 1,
    numPlusVotes: election?.numPlusVotes || 3,
    numMinusVotes: election?.numMinusVotes || 1,
    allowedVoterTypes: {
      student: election?.allowedVoterTypes.some((t) => "student" in t) || false,
      staff: election?.allowedVoterTypes.some((t) => "staff" in t) || false,
    },
  });

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: parseInt(value) || 0,
    }));
  };

  const handleVoterTypeChange = (type: "student" | "staff") => {
    setFormData((prev) => ({
      ...prev,
      allowedVoterTypes: {
        ...prev.allowedVoterTypes,
        [type]: !prev.allowedVoterTypes[type],
      },
    }));
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const validation = validateElectionSettings(formData);
      if (!validation.isValid) {
        validation.errors.forEach((error) => toast.error(error));
        return;
      }

      const allowedVoterTypes = [];
      if (formData.allowedVoterTypes.student)
        allowedVoterTypes.push({ student: {} });
      if (formData.allowedVoterTypes.staff)
        allowedVoterTypes.push({ staff: {} });

      try {
        await updateSettings({
          numWinners: formData.numWinners,
          numPlusVotes: formData.numPlusVotes,
          numMinusVotes: formData.numMinusVotes,
          allowedVoterTypes,
        });
        toast.success("Voting rules updated successfully");
      } catch (error) {
        toast.error("Failed to update voting rules");
      }
    },
    [formData, updateSettings]
  );

  if (!election || !isAuthorized) {
    return (
      <div className="text-center p-6">
        <p className="text-gray-600">
          {!election
            ? "Loading..."
            : "You are not authorized to modify these settings."}
        </p>
      </div>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Voting Rules</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="numWinners"
              className="block text-sm font-medium text-gray-700"
            >
              Number of Winners
            </label>
            <Input
              id="numWinners"
              name="numWinners"
              type="number"
              min="1"
              value={formData.numWinners}
              onChange={handleNumberChange}
              className="mt-1"
              disabled={isLoading}
            />
          </div>

          <div>
            <label
              htmlFor="numPlusVotes"
              className="block text-sm font-medium text-gray-700"
            >
              Plus Votes per Voter
            </label>
            <Input
              id="numPlusVotes"
              name="numPlusVotes"
              type="number"
              min="1"
              value={formData.numPlusVotes}
              onChange={handleNumberChange}
              className="mt-1"
              disabled={isLoading}
            />
          </div>

          <div>
            <label
              htmlFor="numMinusVotes"
              className="block text-sm font-medium text-gray-700"
            >
              Minus Votes per Voter
            </label>
            <Input
              id="numMinusVotes"
              name="numMinusVotes"
              type="number"
              min="0"
              value={formData.numMinusVotes}
              onChange={handleNumberChange}
              className="mt-1"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Allowed Voter Types
            </label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="studentVoter"
                  checked={formData.allowedVoterTypes.student}
                  onCheckedChange={() => handleVoterTypeChange("student")}
                  disabled={isLoading}
                />
                <label htmlFor="studentVoter" className="text-sm text-gray-600">
                  Students
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="staffVoter"
                  checked={formData.allowedVoterTypes.staff}
                  onCheckedChange={() => handleVoterTypeChange("staff")}
                  disabled={isLoading}
                />
                <label htmlFor="staffVoter" className="text-sm text-gray-600">
                  Staff
                </label>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <LoadingSpinner /> : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
};

export default VotingRules;
