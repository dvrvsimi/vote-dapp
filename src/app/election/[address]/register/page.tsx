// src/app/election/[address]/register/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, Check } from "lucide-react";
import LoadingSpinner from "@/components/ui/loadingSpinner";
import { useElection } from "@/hooks/useElection";
import { useVoter } from "@/hooks/useVoter";
import { useUserVerification } from "@/hooks/useUserVerification";
import {
  Election,
  ElectionVoter,
  VoterStatus,
  UserType,
  UserVerification,
} from "@/types/vote";
import { RegistrationRequirements } from "@/components/election/registration/RegistrationRequirements";

const formatVoterStatus = (status: VoterStatus): string => {
  if ("pending" in status) return "Pending";
  if ("active" in status) return "Active";
  if ("suspended" in status) return "Suspended";
  if ("revoked" in status) return "Revoked";
  if ("onHold" in status) return "On Hold";
  return "Unknown";
};

const VoterDetailsSection = ({ voterInfo }: { voterInfo: ElectionVoter }) => {
  if (!voterInfo) return null;

  return (
    <div className="mt-4 space-y-2">
      <h3 className="text-lg font-medium">Your Voter Details</h3>
      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="text-sm text-gray-500">Status</p>
          <p className="font-medium">{formatVoterStatus(voterInfo.status)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Registration Time</p>
          <p className="font-medium">
            {new Date(voterInfo.registrationTime * 1000).toLocaleDateString()}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Eligibility</p>
          <div className="flex items-center">
            {voterInfo.isEligible ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-600">Eligible</span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-red-500 mr-1" />
                <span className="text-red-600">Not Eligible</span>
              </>
            )}
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-500">Has Voted</p>
          <div className="flex items-center">
            {voterInfo.hasVoted ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-600">Yes</span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-gray-500 mr-1" />
                <span className="text-gray-600">No</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const formatUserType = (type: UserType): string => {
  if ("student" in type) return "Student";
  if ("staff" in type) return "Staff";
  return "Unknown";
};

const ElectionDetailsSection = ({
  election,
}: {
  election: Election | null;
}) => {
  if (!election) return null;

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="font-medium mb-2">Election Details</h3>
      <div className="space-y-2 text-sm">
        <p>
          <span className="text-gray-600">Name:</span> {election.name}
        </p>
        <p>
          <span className="text-gray-600">Status:</span>{" "}
          <span className="capitalize">
            {election.status.created
              ? "Created"
              : election.status.active
              ? "Active"
              : election.status.ended
              ? "Ended"
              : "Unknown"}
          </span>
        </p>
        <p>
          <span className="text-gray-600">Start Time:</span>{" "}
          {new Date(election.startTime * 1000).toLocaleDateString()}
        </p>
        <p>
          <span className="text-gray-600">End Time:</span>{" "}
          {election.endTime
            ? new Date(election.endTime * 1000).toLocaleDateString()
            : "TBD"}
        </p>
        <p>
          <span className="text-gray-600">Total Voters:</span>{" "}
          {election.totalVoters}
        </p>
        <p>
          <span className="text-gray-600">Allowed Voter Types:</span>{" "}
          {election.allowedVoterTypes.map(formatUserType).join(", ")}
        </p>
      </div>
    </div>
  );
};

export default function ElectionRegistrationPage() {
  const params = useParams();
  const router = useRouter();
  const { publicKey } = useWallet();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [election, setElection] = useState<Election | null>(null);
  const [voterInfo, setVoterInfo] = useState<ElectionVoter | null>(null);
  const [verificationInfo, setVerificationInfo] =
    useState<UserVerification | null>(null);

  const electionPDA = new PublicKey(params.address as string);

  const { fetchElection } = useElection();
  const {
    registerVoter,
    fetchVoterInfo,
    isLoading: isVoterLoading,
  } = useVoter(electionPDA);
  const { fetchVerification } = useUserVerification();

  useEffect(() => {
    const loadElectionData = async () => {
      try {
        const electionData = await fetchElection(electionPDA);
        setElection(electionData);

        if (publicKey) {
          const [voterInfoData, verificationInfo] = await Promise.all([
            fetchVoterInfo(publicKey),
            fetchVerification(publicKey),
          ]);

          setVoterInfo(voterInfoData);
          setVerificationInfo(verificationInfo); // Store verification info in state

          if (!verificationInfo?.isVerified) {
            setError("You must be verified to register for this election");
          }
        }
      } catch (error) {
        console.error("Error loading election data:", error);
        setError("Failed to load election data");
      } finally {
        setLoading(false);
      }
    };

    loadElectionData();
  }, [
    publicKey,
    electionPDA,
    fetchElection,
    fetchVoterInfo,
    fetchVerification,
  ]);

  const handleRegistration = async () => {
    if (!publicKey || !electionPDA) return;

    try {
      await registerVoter();
      router.push(`/election/${electionPDA.toString()}?registered=true`);
    } catch (error: any) {
      console.error("Registration error:", error);
      setError(error.message || "Failed to register for election");
    }
  };

  const renderRegistrationButton = () => {
    if (!publicKey) return null;

    const isDisabled = isVoterLoading || !verificationInfo?.isVerified;

    return (
      <button
        onClick={handleRegistration}
        disabled={isDisabled}
        className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
          disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors
          flex items-center justify-center"
      >
        {isVoterLoading ? (
          <>
            <LoadingSpinner size="sm" className="mr-2" />
            Registering...
          </>
        ) : !verificationInfo?.isVerified ? (
          "Verification Required to Register"
        ) : (
          "Register for Election"
        )}
      </button>
    );
  };

  if (loading) {
    return (
      <LoadingSpinner size="lg" message="Loading election information..." />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>

        <Card>
          <CardHeader>
            <CardTitle>Election Registration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Messages Section */}
            {publicKey && (
              <>
                {error && (
                  <Alert className="bg-red-50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {error}
                      {error ===
                        "You must be verified to register for this election" && (
                        <span className="ml-2">
                          <button
                            onClick={() => router.push("/verify")}
                            className="text-blue-600 hover:underline"
                          >
                            Verify now
                          </button>
                        </span>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
                {voterInfo && (
                  <div className="flex items-center p-4 bg-green-50 rounded-lg">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <p>You are already registered for this election.</p>
                  </div>
                )}
              </>
            )}

            {/* Election Details */}
            <ElectionDetailsSection election={election} />

            {/* Conditional Content */}
            {!publicKey ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please connect your wallet to register for this election.
                </AlertDescription>
              </Alert>
            ) : voterInfo ? (
              <VoterDetailsSection voterInfo={voterInfo} />
            ) : (
              <>
                <RegistrationRequirements />

                {renderRegistrationButton()}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
