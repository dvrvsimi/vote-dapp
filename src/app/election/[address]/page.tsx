// src/app/election/[address]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { Suspense } from "react";
import { PublicKey } from "@solana/web3.js";
import ErrorBoundary from "@/components/ui/errorBoundary";
import LoadingSpinner from "@/components/ui/loadingSpinner";
import ElectionLayout from "@/components/election/layout";
import { NavigationPath } from "@/components/layout/sideBar";

export default function ElectionManagementPage() {
  const params = useParams();
  const electionPDA = params.address as string;

  // Validate the PDA
  let validPDA: PublicKey;
  try {
    validPDA = new PublicKey(electionPDA);
  } catch (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">
            Invalid Election Address
          </h1>
          <p className="text-gray-600 mt-2">
            The provided election address is not valid.
          </p>
        </div>
      </div>
    );
  }

  const handlePathChange = (path: NavigationPath) => {
    // You can add additional logic here if needed
    console.log("Navigation changed to:", path);
  };

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner size="lg" message="Loading..." />}>
        <ElectionLayout
          electionPDA={validPDA.toString()}
          onPathChange={handlePathChange}
        />
      </Suspense>
    </ErrorBoundary>
  );
}
