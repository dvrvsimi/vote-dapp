// src/components/election/monitoring/participation/ParticipationMetrics.tsx
import { useState, useEffect } from "react";
import { PublicKey } from "@solana/web3.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useVoter } from "@/hooks/useVoter";
import { useUserVerification } from "@/hooks/useUserVerification";
import { AlertCircle, Users } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

export default function ParticipationMetrics({
  electionPDA,
}: {
  electionPDA: string;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<any>(null);

  const { fetchRecentVoters } = useVoter(new PublicKey(electionPDA));
  const { fetchVerification } = useUserVerification();

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const voters = await fetchRecentVoters();

      // Get user verifications to check voter types
      const verifications = await Promise.all(
        voters.map((voter) => fetchVerification(voter.voter))
      );

      // Calculate metrics
      const totalVoters = voters.length;
      const votedCount = voters.filter((v) => v.hasVoted).length;
      const eligibleCount = voters.filter((v) => v.isEligible).length;

      // Calculate voter types
      const studentCount = verifications.filter(
        (v) => v && "student" in v.userType
      ).length;
      const staffCount = verifications.filter(
        (v) => v && "staff" in v.userType
      ).length;

      // Calculate voted by type
      const studentVoted = voters.filter(
        (v, i) =>
          v.hasVoted &&
          verifications[i] &&
          "student" in verifications[i].userType
      ).length;

      const staffVoted = voters.filter(
        (v, i) =>
          v.hasVoted && verifications[i] && "staff" in verifications[i].userType
      ).length;

      setMetrics({
        totalVoters,
        votedCount,
        eligibleCount,
        studentCount,
        staffCount,
        studentVoted,
        staffVoted,
        participationRate: totalVoters
          ? ((votedCount / totalVoters) * 100).toFixed(1)
          : 0,
        studentParticipation: studentCount
          ? ((studentVoted / studentCount) * 100).toFixed(1)
          : 0,
        staffParticipation: staffCount
          ? ((staffVoted / staffCount) * 100).toFixed(1)
          : 0,
      });

      setError(null);
    } catch (err) {
      console.error("Error loading participation metrics:", err);
      setError("Failed to load participation metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000);
    return () => clearInterval(interval);
  }, [electionPDA]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const participationData = [
    { name: "Voted", value: metrics.votedCount, color: "#22c55e" },
    {
      name: "Not Voted",
      value: metrics.totalVoters - metrics.votedCount,
      color: "#ef4444",
    },
  ];

  const voterTypeData = [
    { name: "Student Voted", value: metrics.studentVoted, color: "#3b82f6" },
    { name: "Staff Voted", value: metrics.staffVoted, color: "#8b5cf6" },
    {
      name: "Not Voted",
      value: metrics.totalVoters - metrics.votedCount,
      color: "#64748b",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Overall Participation */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Participation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold">
                {metrics.participationRate}%
              </h3>
              <p className="text-sm text-gray-500">Participation Rate</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={participationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {participationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Voter Type Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Voter Type Participation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            <div>
              <p className="text-sm text-gray-500">Student Participation</p>
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">
                  {metrics.studentParticipation}%
                </h3>
                <p className="text-sm text-gray-600">
                  {metrics.studentVoted} of {metrics.studentCount}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Staff Participation</p>
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">
                  {metrics.staffParticipation}%
                </h3>
                <p className="text-sm text-gray-600">
                  {metrics.staffVoted} of {metrics.staffCount}
                </p>
              </div>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={voterTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {voterTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
