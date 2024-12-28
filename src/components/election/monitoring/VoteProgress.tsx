// src/components/election/monitoring/VoteProgress.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Users, TrendingUp } from "lucide-react";

export default function VoteProgress({ election }: { election: any }) {
  const totalVoters = election.totalVoters;
  const totalCandidates = election.candidates.length;
  const totalVotes = election.candidates.reduce(
    (acc: number, candidate: any) =>
      acc + Number(candidate.plusVotes) + Number(candidate.minusVotes),
    0
  );

  const votingProgress = {
    percentage:
      totalVoters > 0
        ? ((totalVotes / (totalVoters * election.numPlusVotes)) * 100).toFixed(
            1
          )
        : "0",
    averageVotesPerVoter:
      totalVoters > 0 ? (totalVotes / totalVoters).toFixed(1) : "0",
  };

  const progressData = election.candidates.map(
    (candidate: any, index: number) => ({
      name: `Candidate ${index + 1}`,
      totalVotes: Number(candidate.plusVotes) + Number(candidate.minusVotes),
      plusVotes: Number(candidate.plusVotes),
      minusVotes: Number(candidate.minusVotes),
    })
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vote Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="flex items-start space-x-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Voters</p>
              <p className="text-2xl font-bold">{totalVoters}</p>
              <p className="text-sm text-gray-600">
                {votingProgress.averageVotesPerVoter} votes per voter
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Voting Progress</p>
              <p className="text-2xl font-bold">{votingProgress.percentage}%</p>
              <p className="text-sm text-gray-600">of maximum possible votes</p>
            </div>
          </div>
        </div>

        <div className="h-[300px] mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={progressData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="plusVotes"
                name="Plus Votes"
                fill="#22c55e"
                stackId="a"
              />
              <Bar
                dataKey="minusVotes"
                name="Minus Votes"
                fill="#ef4444"
                stackId="b"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
