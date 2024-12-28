// src/components/election/voters/VoterProfile.tsx
import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Loader2, AlertCircle, Award, Vote, BarChart3 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUserVerification } from "@/hooks/useUserVerification";
import { useVoter } from "@/hooks/useVoter";
import type { UserVerification, ElectionVoter } from "@/types/vote";
import { PublicKey } from "@solana/web3.js";

const VoterProfile = ({ electionPDA }: { electionPDA?: PublicKey }) => {
  const { publicKey } = useWallet();
  const { fetchVerification } = useUserVerification();
  const { fetchVoterInfo } = useVoter(electionPDA);

  const [userVerification, setUserVerification] =
    useState<UserVerification | null>(null);
  const [voterInfo, setVoterInfo] = useState<ElectionVoter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!publicKey) {
        setLoading(false);
        return;
      }

      try {
        const [verificationData, voterData] = await Promise.all([
          fetchVerification(publicKey),
          electionPDA ? fetchVoterInfo(publicKey) : null,
        ]);

        setUserVerification(verificationData);
        if (voterData) setVoterInfo(voterData);
      } catch (err) {
        console.error("Error fetching voter details:", err);
        setError("Error fetching voter details");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [publicKey, fetchVerification, fetchVoterInfo, electionPDA]);

  // Helper function to format voter status
  const formatVoterStatus = (status: any): string => {
    const statusKey = Object.keys(status)[0];
    return statusKey.charAt(0).toUpperCase() + statusKey.slice(1);
  };

  // Helper function to get status color
  const getStatusColor = (status: any): string => {
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

  if (!publicKey) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <Alert className="bg-yellow-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please connect your wallet to view your voter profile.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading voter profile...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <Alert className="bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!userVerification) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <Alert className="bg-yellow-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your wallet is not yet verified. Please complete the verification
            process.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Voter Profile</h2>
            <p className="text-sm text-gray-500 font-mono">
              {publicKey.toString()}
            </p>
          </div>
          {voterInfo && (
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                voterInfo.status
              )}`}
            >
              {formatVoterStatus(voterInfo.status)}
            </span>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Verification Date</p>
              <p className="text-xl font-semibold">
                {new Date(
                  userVerification.verificationTime * 1000
                ).toLocaleDateString()}
              </p>
            </div>
            <Award className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">User Type</p>
              <p className="text-xl font-semibold">
                {Object.keys(userVerification.userType)[0].toUpperCase()}
              </p>
            </div>
            <Vote className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Verification Status</p>
              <p className="text-xl font-semibold">
                {userVerification.isVerified ? "Verified" : "Unverified"}
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Election-specific Information */}
      {voterInfo && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
            Current Election Status
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Registration Time</p>
              <p className="font-medium">
                {new Date(voterInfo.registrationTime * 1000).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Eligibility</p>
              <p className="font-medium">
                {voterInfo.isEligible ? "Eligible" : "Not Eligible"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Voting Status</p>
              <p className="font-medium">
                {voterInfo.hasVoted ? "Has Voted" : "Not Voted"}
              </p>
            </div>

            {!voterInfo.isEligible && (
              <Alert className="bg-yellow-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your voting privileges for this election are currently
                  restricted. Please contact the election administrator for more
                  information.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VoterProfile;