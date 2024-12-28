import React from "react";
import { PublicKey } from "@solana/web3.js";
import { GraduationCap, Users, Award, ThumbsUp, ThumbsDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useElection } from "@/hooks/useElection";
import { Election, UserType } from "@/types/vote";

interface RuleMetric {
  name: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
}

const ElectionStatus = ({ electionPDA }: { electionPDA: string }) => {
  const [election, setElection] = React.useState<Election | null>(null);
  const [loading, setLoading] = React.useState(true);
  const { fetchElection } = useElection();

  React.useEffect(() => {
    const loadElection = async () => {
      if (!electionPDA) return;
      
      try {
        setLoading(true);
        const data = await fetchElection(new PublicKey(electionPDA));
        setElection(data);
      } catch (error) {
        console.error("Error loading election:", error);
      } finally {
        setLoading(false);
      }
    };

    loadElection();
  }, [electionPDA, fetchElection]);

  const formatVoterTypes = (types: UserType[]) => {
    return types.map(type => 
      Object.keys(type)[0].charAt(0).toUpperCase() + 
      Object.keys(type)[0].slice(1)
    ).join(", ");
  };

  const getRules = (): RuleMetric[] => {
    if (!election) return [];

    return [
      {
        name: "Voter Types",
        value: formatVoterTypes(election.allowedVoterTypes),
        icon: <GraduationCap size={20} />,
        description: "Eligible voter categories"
      },
      {
        name: "Winners",
        value: election.numWinners,
        icon: <Award size={20} />,
        description: "Number of winning positions"
      },
      {
        name: "Plus Votes",
        value: election.numPlusVotes,
        icon: <ThumbsUp size={20} />,
        description: "Maximum positive votes per voter"
      },
      {
        name: "Minus Votes",
        value: election.numMinusVotes,
        icon: <ThumbsDown size={20} />,
        description: "Maximum negative votes per voter"
      }
    ];
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Election Rules</h2>
          <div className="h-4 w-24 bg-gray-200 animate-pulse rounded" />
        </div>
        <div className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="h-4 w-32 bg-gray-200 animate-pulse rounded" />
                <div className="h-4 w-16 bg-gray-200 animate-pulse rounded" />
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  const rules = getRules();

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Election Rules</h2>
        <span className="text-sm text-blue-500">
          D21 Voting System
        </span>
      </div>

      <div className="space-y-6">
        {rules.map((rule) => (
          <div key={rule.name} className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-gray-600">
                {rule.icon}
                <span className="text-sm">{rule.name}</span>
              </div>
              <span className="text-sm font-medium">{rule.value}</span>
            </div>
            <div className="text-xs text-gray-500">{rule.description}</div>
            <div className="h-1 w-full bg-blue-50 rounded-full">
              <div className="h-1 bg-blue-500 rounded-full" style={{ width: "100%" }} />
            </div>
          </div>
        ))}
      </div>

      {election && (
        <div className="mt-6 pt-4 border-t">
          <h3 className="text-sm font-medium mb-3">Important Dates</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Start Time</span>
              <span>{new Date(election.startTime * 1000).toLocaleString()}</span>
            </div>
            {election.endTime && (
              <div className="flex justify-between">
                <span className="text-gray-600">End Time</span>
                <span>{new Date(Number(election.endTime) * 1000).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default ElectionStatus;