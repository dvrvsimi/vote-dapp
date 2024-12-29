import React from "react";
import { useCreateElection } from "@/hooks/useCreateElection";
import ElectionSettings from "./ElectionSettings";
import CandidateList from "./CandidateList";
import VotingConfig from "./VotingConfig";
import ReviewStep from "./ReviewStep";
import { Card } from "@/components/ui/card";

const steps = [
  { number: 1, title: "Add Candidates" },
  { number: 2, title: "Basic Settings" },
  { number: 3, title: "Voting Config" },
  { number: 4, title: "Review" },
] as const;

export default function CreateElectionForm() {
  const {
    state,
    step,
    error,
    isSubmitting,
    updateFormData,
    updateCandidates,
    nextStep,
    prevStep,
    submitElection,
  } = useCreateElection();

  // Render step progress
  const renderProgress = () => (
    <div className="mb-8">
      <div className="flex justify-between items-center">
        {steps.map((s, idx) => (
          <React.Fragment key={s.number}>
            <div className="flex items-center">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-medium
                  transition-all duration-300 border
                  ${
                    step >= s.number
                      ? "bg-gradient-to-r from-purple-600 to-purple-400 text-white border-purple-400"
                      : "bg-white/80 text-purple-400 border-purple-200"
                  }
                `}
              >
                {s.number}
              </div>
              <span
                className={`
                ml-3 text-sm font-medium hidden sm:block transition-colors duration-300
                ${step >= s.number 
                  ? "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400" 
                  : "text-purple-300"}
              `}
              >
                {s.title}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className="flex-1 h-1 mx-4 bg-purple-100/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-500"
                  style={{ width: step > s.number ? "100%" : "0%" }}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  // Render current step content
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <CandidateList
            candidates={state.candidates}
            onSubmit={(candidates) => {
              updateCandidates(candidates);
              nextStep();
            }}
            minCandidates={2} // Minimum required for a valid election
          />
        );
      case 2:
        return (
          <ElectionSettings
            formData={state}
            onSubmit={(data) => {
              updateFormData(data);
              nextStep();
            }}
            onBack={prevStep}
          />
        );
      case 3:
        return (
          <VotingConfig
            formData={state}
            onSubmit={(data) => {
              updateFormData(data);
              nextStep();
            }}
            onBack={prevStep}
          />
        );
      case 4:
        return (
          <ReviewStep
            formData={state}
            onSubmit={submitElection}
            onBack={prevStep}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto p-6 bg-white/90 border border-purple-500/20 backdrop-blur-sm">
      {renderProgress()}

      {error && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-500/50 text-red-200 rounded-lg backdrop-blur-sm">
          {error}
        </div>
      )}

      {renderStepContent()}
    </Card>
  );
}