export const formatVoterStatus = (status: Record<string, unknown>): string => {
  const statusKey = Object.keys(status)[0];
  return statusKey.charAt(0).toUpperCase() + statusKey.slice(1);
};

export const formatDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
