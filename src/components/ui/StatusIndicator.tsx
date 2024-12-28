// // src/components/election/StatusIndicator.tsx
// import { useState, useEffect } from "react";
// import { Check, AlertCircle, Clock, Loader2 } from "lucide-react";
// import { RegistrationStatus } from "@/types/registration";

// interface StatusIndicatorProps {
//   status: RegistrationStatus;
//   message?: string;
// }

// export default function StatusIndicator({
//   status,
//   message,
// }: StatusIndicatorProps) {
//   const [animation, setAnimation] = useState(false);

//   useEffect(() => {
//     setAnimation(true);
//     const timer = setTimeout(() => setAnimation(false), 500);
//     return () => clearTimeout(timer);
//   }, [status]);

//   const getStatusConfig = () => {
//     switch (status) {
//       case "completed":
//         return {
//           icon: Check,
//           color: "text-green-600 bg-green-50 border-green-200",
//           text: message || "Registration completed",
//         };
//       case "error":
//         return {
//           icon: AlertCircle,
//           color: "text-red-600 bg-red-50 border-red-200",
//           text: message || "Registration failed",
//         };
//       case "inProgress":
//         return {
//           icon: Loader2,
//           color: "text-blue-600 bg-blue-50 border-blue-200",
//           text: message || "Processing registration",
//           animate: true,
//         };
//       default:
//         return {
//           icon: Clock,
//           color: "text-gray-600 bg-gray-50 border-gray-200",
//           text: message || "Waiting to start",
//         };
//     }
//   };

//   const config = getStatusConfig();
//   const Icon = config.icon;

//   return (
//     <div
//       className={`flex items-center p-4 border rounded-lg transition-all duration-200 ${
//         config.color
//       } ${animation ? "scale-105" : "scale-100"}`}
//     >
//       <Icon
//         className={`h-5 w-5 mr-3 ${config.animate ? "animate-spin" : ""}`}
//       />
//       <span className="font-medium">{config.text}</span>
//     </div>
//   );
// }

import React from "react";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { cn } from "@/utils/utils";
import { RegistrationStatus } from "@/types/registration";

interface StatusIndicatorProps {
  status: RegistrationStatus;
  text?: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const StatusIndicator = ({
  status,
  text,
  showIcon = true,
  size = "md",
  className,
}: StatusIndicatorProps) => {
  const getStatusConfig = (status: RegistrationStatus) => {
    switch (status) {
      case "completed":
        return {
          icon: CheckCircle2,
          color: "text-green-600 bg-green-50",
          text: text || "Completed",
        };
      case "error":
        return {
          icon: XCircle,
          color: "text-red-600 bg-red-50",
          text: text || "Error",
        };
      case "checking":
        return {
          icon: Loader2,
          color: "text-blue-600 bg-blue-50",
          text: text || "Checking",
          animate: true,
        };
      case "inProgress":
        return {
          icon: Clock,
          color: "text-yellow-600 bg-yellow-50",
          text: text || "In Progress",
        };
      default:
        return {
          icon: AlertCircle,
          color: "text-gray-600 bg-gray-50",
          text: text || "Idle",
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-sm px-2 py-1 space-x-1",
    md: "text-base px-3 py-1.5 space-x-2",
    lg: "text-lg px-4 py-2 space-x-2",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        sizeClasses[size],
        config.color,
        className
      )}
    >
      {showIcon && (
        <Icon
          className={cn(iconSizes[size], config.animate && "animate-spin")}
        />
      )}
      <span>{config.text}</span>
    </div>
  );
};

export default StatusIndicator;
