"use client";
import React, { useState, useCallback, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, ShieldCheck } from "lucide-react";
import LoadingSpinner from "@/components/ui/loadingSpinner";
import { useUserVerification } from "@/hooks/useUserVerification";

const AGREEMENTS = [
  {
    id: "rules",
    title: "Election Rules",
    content:
      "I agree to follow all election rules and guidelines, including voting limitations and ethical conduct requirements.",
  },
  {
    id: "responsibility",
    title: "Voter Responsibility",
    content:
      "I understand my responsibility to cast informed votes and maintain the integrity of the election process.",
  },
  {
    id: "privacy",
    title: "Privacy Policy",
    content:
      "I acknowledge that my voting records will be stored on the blockchain while maintaining my privacy in accordance with the system's design.",
  },
];

const VerificationForm = () => {
  const router = useRouter();
  const { publicKey } = useWallet();
  const {
    verifyUser,
    isLoading: isVerifying,
    fetchVerification,
  } = useUserVerification();
  const [isVerified, setIsVerified] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [agreements, setAgreements] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const handleAgreementChange = (id: string) => {
    setAgreements((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const allAgreementsAccepted = AGREEMENTS.every(({ id }) => agreements[id]);

  useEffect(() => {
    setIsInitialized(true);
    const checkVerification = async () => {
      if (!publicKey) return;
      const verification = await fetchVerification(publicKey);
      setIsVerified(verification?.isVerified ?? false);
    };

    checkVerification();
  }, [publicKey, fetchVerification]);

  const handleVerification = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!publicKey || !allAgreementsAccepted) return;

      setError(null);
      try {
        await verifyUser("170404021", { student: {} });
        router.push("/verify?isVerified=true");
      } catch (err: any) {
        console.error("Verification error:", err);
        if (err.toString().includes("already in use")) {
          setError("This wallet is already verified!");
        } else if (
          err.toString().includes("Attempt to debit an account but found no record of a prior credit")
        ) {
          setError(
            "This wallet is new, has a zero balance, and needs funding to carry out transactions."
          );
        } else {
          setError(
            err instanceof Error ? err.message : "Failed to verify user"
          );
        }
      }
    },
    [publicKey, allAgreementsAccepted, verifyUser, router]
  );

  if (!publicKey) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert className="bg-slate-800 border border-purple-500 text-white shadow-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please connect your wallet to continue with verification.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert className="bg-green-800 border border-green-400 text-white shadow-lg">
          <ShieldCheck className="h-4 w-4 text-green-300" />
          <AlertDescription>
            This wallet is already verified. You can proceed to register for elections.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center text-white hover:text-purple-300 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </button>

      <Card className="mb-6 bg-slate-800 border border-purple-500/50 shadow-xl">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <ShieldCheck className="h-6 w-6 text-purple-400" />
            <CardTitle className="text-2xl font-bold text-white">
              User Verification
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerification} className="space-y-6">
            {/* Wallet Information */}
            <div className="bg-slate-900 border border-purple-500/30 p-4 rounded-lg">
              <h3 className="font-medium mb-2 text-white">Connected Wallet</h3>
              <code className="text-sm bg-slate-950 px-3 py-2 rounded-lg block text-purple-300 break-all font-mono">
                {publicKey.toString()}
              </code>
            </div>

            {/* Agreements */}
            <div className="space-y-6">
              {AGREEMENTS.map(({ id, title, content }) => (
                <div key={id} className="bg-white rounded-lg p-4 space-y-3">
                  <div className="flex items-start space-x-3 group">
                    <div className="relative mt-1">
                      <input
                        type="checkbox"
                        id={id}
                        checked={agreements[id] || false}
                        onChange={() => handleAgreementChange(id)}
                        className="appearance-none w-4 h-4 border-2 border-purple-400 rounded 
                                 checked:bg-purple-500 checked:border-purple-500 
                                 transition-colors cursor-pointer"
                      />
                      <CheckIcon className="h-3 w-3 text-white absolute left-0.5 top-0.5 pointer-events-none 
                                         opacity-0 check-icon transition-opacity" />
                    </div>
                    <div className="flex-1">
                      <label htmlFor={id} className="text-lg font-semibold block text-purple-600 cursor-pointer hover:text-purple-700 transition-colors">
                        {title}
                      </label>
                      <p className="text-sm text-black mt-2 leading-relaxed">{content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Error Display */}
            {error && (
              <Alert className="bg-red-900 border border-red-400 shadow-lg">
                <AlertCircle className="h-4 w-4 text-red-300" />
                <AlertDescription className="text-white">{error}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!allAgreementsAccepted || isVerifying}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-purple-400 text-white rounded-lg
                         hover:from-purple-500 hover:to-purple-300 disabled:from-gray-700 disabled:to-gray-600
                         disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]
                         disabled:hover:scale-100 font-medium shadow-lg disabled:text-gray-300"
            >
              {isVerifying ? (
                <div className="flex items-center justify-center">
                  <LoadingSpinner size="sm" className="mr-2" />
                  <span>Verifying...</span>
                </div>
              ) : (
                "Verify User"
              )}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// Custom CheckIcon component for checkboxes
const CheckIcon = ({ className = "" }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={3}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M5 13l4 4L19 7"
    />
  </svg>
);

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <VerificationForm />
      </div>
    </div>
  );
}