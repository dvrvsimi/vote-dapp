// src/components/election/results/ExportControls.tsx

import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { Download, FileText, BarChart2, Table } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useProgram } from "@/hooks/useProgram";

interface ExportControlsProps {
  electionId?: string;
}

export default function ExportControls({ electionId }: ExportControlsProps) {
  const [exporting, setExporting] = useState(false);
  const { program } = useProgram();

  const exportData = async (format: "csv" | "json" | "pdf") => {
    if (!program || !electionId) return;

    setExporting(true);
    try {
      // Fetch all relevant data
      const electionAccounts = await program.account.election.all([
        {
          memcmp: {
            offset: 8, // Skip discriminator
            bytes: new PublicKey(electionId).toBase58(),
          },
        },
      ]);

      if (!electionAccounts.length) {
        throw new Error("Election not found");
      }

      const election = electionAccounts[0].account;

      let content = "";
      let filename = "";
      let type = "";

      switch (format) {
        case "csv":
          content = generateCSV(election);
          filename = `election-results-${electionId}.csv`;
          type = "text/csv";
          break;
        case "json":
          content = JSON.stringify(formatElectionData(election), null, 2);
          filename = `election-results-${electionId}.json`;
          type = "application/json";
          break;
        case "pdf":
          alert("PDF export not implemented");
          setExporting(false);
          return;
      }

      // Create and trigger download
      const blob = new Blob([content], { type });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setExporting(false);
    }
  };

  const generateCSV = (election: any) => {
    const headers = [
      "Candidate",
      "Plus Votes",
      "Minus Votes",
      "Net Score",
      "Rank",
    ];
    const rows = election.candidates.map((candidate: any) => [
      candidate.address.toString(),
      candidate.plusVotes.toString(),
      candidate.minusVotes.toString(),
      (Number(candidate.plusVotes) - Number(candidate.minusVotes)).toString(),
      candidate.rank,
    ]);

    return [headers, ...rows].map((row) => row.join(",")).join("\n");
  };

  const formatElectionData = (election: any) => {
    return {
      id: election.id,
      name: election.name,
      totalVoters: election.totalVoters,
      startTime: election.startTime.toString(),
      endTime: election.endTime ? election.endTime.toString() : null,
      status: Object.keys(election.status)[0],
      winners: election.winners.map((w: PublicKey) => w.toString()),
      candidates: election.candidates.map((c: any) => ({
        address: c.address.toString(),
        plusVotes: c.plusVotes.toString(),
        minusVotes: c.minusVotes.toString(),
        netScore: Number(c.plusVotes) - Number(c.minusVotes),
        rank: c.rank,
      })),
    };
  };

  if (!electionId) {
    return (
      <Alert>
        <AlertDescription>
          Select an election to enable export options.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex space-x-2">
      <button
        onClick={() => exportData("csv")}
        disabled={exporting}
        className="flex items-center px-3 py-2 bg-white border rounded-md hover:bg-gray-50 disabled:opacity-50"
      >
        <Table className="w-4 h-4 mr-2" />
        CSV
      </button>

      <button
        onClick={() => exportData("json")}
        disabled={exporting}
        className="flex items-center px-3 py-2 bg-white border rounded-md hover:bg-gray-50 disabled:opacity-50"
      >
        <FileText className="w-4 h-4 mr-2" />
        JSON
      </button>

      <button
        onClick={() => exportData("pdf")}
        disabled={exporting}
        className="flex items-center px-3 py-2 bg-white border rounded-md hover:bg-gray-50 disabled:opacity-50"
      >
        <BarChart2 className="w-4 h-4 mr-2" />
        Report
      </button>
    </div>
  );
}
