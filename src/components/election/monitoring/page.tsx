// src/components/election/monitoring/page.tsx
import { useState, useEffect } from "react";
import { PublicKey } from "@solana/web3.js";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useElection } from "@/hooks/useElection";
import VoteProgress from "./VoteProgress";
import VoteDistribution from "./VoteDistribution";
import LeadingCandidates from "./LeadingCandidates";
import ParticipationMetrics from "./participation/ParticipationMetrics";
import ParticipationTimeline from "./participation/ParticipationTimeline";
import LoadingSpinner from "@/components/ui/loadingSpinner";

export default function MonitoringPage({
  electionPDA,
}: {
  electionPDA: string;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [election, setElection] = useState<any>(null);
  const { fetchElection } = useElection();

  const loadElectionData = async () => {
    if (!electionPDA) return;

    try {
      setLoading(true);
      const data = await fetchElection(new PublicKey(electionPDA));
      setElection(data);
      setError(null);
    } catch (err) {
      console.error("Error loading election data:", err);
      setError("Failed to load election data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadElectionData();
    // Polling every 30 seconds
    const interval = setInterval(loadElectionData, 30000);
    return () => clearInterval(interval);
  }, [electionPDA]);

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading monitoring data..." />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Election Monitoring</h1>
        <button
          onClick={loadElectionData}
          className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg border shadow-sm hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh Data</span>
        </button>
      </div>

      {election && (
        <>
          {/* Participation Overview Section */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Participation Overview</h2>
            <ParticipationMetrics electionPDA={electionPDA} />
            <ParticipationTimeline electionPDA={electionPDA} />
          </div>

          {/* Vote Progress and Distribution Section */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Vote Analysis</h2>
            <VoteProgress election={election} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <VoteDistribution election={election} />
              <LeadingCandidates election={election} />
            </div>
          </div>
        </>
      )}

      {/* Status Section */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mt-6">
        <h3 className="text-sm font-medium text-blue-800 mb-2">
          Monitoring Status
        </h3>
        <div className="flex items-center space-x-2 text-sm text-blue-600">
          <div className="h-2 w-2 rounded-full bg-green-500"></div>
          <span>Live updates every 30 seconds</span>
        </div>
      </div>
    </div>
  );
}
