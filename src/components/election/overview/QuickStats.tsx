import React from "react";
import { Users, Vote, Clock, CheckCircle } from "lucide-react";
import { useElection } from "@/hooks/useElection";
import { ElectionStatus } from "@/types/vote";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PublicKey } from "@solana/web3.js";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  loading?: boolean;
}

const StatCard = ({ title, value, subtitle, icon, loading }: StatCardProps) => {
  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-semibold mt-2">{value}</p>
          <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
        </div>
        <div className="text-blue-500">{icon}</div>
      </div>
    </Card>
  );
};

const QuickStats = ({ electionPDA }: { electionPDA: string }) => {
  const { fetchElection } = useElection();
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState({
    totalVoters: 0,
    status: "Created" as keyof typeof ElectionStatus,
    timeRemaining: "",
    participationRate: 0,
    candidateCount: 0,
  });

  React.useEffect(() => {
    const loadElectionStats = async () => {
      if (!electionPDA) return;

      try {
        const electionData = await fetchElection(new PublicKey(electionPDA));

        if (!electionData) return;

        // Calculate time remaining if election is active
        let timeRemaining = "";
        if (electionData.endTime) {
          const now = new Date().getTime();
          const end = new Date(Number(electionData.endTime) * 1000);
          const diff = end.getTime() - now;

          if (diff > 0) {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor(
              (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
            );
            timeRemaining = `${days}d ${hours}h remaining`;
          } else {
            timeRemaining = "Ended";
          }
        } else {
          timeRemaining = "No end time set";
        }

        // Calculate participation rate
        const participationRate =
          electionData.totalVoters > 0
            ? (
                (electionData.totalVoters / electionData.candidates.length) *
                100
              ).toFixed(1)
            : 0;

        setStats({
          totalVoters: electionData.totalVoters,
          status: Object.keys(
            electionData.status
          )[0] as keyof typeof ElectionStatus,
          timeRemaining,
          participationRate: Number(participationRate),
          candidateCount: electionData.candidates.length,
        });
      } catch (error) {
        console.error("Error loading election stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadElectionStats();

    // Set up polling for updates every 30 seconds
    const interval = setInterval(loadElectionStats, 30000);

    return () => clearInterval(interval);
  }, [electionPDA, fetchElection]);

  const statsConfig = [
    {
      title: "Total Voters",
      value: stats.totalVoters.toLocaleString(),
      subtitle: `${stats.participationRate}% participation rate`,
      icon: <Users size={24} />,
    },
    {
      title: "Election Status",
      value: stats.status,
      subtitle: "Current state of election",
      icon: <Vote size={24} />,
    },
    {
      title: "Time Remaining",
      value: stats.timeRemaining || "N/A",
      subtitle: "Until election ends",
      icon: <Clock size={24} />,
    },
    {
      title: "Candidates",
      value: stats.candidateCount,
      subtitle: "Running for positions",
      icon: <CheckCircle size={24} />,
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Election Statistics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {statsConfig.map((stat) => (
          <StatCard key={stat.title} {...stat} loading={loading} />
        ))}
      </div>
    </div>
  );
};

export default QuickStats;
