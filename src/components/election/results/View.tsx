// src/components/election/results/View.tsx

import { useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Trophy,
} from "lucide-react";
import { useProgram } from "@/hooks/useProgram";
import { useWallet } from "@solana/wallet-adapter-react";
import LoadingSpinner from "@/components/ui/loadingSpinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ViewResultsProps {
  electionPDA: PublicKey;
}

interface CandidateResult {
  address: string;
  plusVotes: number;
  minusVotes: number;
  netScore: number;
  rank: number;
  isWinner: boolean;
}

const PAGE_SIZE = 10;

export default function ViewResults({ electionPDA }: ViewResultsProps) {
  const { program } = useProgram();
  const { publicKey } = useWallet();

  const [election, setElection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortedResults, setSortedResults] = useState<CandidateResult[]>([]);
  const [sortConfig, setSortConfig] = useState({
    key: "rank",
    direction: "asc",
  });

  useEffect(() => {
    const fetchElectionData = async () => {
      if (!program) return;

      try {
        setLoading(true);
        const electionData = await program.account.election.fetch(electionPDA);
        setElection(electionData);

        // Process candidate results
        const results = electionData.candidates.map((candidate: any) => ({
          address: candidate.address.toString(),
          plusVotes: Number(candidate.plusVotes),
          minusVotes: Number(candidate.minusVotes),
          netScore: Number(candidate.plusVotes) - Number(candidate.minusVotes),
          rank: candidate.rank,
          isWinner: electionData.winners.some(
            (w: PublicKey) => w.toString() === candidate.address.toString()
          ),
        }));

        setSortedResults(
          sortResults(results, sortConfig.key, sortConfig.direction)
        );
      } catch (err) {
        console.error("Error fetching election data:", err);
        setError("Failed to load election results");
      } finally {
        setLoading(false);
      }
    };

    fetchElectionData();
  }, [program, electionPDA]);

  const sortResults = (
    results: CandidateResult[],
    key: string,
    direction: string
  ) => {
    return [...results].sort((a: any, b: any) => {
      if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
      if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
      return 0;
    });
  };

  const handleSort = (key: string) => {
    const direction =
      sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction });
    setSortedResults(sortResults(sortedResults, key, direction));
  };

  const totalPages = Math.ceil(sortedResults.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const currentResults = sortedResults.slice(startIndex, endIndex);

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading detailed results..." />;
  }

  if (error || !election) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error || "Election data not available"}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("address")}
                >
                  Candidate
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("plusVotes")}
                >
                  Plus Votes
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("minusVotes")}
                >
                  Minus Votes
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("netScore")}
                >
                  Net Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentResults.map((result, index) => (
                <tr
                  key={result.address}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    #{result.rank + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">
                        {result.address.slice(0, 8)}...
                        {result.address.slice(-8)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                    +{result.plusVotes}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                    -{result.minusVotes}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {result.netScore}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {result.isWinner && (
                      <span className="flex items-center text-blue-600">
                        <Trophy className="w-4 h-4 mr-1" />
                        Winner
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border rounded-lg">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50"
          >
            <ChevronsLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
            className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50"
          >
            <ChevronsRight className="w-5 h-5" />
          </button>
        </div>
        <div className="text-sm text-gray-500">
          Showing {startIndex + 1} to {Math.min(endIndex, sortedResults.length)}{" "}
          of {sortedResults.length} results
        </div>
      </div>

      {/* Election Details */}
      <Card>
        <CardHeader>
          <CardTitle>Election Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <p className="mt-1">{Object.keys(election.status)[0]}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Voters</p>
              <p className="mt-1">{election.totalVoters}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Start Time</p>
              <p className="mt-1">
                {new Date(election.startTime * 1000).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">End Time</p>
              <p className="mt-1">
                {election.endTime
                  ? new Date(election.endTime * 1000).toLocaleString()
                  : "Ongoing"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
