import React from "react";
import { HelpCircle } from "lucide-react";
import { cn } from "@/utils/utils";

interface TooltipProps {
  content: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  children?: React.ReactNode;
  icon?: boolean;
  className?: string;
}

const Tooltip = ({
  content,
  position = "top",
  children,
  icon = true,
  className,
}: TooltipProps) => {
  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-gray-800",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-gray-800",
    left: "left-full top-1/2 -translate-y-1/2 border-l-gray-800",
    right: "right-full top-1/2 -translate-y-1/2 border-r-gray-800",
  };

  return (
    <div className="relative inline-block group">
      {children || (icon && <HelpCircle className="w-4 h-4 text-gray-500" />)}

      <div
        className={cn(
          "absolute z-50 hidden group-hover:block",
          "px-3 py-2 text-sm text-white bg-gray-800 rounded-md shadow-lg",
          "whitespace-nowrap",
          positionClasses[position],
          className
        )}
      >
        {content}
        <div
          className={cn(
            "absolute w-0 h-0",
            "border-4 border-transparent",
            arrowClasses[position]
          )}
        />
      </div>
    </div>
  );
};

export default Tooltip;
