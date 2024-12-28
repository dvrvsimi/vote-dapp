// src/components/election/voters/page.tsx
"use client";

import { useState, useCallback, useMemo } from "react";
import { PublicKey } from "@solana/web3.js";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, AlertCircle } from "lucide-react";
import { useVoter } from "@/hooks/useVoter";
import { useElection } from "@/hooks/useElection";
import { useUserVerification } from "@/hooks/useUserVerification";
import { ElectionVoter, VoterStatus, UserVerification } from "@/types/vote";
import { VoterList } from "./voterList";
import { VoterStats } from "./voterStats";
import { VoterFilters } from "./voterFilters";
import LoadingSpinner from "@/components/ui/loadingSpinner";

interface VotersPageProps {
  electionPDA: string;
}

interface VoterFilters {
  status: VoterStatus | "all";
  voterType: "student" | "staff" | "all";
  hasVoted: boolean | "all";
  registrationDate: "today" | "week" | "month" | "all";
}

interface EnhancedVoter extends ElectionVoter {
  verification?: UserVerification;
}

export default function VotersPage({ electionPDA }: VotersPageProps) {
  const [voters, setVoters] = useState<EnhancedVoter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<VoterFilters>({
    status: "all",
    voterType: "all",
    hasVoted: "all",
    registrationDate: "all",
  });

  const { fetchVoterInfo, updateVoterStatus, fetchRecentVoters } = useVoter(
    new PublicKey(electionPDA)
  );
  const { fetchElection } = useElection();
  const { fetchVerification } = useUserVerification();

  const loadVoters = useCallback(async () => {
    try {
      setLoading(true);
      const election = await fetchElection(new PublicKey(electionPDA));
      if (!election) throw new Error("Election not found");

      const electionVoters = await fetchRecentVoters();
      const votersWithVerification = await Promise.all(
        electionVoters.map(async (voter) => {
          try {
            const verification = await fetchVerification(voter.voter);
            return { ...voter, verification };
          } catch (err) {
            console.error(
              `Error fetching verification for voter ${voter.voter.toString()}:`,
              err
            );
            return voter;
          }
        })
      );

      setVoters(votersWithVerification);
      setError(null);
    } catch (err) {
      console.error("Error loading election data:", err);
      setError("Failed to load election data");
    } finally {
      setLoading(false);
    }
  }, [electionPDA, fetchElection, fetchRecentVoters, fetchVerification]);

  // Handle status updates with refresh
  const handleStatusUpdate = useCallback(
    async (voter: PublicKey, newStatus: VoterStatus) => {
      try {
        await updateVoterStatus(voter, newStatus);
        await loadVoters(); // Refresh the list after update
      } catch (error) {
        console.error("Failed to update voter status:", error);
        throw error; // Let the VoterList component handle the error display
      }
    },
    [updateVoterStatus, loadVoters]
  );

  // Filter voters based on current filters
  const filteredVoters = useMemo(() => {
    return voters.filter((voter) => {
      // Status filter
      if (filters.status !== "all") {
        const statusKey = Object.keys(filters.status)[0];
        if (!voter.status[statusKey]) return false;
      }

      // Voting status filter
      if (filters.hasVoted !== "all" && voter.hasVoted !== filters.hasVoted) {
        return false;
      }

      // Voter type filter
      if (filters.voterType !== "all" && voter.verification?.userType) {
        const voterType = Object.keys(voter.verification.userType)[0];
        if (voterType !== filters.voterType) return false;
      }

      // Date filter
      if (filters.registrationDate !== "all") {
        const registrationTime = Number(voter.registrationTime);
        const now = Date.now() / 1000;
        const oneDay = 24 * 60 * 60;
        const oneWeek = 7 * oneDay;
        const oneMonth = 30 * oneDay;

        switch (filters.registrationDate) {
          case "today":
            if (now - registrationTime > oneDay) return false;
            break;
          case "week":
            if (now - registrationTime > oneWeek) return false;
            break;
          case "month":
            if (now - registrationTime > oneMonth) return false;
            break;
        }
      }

      return true;
    });
  }, [voters, filters]);

  // Initial load
  useState(() => {
    loadVoters();
  });

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading voter data..." />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Users className="h-8 w-8 text-blue-500" />
          <div>
            <h1 className="text-2xl font-bold">Voter Management</h1>
            <p className="text-gray-600">
              Manage and monitor voter registrations
            </p>
          </div>
        </div>
      </div>

      <VoterStats voters={voters} />

      <Card className="p-6">
        <VoterFilters
          filters={filters}
          onFilterChange={setFilters}
          onReset={() =>
            setFilters({
              status: "all",
              voterType: "all",
              hasVoted: "all",
              registrationDate: "all",
            })
          }
          totalCount={voters.length}
          filteredCount={filteredVoters.length}
        />

        <VoterList
          voters={filteredVoters}
          onUpdateStatus={handleStatusUpdate}
          electionPDA={new PublicKey(electionPDA)}
        />
      </Card>
    </div>
  );
}
