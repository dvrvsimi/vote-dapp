// components/election/settings/accessControl.tsx
import React, { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useElectionSettings } from "@/hooks/useElectionSettings";
import LoadingSpinner from "@/components/ui/loadingSpinner";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PublicKey } from "@solana/web3.js";

interface AccessControlProps {
  electionPDA: string;
}

const AccessControl: React.FC<AccessControlProps> = ({ electionPDA }) => {
  const { election, isLoading, isAuthorized, updateVoterEligibility } =
    useElectionSettings(electionPDA);
  const [selectedVoter, setSelectedVoter] = useState<string>("");

  const handleVoterStatusUpdate = async (
    publicKey: string,
    status: "active" | "suspended" | "revoked"
  ) => {
    try {
      await updateVoterEligibility(new PublicKey(publicKey), status);
      toast.success("Voter status updated successfully");
    } catch (error) {
      toast.error("Failed to update voter status");
    }
  };

  if (!election || !isAuthorized) {
    return (
      <div className="text-center p-6">
        <p className="text-gray-600">
          {!election
            ? "Loading..."
            : "You are not authorized to modify these settings."}
        </p>
      </div>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Access Control</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Require Voter Verification
            </span>
            <Switch
              checked={true}
              disabled={true}
              aria-label="Require Voter Verification"
            />
          </div>

          <div>
            <label
              htmlFor="voterSearch"
              className="block text-sm font-medium text-gray-700"
            >
              Search Voter
            </label>
            <div className="mt-1 flex space-x-2">
              <Input
                type="text"
                id="voterSearch"
                placeholder="Enter voter public key"
                value={selectedVoter}
                onChange={(e) => setSelectedVoter(e.target.value)}
              />
              <Button
                disabled={!selectedVoter}
                onClick={() => {
                  // Add voter search logic
                  toast.info("Voter search not implemented");
                }}
              >
                Search
              </Button>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Recent Voters
            </h4>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Voter</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {election.totalVoters === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-gray-500"
                      >
                        No voters registered yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    // This would be replaced with actual voter data
                    <TableRow>
                      <TableCell className="font-mono text-sm">
                        {election.authority.toString().slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <Badge>Active</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleVoterStatusUpdate(
                                election.authority.toString(),
                                "suspended"
                              )
                            }
                            disabled={isLoading}
                          >
                            Suspend
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              handleVoterStatusUpdate(
                                election.authority.toString(),
                                "revoked"
                              )
                            }
                            disabled={isLoading}
                          >
                            Revoke
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AccessControl;
