import React from "react";
import { PublicKey } from "@solana/web3.js";
import { Clock, Vote, UserCheck, Flag, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useElection } from "@/hooks/useElection";
import { useVoter } from "@/hooks/useVoter";
import { useBallot } from "@/hooks/useBallot";
import { ElectionVoter, Ballot, Election } from "@/types/vote";

interface ActivityItem {
  id: string;
  type: "voter_registered" | "vote_cast" | "status_change" | "election_ended";
  message: string;
  timestamp: number;
  data?: any;
}

const RecentActivity = ({ electionPDA }: { electionPDA: string }) => {
  const [loading, setLoading] = React.useState(true);
  const [activities, setActivities] = React.useState<ActivityItem[]>([]);

  const { fetchElection } = useElection();
  const { fetchVoterInfo } = useVoter(new PublicKey(electionPDA));
  const { fetchBallot } = useBallot(new PublicKey(electionPDA));

  const fetchActivities = React.useCallback(async () => {
    if (!electionPDA) return;

    try {
      setLoading(true);
      const election = await fetchElection(new PublicKey(electionPDA));
      if (!election) return;

      const activityItems: ActivityItem[] = [];

      // Add election creation
      activityItems.push({
        id: `election-created-${election.startTime}`,
        type: "status_change",
        message: "Election created and opened for registration",
        timestamp: election.startTime,
      });

      // Add end time if election has ended
      if (election.endTime) {
        activityItems.push({
          id: `election-ended-${election.endTime}`,
          type: "election_ended",
          message: "Election has ended",
          timestamp: Number(election.endTime),
        });
      }

      // Sort activities by timestamp (most recent first)
      activityItems.sort((a, b) => b.timestamp - a.timestamp);

      // Take only the last 5 activities
      setActivities(activityItems.slice(0, 5));
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  }, [electionPDA, fetchElection]);

  React.useEffect(() => {
    fetchActivities();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, [fetchActivities]);

  const getIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "voter_registered":
        return <UserCheck className="text-green-500" size={20} />;
      case "vote_cast":
        return <Vote className="text-blue-500" size={20} />;
      case "status_change":
        return <Clock className="text-orange-500" size={20} />;
      case "election_ended":
        return <Flag className="text-purple-500" size={20} />;
      default:
        return <AlertCircle className="text-gray-500" size={20} />;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return "Just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start space-x-4 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
      </div>
      <div className="space-y-4">
        {activities.length > 0 ? (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-4">
              <div className="mt-1">{getIcon(activity.type)}</div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">{activity.message}</p>
                <div className="flex items-center mt-1">
                  <Clock size={12} className="text-gray-400 mr-1" />
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(activity.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            No recent activity to display
          </p>
        )}
      </div>
    </Card>
  );
};

export default RecentActivity;
