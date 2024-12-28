// src/components/election/results/Page.tsx

import { useState, useEffect } from "react";
import { PublicKey } from "@solana/web3.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import ResultsSummary from "./Summary";
import VoteDistribution from "./VoteDistribution";
import TurnoutAnalysis from "./TurnoutAnalysis";
import ViewResults from "./View";
import ExportControls from "./ExportControls";
import { useProgram } from "@/hooks/useProgram";
import LoadingSpinner from "@/components/ui/loadingSpinner";

interface ResultsPageProps {
  electionPDA: string;
}

export default function ResultsPage({ electionPDA }: ResultsPageProps) {
  const { program } = useProgram();
  const [election, setElection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchElectionData = async () => {
      if (!program || !electionPDA) return;

      try {
        setLoading(true);
        const electionKey = new PublicKey(electionPDA);
        const electionAccount = await program.account.election.fetch(
          electionKey
        );
        setElection(electionAccount);
      } catch (err) {
        console.error("Error fetching election:", err);
        setError("Failed to load election data");
      } finally {
        setLoading(false);
      }
    };

    fetchElectionData();
  }, [program, electionPDA]);

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading election results..." />;
  }

  if (error || !election) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error || "Election data not available"}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Export Controls */}
      <div className="flex justify-end">
        <ExportControls electionId={election.id} />
      </div>

      {/* Summary Section */}
      <Card>
        <CardHeader>
          <CardTitle>Results Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <ResultsSummary electionPDA={electionPDA} />
        </CardContent>
      </Card>

      {/* Vote Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Vote Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <VoteDistribution electionPDA={electionPDA} />
        </CardContent>
      </Card>

      {/* Turnout Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Turnout Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <TurnoutAnalysis electionPDA={electionPDA} />
        </CardContent>
      </Card>

      {/* Detailed Results View */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Results</CardTitle>
        </CardHeader>
        <CardContent>
          <ViewResults electionPDA={new PublicKey(electionPDA)} />
        </CardContent>
      </Card>
    </div>
  );
}
