// src/components/election/results/VoteDistribution.tsx

import { useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useProgram } from "@/hooks/useProgram";
import LoadingSpinner from "@/components/ui/loadingSpinner";

interface VoteDistributionProps {
  electionPDA: string;
}

type SortField = "netScore" | "plusVotes" | "minusVotes";
type SortOrder = "asc" | "desc";

export default function VoteDistribution({
  electionPDA,
}: VoteDistributionProps) {
  const { program } = useProgram();
  const [election, setElection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>("netScore");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  useEffect(() => {
    const fetchData = async () => {
      if (!program) return;

      try {
        setLoading(true);
        const electionKey = new PublicKey(electionPDA);
        const electionData = await program.account.election.fetch(electionKey);
        setElection(electionData);
      } catch (error) {
        console.error("Error fetching election data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [program, electionPDA]);

  const processChartData = () => {
    if (!election) return [];

    const data = election.candidates.map((candidate: any, index: number) => {
      const plusVotes = Number(candidate.plusVotes);
      const minusVotes = Number(candidate.minusVotes);
      return {
        id: index + 1,
        name: `Candidate ${index + 1}`,
        address: candidate.address.toString(),
        plusVotes,
        minusVotes,
        netScore: plusVotes - minusVotes,
        isWinner: election.winners.some(
          (w: PublicKey) => w.toString() === candidate.address.toString()
        ),
      };
    });

    return data.sort((a: any, b: any) => {
      const multiplier = sortOrder === "desc" ? -1 : 1;
      return multiplier * (a[sortField] - b[sortField]);
    });
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  if (loading)
    return <LoadingSpinner size="lg" message="Loading vote distribution..." />;
  if (!election) return null;

  const chartData = processChartData();

  return (
    <div className="space-y-6">
      {/* Sort Controls */}
      <div className="flex gap-4">
        {[
          { key: "netScore", label: "Net Score" },
          { key: "plusVotes", label: "Plus Votes" },
          { key: "minusVotes", label: "Minus Votes" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => toggleSort(key as SortField)}
            className={`flex items-center px-3 py-1 rounded ${
              sortField === key
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {label}
            {sortField === key &&
              (sortOrder === "desc" ? (
                <ChevronDown className="w-4 h-4 ml-1" />
              ) : (
                <ChevronUp className="w-4 h-4 ml-1" />
              ))}
          </button>
        ))}
      </div>

      {/* Vote Distribution Chart */}
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              tickFormatter={(value) => `#${value.split(" ")[1]}`}
            />
            <YAxis />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-4 border rounded-lg shadow">
                      <p className="font-medium">{label}</p>
                      <p className="text-xs text-gray-500 break-all mb-2">
                        {data.address}
                      </p>
                      <div className="space-y-1">
                        <p className="text-sm text-green-600">
                          Plus Votes: {data.plusVotes}
                        </p>
                        <p className="text-sm text-red-600">
                          Minus Votes: {data.minusVotes}
                        </p>
                        <p className="text-sm font-medium border-t pt-1">
                          Net Score: {data.netScore}
                        </p>
                      </div>
                      {data.isWinner && (
                        <p className="mt-2 text-xs text-blue-600 font-medium">
                          ★ Winner
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Bar
              dataKey="plusVotes"
              name="Plus Votes"
              fill="#22c55e"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="minusVotes"
              name="Minus Votes"
              fill="#ef4444"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Highest Net Score</p>
          <p className="mt-2 text-2xl font-bold">
            {Math.max(...chartData.map((d: any) => d.netScore))}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Average Plus Votes</p>
          <p className="mt-2 text-2xl font-bold text-green-600">
            {(
              chartData.reduce(
                (acc: number, curr: any) => acc + curr.plusVotes,
                0
              ) / chartData.length
            ).toFixed(1)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Average Minus Votes</p>
          <p className="mt-2 text-2xl font-bold text-red-600">
            {(
              chartData.reduce(
                (acc: number, curr: any) => acc + curr.minusVotes,
                0
              ) / chartData.length
            ).toFixed(1)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Vote Spread</p>
          <p className="mt-2 text-2xl font-bold">
            {Math.max(...chartData.map((d: any) => d.netScore)) -
              Math.min(...chartData.map((d: any) => d.netScore))}
          </p>
        </div>
      </div>
    </div>
  );
}
