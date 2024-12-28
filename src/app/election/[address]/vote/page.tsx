// src/app/election/[address]/vote/page.tsx
"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { useElection } from "@/hooks/useElection";
import { useVoter } from "@/hooks/useVoter";
import ErrorBoundary from "@/components/ui/errorBoundary";
import LoadingSpinner from "@/components/ui/loadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Check, AlertCircle, UserPlus, ExternalLink } from "lucide-react";
import CastVote from "@/components/election/castVote";

export default function VotePage() {
  const { address } = useParams();
  const router = useRouter();
  const { publicKey } = useWallet();
  const { fetchElection } = useElection();

  // Convert address string to PublicKey
  let electionPDA: PublicKey | null = null;
  try {
    electionPDA = new PublicKey(address);
  } catch (error) {
    console.error("Invalid election address:", error);
  }

  // Set up voter hook with the election PDA
  const { fetchVoterInfo } = useVoter(electionPDA || undefined);

  // Fetch election data
  const { data: election, isLoading: isLoadingElection } = useQuery({
    queryKey: ["election", address],
    queryFn: async () => {
      if (!electionPDA) return null;
      return fetchElection(electionPDA);
    },
    enabled: !!electionPDA,
  });

  // Fetch voter registration status
  const { data: voterInfo, isLoading: isLoadingVoter } = useQuery({
    queryKey: ["voterInfo", address, publicKey?.toString()],
    queryFn: async () => {
      if (!publicKey || !electionPDA) return null;
      return fetchVoterInfo(publicKey);
    },
    enabled: !!publicKey && !!electionPDA,
  });

  const isLoading = isLoadingElection || isLoadingVoter;

  const handleVoteSuccess = () => {
    // Show success message and redirect after a short delay
    setTimeout(() => {
      router.push(`/election/${address}`);
    }, 2000);
  };

  if (!electionPDA) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Invalid election address</AlertDescription>
      </Alert>
    );
  }

  // Determine if the voter can vote
  const canVote =
    voterInfo?.isEligible && voterInfo?.status?.active && !voterInfo?.hasVoted;

  const getVoterStatusMessage = () => {
    if (!voterInfo) {
      return {
        title: "Not Registered",
        description: "You need to register for this election before voting.",
        action: {
          type: "register",
          link: `/election/${address}/register`,
          text: "Register for Election",
        },
      };
    }
    if (!voterInfo.isEligible) {
      return {
        title: "Not Eligible",
        description: "You are not eligible to vote in this election.",
        action: null,
      };
    }
    if (voterInfo.hasVoted) {
      return {
        title: "Already Voted",
        description:
          "Thank you for participating! You can monitor the election results.",
        action: {
          type: "monitor",
          link: `/election/${address}`,
          text: "View Election Results",
        },
      };
    }
    if (!voterInfo.status?.active) {
      return {
        title: "Account Not Active",
        description: "Your voter account is not in active status.",
        action: null,
      };
    }
    return null;
  };

  const renderActionButton = (
    action: { type: string; link: string; text: string } | null
  ) => {
    if (!action) return null;

    const icon =
      action.type === "register" ? (
        <UserPlus size={16} />
      ) : (
        <ExternalLink size={16} />
      );

    return (
      <Link href={action.link} className="inline-block">
        <Button className="gap-2">
          {icon}
          {action.text}
        </Button>
      </Link>
    );
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Check className="h-8 w-8 text-green-600" />
                <div>
                  <h1 className="text-2xl font-bold">Cast Your Vote</h1>
                  {election && <p className="text-gray-600">{election.name}</p>}
                </div>
              </div>
              {publicKey && (
                <div className="text-sm text-gray-500">
                  Connected: {publicKey.toString().slice(0, 4)}...
                  {publicKey.toString().slice(-4)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-6">
            {!publicKey ? (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
                    <h2 className="text-xl font-semibold mb-2">
                      Connect Your Wallet
                    </h2>
                    <p className="text-gray-600">
                      Please connect your wallet to participate in elections.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : isLoading ? (
              <Card>
                <CardContent className="py-8">
                  <LoadingSpinner size="lg" message="Loading..." />
                </CardContent>
              </Card>
            ) : !canVote ? (
              <Card>
                <CardContent className="py-8">
                  {(() => {
                    const status = getVoterStatusMessage();
                    if (!status) return null;

                    return (
                      <div className="text-center">
                        <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
                        <h2 className="text-xl font-semibold mb-2">
                          {status.title}
                        </h2>
                        <p className="text-gray-600 mb-6">
                          {status.description}
                        </p>
                        {renderActionButton(status.action)}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Cast Your Vote</CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-6">
                    <AlertDescription>
                      Review your choices carefully before submitting your vote.
                    </AlertDescription>
                  </Alert>

                  <Suspense
                    fallback={<LoadingSpinner size="lg" message="Loading..." />}
                  >
                    <CastVote
                      electionPDA={electionPDA}
                      onVoteSuccess={handleVoteSuccess}
                    />
                  </Suspense>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
