// src/components/election/registration/ProgressBar.tsx
import { useEffect, useState } from "react";
import { Check } from "lucide-react";

interface ProgressBarProps {
  steps: {
    id: number;
    label: string;
    completed: boolean;
    current: boolean;
  }[];
}

export default function ProgressBar({ steps }: ProgressBarProps) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
    return () => setAnimate(false);
  }, [steps]);

  return (
    <div className="relative">
      {/* Progress Line */}
      <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-200">
        <div
          className="h-full bg-blue-500 transition-all duration-500"
          style={{
            width: `${
              (steps.filter((s) => s.completed).length / (steps.length - 1)) *
              100
            }%`,
          }}
        />
      </div>

      {/* Steps */}
      <div className="relative flex justify-between">
        {steps.map((step) => (
          <div key={step.id} className="flex flex-col items-center">
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center
                transition-colors duration-200
                ${
                  step.completed
                    ? "bg-blue-500 text-white"
                    : step.current
                    ? "bg-blue-100 text-blue-500 border-2 border-blue-500"
                    : "bg-gray-100 text-gray-400"
                }
              `}
            >
              {step.completed ? (
                <Check className="w-5 h-5" />
              ) : (
                <span>{step.id}</span>
              )}
            </div>
            <span
              className={`
                mt-2 text-sm font-medium
                ${step.current ? "text-blue-500" : "text-gray-500"}
              `}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
