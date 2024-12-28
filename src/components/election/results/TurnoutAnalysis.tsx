// src/components/election/results/TurnoutAnalysis.tsx

import { useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { AlertCircle, TrendingUp, TrendingDown, Users } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useProgram } from "@/hooks/useProgram";
import LoadingSpinner from "@/components/ui/loadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TurnoutAnalysisProps {
  electionPDA: string;
}

interface TurnoutData {
  registeredVoters: number;
  votedCount: number;
  eligibleVoters: number;
  studentVoters: number;
  staffVoters: number;
  studentVoted: number;
  staffVoted: number;
}

export default function TurnoutAnalysis({ electionPDA }: TurnoutAnalysisProps) {
  const { program } = useProgram();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TurnoutData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!program) return;

      try {
        setLoading(true);
        const electionKey = new PublicKey(electionPDA);
        const election = await program.account.election.fetch(electionKey);

        // Fetch all election voters
        const allElectionVoters = await program.account.electionVoter.all([
          {
            memcmp: {
              offset: 8, // Skip discriminator
              bytes: electionKey.toBase58(),
            },
          },
        ]);

        // Fetch voter verifications to determine voter types
        const verifications = await Promise.all(
          allElectionVoters.map(async (voter) => {
            const [verificationPDA] = PublicKey.findProgramAddressSync(
              [
                Buffer.from("user_verification"),
                voter.account.voter.toBuffer(),
              ],
              program.programId
            );
            return program.account.userVerification.fetch(verificationPDA);
          })
        );

        // Calculate turnout statistics
        const turnoutData: TurnoutData = {
          registeredVoters: allElectionVoters.length,
          votedCount: election.totalVoters,
          eligibleVoters: allElectionVoters.filter((v) => v.account.isEligible)
            .length,
          studentVoters: verifications.filter((v) => "student" in v.userType)
            .length,
          staffVoters: verifications.filter((v) => "staff" in v.userType)
            .length,
          studentVoted: allElectionVoters.filter(
            (v, i) =>
              v.account.hasVoted && "student" in verifications[i].userType
          ).length,
          staffVoted: allElectionVoters.filter(
            (v, i) => v.account.hasVoted && "staff" in verifications[i].userType
          ).length,
        };

        setData(turnoutData);
      } catch (err) {
        console.error("Error fetching turnout data:", err);
        setError("Failed to load turnout data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [program, electionPDA]);

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading turnout analysis..." />;
  }

  if (error || !data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error || "Failed to load turnout data"}
        </AlertDescription>
      </Alert>
    );
  }

  const turnoutRate =
    data.eligibleVoters > 0 ? (data.votedCount / data.eligibleVoters) * 100 : 0;

  const pieData = [
    { name: "Student Voted", value: data.studentVoted, color: "#22c55e" },
    { name: "Staff Voted", value: data.staffVoted, color: "#3b82f6" },
    {
      name: "Not Voted",
      value: data.eligibleVoters - data.votedCount,
      color: "#64748b",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Overall Turnout
            </CardTitle>
            {turnoutRate >= 50 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-yellow-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{turnoutRate.toFixed(1)}%</div>
            <p className="text-xs text-gray-500">
              {data.votedCount} out of {data.eligibleVoters} eligible voters
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Student Participation
            </CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((data.studentVoted / data.studentVoters) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500">
              {data.studentVoted} out of {data.studentVoters} students
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Staff Participation
            </CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((data.staffVoted / data.staffVoters) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500">
              {data.staffVoted} out of {data.staffVoters} staff members
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Voter Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {turnoutRate < 30 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Low voter turnout detected. Consider extending the voting period or
            sending reminders to eligible voters.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
