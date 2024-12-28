// src/utils/formatting.ts
import { PublicKey } from "@solana/web3.js";
import { ElectionStatus } from "@/types/election";

export const formatPublicKey = (
  publicKey: PublicKey | string,
  length: number = 4
): string => {
  const keyStr = publicKey.toString();
  if (keyStr.length <= length * 2) return keyStr;
  return `${keyStr.slice(0, length)}...${keyStr.slice(-length)}`;
};

export const formatTimestamp = (timestamp: number): string => {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(timestamp);
};

export const formatDateRange = (
  startTime: number,
  endTime: number | null
): string => {
  const start = new Date(startTime);
  if (!endTime) return `From ${formatTimestamp(startTime)}`;
  return `${formatTimestamp(startTime)} - ${formatTimestamp(endTime)}`;
};

export const formatElectionStatus = (
  status: ElectionStatus
): {
  text: string;
  color: string;
} => {
  switch (status) {
    case "created":
      return { text: "Created", color: "text-blue-600 bg-blue-50" };
    case "active":
      return { text: "Active", color: "text-green-600 bg-green-50" };
    case "ended":
      return { text: "Ended", color: "text-gray-600 bg-gray-50" };
  }
};

export const formatVoteCount = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

export const formatPercentage = (
  value: number,
  decimals: number = 1
): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

export const formatTimeLeft = (endTime: number): string => {
  const now = Date.now();
  const timeLeft = endTime - now;

  if (timeLeft <= 0) return "Ended";

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
};

export const formatError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unknown error occurred";
};
