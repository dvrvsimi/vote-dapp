// src/components/election/results/Summary.tsx

import { useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { Users, Vote, Award, TrendingUp } from "lucide-react";
import { useProgram } from "@/hooks/useProgram";
import LoadingSpinner from "@/components/ui/loadingSpinner";

interface ResultsSummaryProps {
  electionPDA: string;
}

export default function ResultsSummary({ electionPDA }: ResultsSummaryProps) {
  const { program } = useProgram();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!program) return;

      try {
        setLoading(true);
        const electionKey = new PublicKey(electionPDA);
        const election = await program.account.election.fetch(electionKey);

        // Calculate additional metrics
        const totalVotes = election.candidates.reduce(
          (acc: number, candidate: any) => {
            return (
              acc + Number(candidate.plusVotes) + Number(candidate.minusVotes)
            );
          },
          0
        );

        const winningMargin = calculateWinningMargin(election.candidates);

        setData({
          election,
          totalVotes,
          winningMargin,
        });
      } catch (error) {
        console.error("Error fetching summary data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [program, electionPDA]);

  const calculateWinningMargin = (candidates: any[]) => {
    const sorted = [...candidates].sort((a, b) => {
      const scoreA = Number(a.plusVotes) - Number(a.minusVotes);
      const scoreB = Number(b.plusVotes) - Number(b.minusVotes);
      return scoreB - scoreA;
    });

    if (sorted.length < 2) return 0;

    const winner = sorted[0];
    const runnerUp = sorted[1];
    const winnerScore = Number(winner.plusVotes) - Number(winner.minusVotes);
    const runnerUpScore =
      Number(runnerUp.plusVotes) - Number(runnerUp.minusVotes);

    return winnerScore - runnerUpScore;
  };

  if (loading) return <LoadingSpinner size="sm" message="Loading summary..." />;
  if (!data) return null;

  const { election, totalVotes, winningMargin } = data;
  const avgVotesPerVoter =
    election.totalVoters > 0
      ? (totalVotes / election.totalVoters).toFixed(1)
      : "0";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Voters Card */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Voters</p>
            <p className="text-2xl font-bold">{election.totalVoters}</p>
          </div>
          <div className="p-3 bg-blue-100 rounded-full">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
        </div>
        <div className="mt-2">
          <p className="text-sm text-gray-500">
            Avg. votes per voter: {avgVotesPerVoter}
          </p>
        </div>
      </div>

      {/* Total Votes Card */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Votes Cast</p>
            <p className="text-2xl font-bold">{totalVotes}</p>
          </div>
          <div className="p-3 bg-green-100 rounded-full">
            <Vote className="h-6 w-6 text-green-600" />
          </div>
        </div>
        <div className="mt-2">
          <p className="text-sm text-gray-500">Plus and minus votes combined</p>
        </div>
      </div>

      {/* Winners Card */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Winners Selected</p>
            <p className="text-2xl font-bold">{election.winners.length}</p>
          </div>
          <div className="p-3 bg-purple-100 rounded-full">
            <Award className="h-6 w-6 text-purple-600" />
          </div>
        </div>
        <div className="mt-2">
          <p className="text-sm text-gray-500">
            Out of {election.numWinners} positions
          </p>
        </div>
      </div>

      {/* Winning Margin Card */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Winning Margin</p>
            <p className="text-2xl font-bold">{winningMargin}</p>
          </div>
          <div className="p-3 bg-yellow-100 rounded-full">
            <TrendingUp className="h-6 w-6 text-yellow-600" />
          </div>
        </div>
        <div className="mt-2">
          <p className="text-sm text-gray-500">
            Net score difference to runner-up
          </p>
        </div>
      </div>
    </div>
  );
}
