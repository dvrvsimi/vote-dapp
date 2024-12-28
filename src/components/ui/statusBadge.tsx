// src/components/election/registration/StatusBadge.tsx

import React from "react";

interface StatusBadgeProps {
  status: "pending" | "active" | "suspended" | "revoked";
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const badgeClasses = {
    pending: "bg-yellow-100 text-yellow-800",
    active: "bg-green-100 text-green-800",
    suspended: "bg-red-100 text-red-800",
    revoked: "bg-gray-100 text-gray-800",
  };

  return (
    <span
      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${badgeClasses[status]}`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
