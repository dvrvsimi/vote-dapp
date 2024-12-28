"use client";

import { useState, ReactNode, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import React from "react";
import Monitoring from "./monitoring/page";
import Results from "./results/Page";
import Voters from "./voters/page";
import SideNavigation, { NavigationPath } from "../layout/sideBar";
import OverviewPage from "./overview";
import Settings from "./settings/page";
import { useElection } from "@/hooks/useElection";
import { PublicKey } from "@solana/web3.js";
import { Card, CardContent } from "../ui/card";

interface ElectionLayoutProps {
  children?: ReactNode;
  onPathChange?: (path: NavigationPath) => void;
  electionPDA: string;
}

const ClientElectionLayout = ({
  children,
  onPathChange,
  electionPDA,
}: ElectionLayoutProps) => {
  const electionPDAKey = new PublicKey(electionPDA);
  const initialPath = `/election/${electionPDA}/overview` as NavigationPath;

  const [currentPath, setCurrentPath] = useState<NavigationPath>(initialPath);
  const { publicKey } = useWallet();
  const { fetchElection } = useElection();
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    const checkCreator = async () => {
      if (!publicKey || !electionPDA) return;

      try {
        const election = await fetchElection(new PublicKey(electionPDA));
        console.log("election public key", election);
        console.log("user public key", publicKey);
        setIsCreator(election?.authority.toString() === publicKey.toString());
      } catch (error) {
        console.error("Error checking election creator:", error);
        setIsCreator(false);
      }
    };

    checkCreator();
  }, [publicKey, electionPDA, fetchElection]);

  const handleNavigation = (path: NavigationPath) => {
    setCurrentPath(path);
    if (onPathChange) {
      onPathChange(path);
    }
  };

  const renderContent = () => {
    const fullPath = currentPath as string;
    const section = fullPath.split("/").pop();

    switch (section) {
      case "overview":
        return <OverviewPage electionPDA={electionPDA} />;
      case "voters":
        if (!isCreator) {
          return (
            <div className="min-h-[50vh] flex items-center justify-center">
              <Card className="w-full max-w-lg">
                <CardContent className="pt-6">
                  <div className="text-center p-6">
                    <h2 className="text-xl font-semibold text-red-600">
                      Access Denied
                    </h2>
                    <p className="text-gray-600 mt-2">
                      Only the election creator can access voter management.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        }
        return <Voters electionPDA={electionPDA} />;
      case "results":
        return <Results electionPDA={electionPDA} />;
      case "monitoring":
        return <Monitoring electionPDA={electionPDA} />;
      case "settings":
        return <Settings electionPDA={electionPDA} />;
      default:
        return <OverviewPage electionPDA={electionPDA} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-[calc(100vh-4rem)]">
        <SideNavigation
          currentPath={currentPath}
          onNavigate={handleNavigation}
          electionPDA={electionPDAKey}
          isCreator={isCreator}
        />
        <main className="flex-1 overflow-auto p-6">{renderContent()}</main>
      </div>
    </div>
  );
};

export default dynamic(() => Promise.resolve(ClientElectionLayout), {
  ssr: false,
});
