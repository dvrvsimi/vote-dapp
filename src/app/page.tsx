// src/app/page.tsx
"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, ArrowRight, Vote } from "lucide-react";
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
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-black">
        <LoadingSpinner size="lg" message="Checking verification status..." />
      </div>
    );
  }

  if (!publicKey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-black">
        <div className="container mx-auto px-4 py-16">
          <Alert className="bg-purple-900/50 border border-purple-500/50 backdrop-blur-sm text-white">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please connect your wallet to access voter verification.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-black">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-3 mb-12">
            <Vote className="h-8 w-8 text-purple-400" />
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Voter Verification
            </h1>
          </div>

          <div className="grid gap-8">
            {isVerified ? (
              <Card className="bg-purple-900/20 border border-purple-500/20 backdrop-blur-sm">
                <CardContent className="py-8">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-green-400/10 rounded-xl border border-green-400/20">
                      <CheckCircle className="h-8 w-8 text-green-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white mb-1">
                        Verification Complete
                      </h2>
                      <p className="text-purple-200/70">
                        Your wallet is verified for participation in the voting system.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div onClick={() => router.push("/verify")}>
                <Card className="bg-white/90 border border-purple-500/20 backdrop-blur-sm hover:bg-purple-800/90 
                               transition-all duration-300 cursor-pointer group hover:scale-[1.02] hover:shadow-xl 
                               hover:border-purple-500/40 hover:shadow-purple-500/20">
                  <CardContent className="py-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-blue-400/10 rounded-xl border border-blue-400/20 
                                      group-hover:scale-110 group-hover:rotate-6 transition-all duration-300
                                      group-hover:bg-blue-400/20 group-hover:border-blue-400/40">
                          <AlertCircle className="h-8 w-8 text-blue-400 group-hover:text-blue-300" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-black group-hover:text-white transition-colors duration-300 mb-1
                                       transform group-hover:translate-x-2">
                            Start Verification
                          </h2>
                          <p className="text-black group-hover:text-purple-200 transition-all duration-300
                                      transform group-hover:translate-x-2">
                            Complete your one-time wallet verification process
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="h-6 w-6 text-purple-400 group-hover:translate-x-2 group-hover:text-white 
                                           transition-all duration-300 group-hover:scale-110" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <Card className="bg-white/90 border border-purple-500/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  Active Elections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-black">
                  Explore and participate in ongoing elections.
                </p>
                <div className="mt-4 p-8 border border-dashed border-purple-500/20 rounded-lg text-center text-purple-500">
                  No active elections at the moment
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}