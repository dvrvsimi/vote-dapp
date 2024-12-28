// src/components/election/monitoring/LeadingCandidates.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, TrendingUp, TrendingDown } from "lucide-react";

export default function LeadingCandidates({ election }: { election: any }) {
  // Process and sort candidates by net score
  const sortedCandidates = [...election.candidates]
    .map((candidate: any) => ({
      address: candidate.address.toString(),
      plusVotes: Number(candidate.plusVotes),
      minusVotes: Number(candidate.minusVotes),
      netScore: Number(candidate.plusVotes) - Number(candidate.minusVotes),
      rank: candidate.rank,
      isWinner: election.winners.some(
        (w: any) => w.toString() === candidate.address.toString()
      ),
    }))
    .sort((a, b) => b.netScore - a.netScore);

  const leader = sortedCandidates[0];
  const runnerUp = sortedCandidates[1];
  const margin = leader && runnerUp ? leader.netScore - runnerUp.netScore : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leading Candidates</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Current Leader */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center space-x-3 mb-3">
            <Trophy className="h-5 w-5 text-blue-600" />
            <h3 className="font-medium">Current Leader</h3>
          </div>
          {leader ? (
            <div className="space-y-2">
              <p className="font-mono text-sm">
                {leader.address.slice(0, 4)}...{leader.address.slice(-4)}
              </p>
              <div className="flex space-x-4">
                <div>
                  <p className="text-sm text-gray-500">Net Score</p>
                  <p className="text-xl font-bold">{leader.netScore}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Margin</p>
                  <p className="text-xl font-bold text-green-600">+{margin}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No votes cast yet</p>
          )}
        </div>

        {/* Top Candidates */}
        <div className="space-y-4">
          {sortedCandidates.slice(0, 5).map((candidate, index) => (
            <div
              key={candidate.address}
              className={`flex items-center justify-between p-3 rounded-lg
                ${index === 0 ? "bg-blue-50" : "bg-gray-50"}`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-6 h-6 flex items-center justify-center rounded-full 
                  ${index === 0 ? "bg-blue-200" : "bg-gray-200"}`}
                >
                  <span className="text-sm font-medium">#{index + 1}</span>
                </div>
                <div>
                  <p className="font-mono text-sm">
                    {candidate.address.slice(0, 4)}...
                    {candidate.address.slice(-4)}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-sm text-green-600">
                      +{candidate.plusVotes}
                    </span>
                    <span className="text-sm text-red-600">
                      -{candidate.minusVotes}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="font-medium">{candidate.netScore}</span>
                {index === 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-gray-400" />
                )}
                {candidate.isWinner && (
                  <Trophy className="h-4 w-4 text-yellow-500 ml-2" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Vote Thresholds */}
        <div className="mt-6 pt-6 border-t">
          <h3 className="text-sm font-medium mb-3">Voting Thresholds</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Winners Required</span>
              <span className="font-medium">{election.numWinners}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Max Plus Votes</span>
              <span className="font-medium">{election.numPlusVotes}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Max Minus Votes</span>
              <span className="font-medium">{election.numMinusVotes}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
