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
      <Alert className="bg-purple-900/50 border border-purple-500/50 backdrop-blur-sm">
        <AlertDescription className="text-white">
          Please review all election details carefully before creating the
          election. These settings cannot be changed after the election is
          created.
        </AlertDescription>
      </Alert>

      {/* Basic Information */}
      <Card className="bg-white/90 border border-purple-500/20 backdrop-blur-sm">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            Election Details
          </h3>
          <div className="space-y-3">
            <div>
              <span className="text-purple-600/70">Title:</span>
              <p className="font-medium text-black">{formData.title}</p>
            </div>
            {formData.description && (
              <div>
                <span className="text-purple-600/70">Description:</span>
                <p className="whitespace-pre-wrap text-black/70">{formData.description}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card className="bg-white/90 border border-purple-500/20 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 mb-4">
            <Calendar className="h-5 w-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Schedule
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-purple-600/70">Start Date:</span>
              <p className="font-medium text-black">{formatDate(formData.startDate)}</p>
            </div>
            <div>
              <span className="text-purple-600/70">End Date:</span>
              <p className="font-medium text-black">{formatDate(formData.endDate)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Voter Groups */}
      <Card className="bg-white/90 border border-purple-500/20 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 mb-4">
            <Users className="h-5 w-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Eligible Voters
            </h3>
          </div>
          <div className="flex gap-2 flex-wrap">
            {formData.voterGroups.map((group) => (
              <span
                key={group}
                className="px-3 py-1 bg-purple-100/50 border border-purple-200 text-purple-600 rounded-full text-sm"
              >
                {group.charAt(0).toUpperCase() + group.slice(1)}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Candidates */}
      <Card className="bg-white/90 border border-purple-500/20 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Candidates ({formData.candidates.length})
            </h3>
          </div>
          <div className="space-y-3">
            {formData.candidates.map((candidate, index) => (
              <div
                key={candidate.id}
                className="p-3 bg-purple-50/50 rounded-lg flex items-start justify-between border border-purple-200"
              >
                <div>
                  <p className="font-medium text-black">
                    {index + 1}. {candidate.name}
                  </p>
                  <p className="text-sm text-purple-700">{candidate.position}</p>
                  {candidate.bio && (
                    <p className="text-sm text-black/70 mt-1">
                      {candidate.bio}
                    </p>
                  )}
                </div>
                <span className="text-xs text-purple-500 break-all max-w-[200px] font-mono">
                  {candidate.walletAddress}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Voting Configuration */}
      <Card className="bg-white/90 border border-purple-500/20 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 mb-4">
            <Vote className="h-5 w-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Voting Rules
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-purple-600/70">Number of Winners:</span>
              <p className="font-medium text-black">{formData.numWinners}</p>
            </div>
            <div>
              <span className="text-purple-600/70">Plus Votes per Voter:</span>
              <p className="font-medium text-black">{formData.numPlusVotes}</p>
            </div>
            <div>
              <span className="text-purple-600/70">Minus Votes per Voter:</span>
              <p className="font-medium text-black">{formData.numMinusVotes}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-between pt-6 border-t border-purple-500/20">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="px-4 py-2 text-purple-600 hover:text-purple-800 transition-colors disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="group flex items-center px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-400 text-white rounded-lg
                   hover:from-purple-500 hover:to-purple-300 disabled:from-gray-700 disabled:to-gray-600
                   disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300
                   transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20
                   disabled:hover:scale-100 disabled:hover:shadow-none space-x-2"
        >
          <span>
            {isSubmitting ? "Creating Election..." : "Create Election"}
          </span>
          {!isSubmitting && <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />}
        </button>
      </div>
    </div>
  );
}