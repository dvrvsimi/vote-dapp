// src/app/verify/page.tsx
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
          err
            .toString()
            .includes(
              " Attempt to debit an account but found no record of a prior credit"
            )
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
        <Alert>
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
        <Alert className="bg-green-50">
          <ShieldCheck className="h-4 w-4 text-green-500" />
          <AlertDescription>
            This wallet is already verified. You can proceed to register for
            elections.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </button>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <ShieldCheck className="h-6 w-6 text-blue-500" />
            <CardTitle>User Verification</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerification} className="space-y-6">
            {/* Wallet Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Connected Wallet</h3>
              <code className="text-sm bg-white px-2 py-1 rounded break-all">
                {publicKey.toString()}
              </code>
            </div>

            {/* Agreements */}
            <div className="space-y-4">
              {AGREEMENTS.map(({ id, title, content }) => (
                <div key={id} className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id={id}
                    checked={agreements[id] || false}
                    onChange={() => handleAgreementChange(id)}
                    className="mt-1"
                  />
                  <div>
                    <label htmlFor={id} className="text-sm font-medium block">
                      {title}
                    </label>
                    <p className="text-sm text-gray-600 mt-1">{content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Error Display */}
            {error && (
              <Alert className="bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!allAgreementsAccepted || isVerifying}
              className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
               disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors
               flex items-center justify-center"
            >
              {isVerifying ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Verifying...
                </>
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

export default function VerifyPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <VerificationForm />
    </div>
  );
}
