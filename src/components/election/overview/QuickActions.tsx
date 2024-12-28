import React from "react";
import { useRouter } from "next/navigation";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  UserPlus,
  FileDown,
  Settings,
  Vote as VoteIcon,
  Power,
  Share2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { useElection } from "@/hooks/useElection";
import { useVoter } from "@/hooks/useVoter";
import { Election } from "@/types/vote";

interface ActionButton {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
}

const QuickActions = ({ electionPDA }: { electionPDA: string }) => {
  const router = useRouter();
  const { publicKey } = useWallet();
  const { fetchElection, endElection } = useElection();
  const { fetchVoterInfo } = useVoter(new PublicKey(electionPDA));

  const [election, setElection] = React.useState<Election | null>(null);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [isVoter, setIsVoter] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  // Load election and user data
  React.useEffect(() => {
    const loadData = async () => {
      if (!publicKey || !electionPDA) return;

      try {
        const electionData = await fetchElection(new PublicKey(electionPDA));
        if (!electionData) return;

        setElection(electionData);
        setIsAdmin(electionData.authority.toString() === publicKey.toString());

        const voterInfo = await fetchVoterInfo(publicKey);
        setIsVoter(!!voterInfo);
      } catch (error) {
        console.error("Error loading election data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [publicKey, electionPDA, fetchElection, fetchVoterInfo]);

  const handleEndElection = async () => {
    if (!election || !isAdmin) return;

    try {
      await endElection();
      // Refresh election data after ending
      const updated = await fetchElection(new PublicKey(electionPDA));
      setElection(updated);
    } catch (error) {
      console.error("Error ending election:", error);
    }
  };

  const handleExportResults = () => {
    // TODO: Implement results export
    console.log("Exporting results...");
  };

  const handleShareElection = () => {
    if (typeof window !== "undefined") {
      const url = window.location.href;
      navigator.clipboard.writeText(url);
      // TODO: Add toast notification
    }
  };

  // Define actions based on user role and election status
  const getActions = (): ActionButton[] => {
    if (!election) return [];

    const isActive = "active" in election.status;
    const isEnded = "ended" in election.status;

    if (isAdmin) {
      return [
        {
          icon: <UserPlus size={20} />,
          label: "Manage Voters",
          description: "Review and approve voter registrations",
          onClick: () => router.push(`/election/${electionPDA}/voters`),
          disabled: isEnded,
        },
        {
          icon: <FileDown size={20} />,
          label: "Export Results",
          description: "Download election data and results",
          onClick: handleExportResults,
          disabled: !isEnded,
        },
        {
          icon: <Settings size={20} />,
          label: "Settings",
          description: "Configure election parameters",
          onClick: () => router.push(`/election/${electionPDA}/settings`),
          disabled: isEnded,
        },
        {
          icon: <Power size={20} />,
          label: "End Election",
          description: "Close voting and finalize results",
          onClick: handleEndElection,
          disabled: !isActive || isEnded,
        },
      ];
    }

    // Regular user actions
    const baseActions = [
      {
        icon: <VoteIcon size={20} />,
        label: isVoter ? "Vote Now" : "Register to Vote",
        description: isVoter
          ? "Cast your vote in this election"
          : "Sign up to participate",
        onClick: () =>
          router.push(
            `/election/${electionPDA}/${isVoter ? "vote" : "register"}`
          ),
        disabled: !isActive || (isVoter && election.hasVoted),
      },
      {
        icon: <FileDown size={20} />,
        label: "View Results",
        description: "See current election standings",
        onClick: () => router.push(`/election/${electionPDA}/results`),
        disabled: !isEnded,
      },
      {
        icon: <Share2 size={20} />,
        label: "Share Election",
        description: "Copy election link to clipboard",
        onClick: handleShareElection,
      },
    ];

    return baseActions;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 bg-gray-100 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </Card>
    );
  }

  const actions = getActions();

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
      <div className="space-y-3">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            disabled={action.disabled}
            className="w-full flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="p-2 bg-blue-50 rounded-lg text-blue-500">
              {action.icon}
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-medium text-gray-900">{action.label}</h3>
              <p className="text-sm text-gray-500">{action.description}</p>
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
};

export default QuickActions;
