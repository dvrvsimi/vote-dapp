// src/components/election/create/ReviewStep.tsx
import React from "react";
import { ElectionFormData } from "@/types/election";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowRight, Calendar, Users, Vote } from "lucide-react";

interface ReviewStepProps {
  formData: ElectionFormData;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export default function ReviewStep({
  formData,
  onSubmit,
  onBack,
  isSubmitting,
}: ReviewStepProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(undefined, {
      dateStyle: "full",
      timeStyle: "short",
    });
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertDescription>
          Please review all election details carefully before creating the
          election. These settings cannot be changed after the election is
          created.
        </AlertDescription>
      </Alert>

      {/* Basic Information */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Election Details</h3>
          <div className="space-y-3">
            <div>
              <span className="text-gray-500">Title:</span>
              <p className="font-medium">{formData.title}</p>
            </div>
            {formData.description && (
              <div>
                <span className="text-gray-500">Description:</span>
                <p className="whitespace-pre-wrap">{formData.description}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 mb-4">
            <Calendar className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Schedule</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-gray-500">Start Date:</span>
              <p className="font-medium">{formatDate(formData.startDate)}</p>
            </div>
            <div>
              <span className="text-gray-500">End Date:</span>
              <p className="font-medium">{formatDate(formData.endDate)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Voter Groups */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 mb-4">
            <Users className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Eligible Voters</h3>
          </div>
          <div className="flex gap-2 flex-wrap">
            {formData.voterGroups.map((group) => (
              <span
                key={group}
                className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
              >
                {group.charAt(0).toUpperCase() + group.slice(1)}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Candidates */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              Candidates ({formData.candidates.length})
            </h3>
          </div>
          <div className="space-y-3">
            {formData.candidates.map((candidate, index) => (
              <div
                key={candidate.id}
                className="p-3 bg-gray-50 rounded-lg flex items-start justify-between"
              >
                <div>
                  <p className="font-medium">
                    {index + 1}. {candidate.name}
                  </p>
                  <p className="text-sm text-gray-600">{candidate.position}</p>
                  {candidate.bio && (
                    <p className="text-sm text-gray-500 mt-1">
                      {candidate.bio}
                    </p>
                  )}
                </div>
                <span className="text-xs text-gray-400 break-all max-w-[200px]">
                  {candidate.walletAddress}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Voting Configuration */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 mb-4">
            <Vote className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Voting Rules</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-gray-500">Number of Winners:</span>
              <p className="font-medium">{formData.numWinners}</p>
            </div>
            <div>
              <span className="text-gray-500">Plus Votes per Voter:</span>
              <p className="font-medium">{formData.numPlusVotes}</p>
            </div>
            <div>
              <span className="text-gray-500">Minus Votes per Voter:</span>
              <p className="font-medium">{formData.numMinusVotes}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-between pt-6 border-t">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex items-center px-6 py-2 bg-primary text-white rounded-lg
                   hover:bg-primary/90 disabled:opacity-50 space-x-2"
        >
          <span>
            {isSubmitting ? "Creating Election..." : "Create Election"}
          </span>
          {!isSubmitting && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
