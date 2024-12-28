// src/components/election/registration/Stepper.tsx

import React from "react";
import { Check, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Step {
  id: number;
  title: string;
  description: string;
  status: "upcoming" | "current" | "completed" | "error";
}

interface RegistrationStepperProps {
  currentStep: number;
  steps: Step[];
  onStepClick?: (stepId: number) => void;
}

const RegistrationStepper = ({
  currentStep,
  steps,
  onStepClick,
}: RegistrationStepperProps) => {
  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Progress bar */}
      <div className="relative">
        <div className="absolute left-0 top-1/2 w-full h-0.5 bg-gray-200 -translate-y-1/2" />
        <div
          className="absolute left-0 top-1/2 h-0.5 bg-blue-500 -translate-y-1/2 transition-all"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        />

        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step) => (
            <div
              key={step.id}
              className="flex flex-col items-center"
              onClick={() => onStepClick?.(step.id)}
            >
              {/* Step circle */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center relative z-10 
                  ${
                    step.status === "completed"
                      ? "bg-green-500 text-white"
                      : step.status === "current"
                      ? "bg-blue-500 text-white"
                      : step.status === "error"
                      ? "bg-red-500 text-white"
                      : "bg-gray-200 text-gray-500"
                  }
                  ${onStepClick ? "cursor-pointer" : ""}
                `}
              >
                {step.status === "completed" ? (
                  <Check className="w-4 h-4" />
                ) : step.status === "error" ? (
                  <AlertCircle className="w-4 h-4" />
                ) : (
                  step.id
                )}
              </div>

              {/* Step title and description */}
              <div className="mt-2 text-center">
                <div
                  className={`text-sm font-medium
                  ${
                    step.status === "current"
                      ? "text-blue-600"
                      : step.status === "completed"
                      ? "text-green-600"
                      : step.status === "error"
                      ? "text-red-600"
                      : "text-gray-500"
                  }
                `}
                >
                  {step.title}
                </div>
                <div className="text-xs text-gray-500 mt-1 max-w-[120px]">
                  {step.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current step alert */}
      <Alert className="mt-8">
        <AlertDescription>{steps[currentStep].description}</AlertDescription>
      </Alert>
    </div>
  );
};

export default RegistrationStepper;
