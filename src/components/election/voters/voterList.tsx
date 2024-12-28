// src/components/election/voters/voterList.tsx
import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ElectionVoter, VoterStatus } from "@/types/vote";

interface VoterListProps {
  voters: ElectionVoter[];
  onUpdateStatus: (voter: PublicKey, newStatus: VoterStatus) => Promise<void>;
  electionPDA: PublicKey;
}

export function VoterList({
  voters,
  onUpdateStatus,
  electionPDA,
}: VoterListProps) {
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  // Status options from the test cases
  const statusOptions: VoterStatus[] = [
    { active: {} },
    { suspended: {} },
    { revoked: {} },
    { pending: {} },
    { onHold: {} },
  ];

  const handleStatusUpdate = async (
    voterPubkey: PublicKey,
    newStatus: VoterStatus
  ) => {
    try {
      setUpdating(voterPubkey.toString());
      setUpdateError(null);
      await onUpdateStatus(voterPubkey, newStatus);
    } catch (err) {
      console.error("Error updating voter status:", err);
      setUpdateError("Failed to update voter status");
    } finally {
      setUpdating(null);
    }
  };

  const getStatusDisplay = (status: VoterStatus): string => {
    return (
      Object.keys(status)[0].charAt(0).toUpperCase() +
      Object.keys(status)[0].slice(1)
    );
  };

  const getStatusColor = (status: VoterStatus): string => {
    const statusKey = Object.keys(status)[0];
    const colors: Record<string, string> = {
      active: "text-green-600 bg-green-50",
      suspended: "text-yellow-600 bg-yellow-50",
      revoked: "text-red-600 bg-red-50",
      onHold: "text-orange-600 bg-orange-50",
      pending: "text-blue-600 bg-blue-50",
    };
    return colors[statusKey] || "text-gray-600 bg-gray-50";
  };

  return (
    <div className="space-y-4">
      {updateError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{updateError}</AlertDescription>
        </Alert>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Voter Address</TableHead>
            <TableHead>Registration Time</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Eligibility</TableHead>
            <TableHead>Has Voted</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {voters.map((voter) => (
            <TableRow key={voter.voter.toString()}>
              <TableCell className="font-mono">
                {voter.voter.toString().slice(0, 4)}...
                {voter.voter.toString().slice(-4)}
              </TableCell>
              <TableCell>
                {new Date(
                  Number(voter.registrationTime) * 1000
                ).toLocaleString()}
              </TableCell>
              <TableCell>
                <span
                  className={`px-2 py-1 rounded-full text-sm font-medium
                  ${getStatusColor(voter.status)}`}
                >
                  {getStatusDisplay(voter.status)}
                </span>
              </TableCell>
              <TableCell>
                {voter.isEligible ? (
                  <span className="text-green-600">Eligible</span>
                ) : (
                  <span className="text-red-600">Not Eligible</span>
                )}
              </TableCell>
              <TableCell>
                {voter.hasVoted ? (
                  <span className="text-green-600">Yes</span>
                ) : (
                  <span className="text-gray-600">No</span>
                )}
              </TableCell>
              <TableCell>
                <Select
                  disabled={updating === voter.voter.toString()}
                  onValueChange={(value) => {
                    const newStatus = statusOptions.find(
                      (s) => Object.keys(s)[0] === value
                    );
                    if (newStatus) {
                      handleStatusUpdate(voter.voter, newStatus);
                    }
                  }}
                  value={Object.keys(voter.status)[0]}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Update Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {statusOptions.map((status) => {
                        const statusKey = Object.keys(status)[0];
                        return (
                          <SelectItem
                            key={statusKey}
                            value={statusKey}
                            disabled={
                              statusKey === Object.keys(voter.status)[0]
                            }
                          >
                            {getStatusDisplay(status)}
                          </SelectItem>
                        );
                      })}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {voters.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No registered voters found
        </div>
      )}
    </div>
  );
}
