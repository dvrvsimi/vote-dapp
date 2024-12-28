// src/app/page.tsx
"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/ui/loadingSpinner";
import { useEffect, useState } from "react";
import { useUserVerification } from "@/hooks/useUserVerification";

export default function HomePage() {
  const router = useRouter();
  const { publicKey } = useWallet();

  const { fetchVerification } = useUserVerification();
  const [isChecking, setIsChecking] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      if (!publicKey) {
        setIsChecking(false);
        return;
      }

      try {
        const status = await fetchVerification(publicKey);
        setIsVerified(status?.isVerified ?? false);
      } catch (error) {
        console.error("Error checking verification:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkStatus();
  }, [publicKey, fetchVerification]);

  if (isChecking) {
    return (
      <LoadingSpinner size="lg" message="Checking verification status..." />
    );
  }

  if (!publicKey) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please connect your wallet to access voter verification.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Voter verification</h1>

        <div className="grid gap-6">
          {isVerified ? (
            <Card>
              <CardContent className="py-6">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-green-100 rounded-full">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">
                      Already Verified
                    </h2>
                    <p className="text-gray-600">
                      You are verified as a voter in the system.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div onClick={() => router.push("/verify")}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <AlertCircle className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold">
                          Verify as Voter
                        </h2>
                        <p className="text-gray-600">
                          Complete your one-time voter verification
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Recent Elections</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                View and register for available elections.
              </p>
              {/* We can add a list of available elections here */}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
