// src/components/election/monitoring/participation/ParticipationTimeline.tsx
import { useState, useEffect } from "react";
import { PublicKey } from "@solana/web3.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useVoter } from "@/hooks/useVoter";
import { AlertCircle } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export default function ParticipationTimeline({
  electionPDA,
}: {
  electionPDA: string;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timelineData, setTimelineData] = useState<any[]>([]);

  const { fetchRecentVoters } = useVoter(new PublicKey(electionPDA));

  const loadTimelineData = async () => {
    try {
      setLoading(true);
      const voters = await fetchRecentVoters();

      // Group registrations and votes by hour
      const timelineMap = new Map();

      voters.forEach((voter) => {
        const registrationHour =
          Math.floor(Number(voter.registrationTime) / 3600) * 3600;
        const key = registrationHour * 1000; // Convert to milliseconds for date

        if (!timelineMap.has(key)) {
          timelineMap.set(key, { registrations: 0, votes: 0 });
        }

        const data = timelineMap.get(key);
        data.registrations++;

        if (voter.hasVoted) {
          data.votes++;
        }
      });

      // Convert map to array and sort by time
      const timelineArray = Array.from(timelineMap.entries())
        .map(([timestamp, data]) => ({
          time: new Date(Number(timestamp)),
          ...data,
        }))
        .sort((a, b) => a.time.getTime() - b.time.getTime());

      // Calculate cumulative totals
      let cumulativeRegistrations = 0;
      let cumulativeVotes = 0;

      const finalData = timelineArray.map((point) => {
        cumulativeRegistrations += point.registrations;
        cumulativeVotes += point.votes;
        return {
          time: point.time,
          registrations: point.registrations,
          votes: point.votes,
          totalRegistrations: cumulativeRegistrations,
          totalVotes: cumulativeVotes,
          participationRate: (
            (cumulativeVotes / cumulativeRegistrations) *
            100
          ).toFixed(1),
        };
      });

      setTimelineData(finalData);
      setError(null);
    } catch (err) {
      console.error("Error loading timeline data:", err);
      setError("Failed to load participation timeline");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimelineData();
    const interval = setInterval(loadTimelineData, 30000);
    return () => clearInterval(interval);
  }, [electionPDA]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Participation Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                tickFormatter={(time) => new Date(time).toLocaleTimeString()}
              />
              <YAxis yAxisId="left" orientation="left" />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                labelFormatter={(label) => new Date(label).toLocaleString()}
                formatter={(value, name) => {
                  if (name === "participationRate")
                    return [`${value}%`, "Participation Rate"];
                  return [value, name];
                }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="totalRegistrations"
                stroke="#3b82f6"
                name="Total Registrations"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="totalVotes"
                stroke="#22c55e"
                name="Total Votes"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="participationRate"
                stroke="#8b5cf6"
                name="Participation Rate"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
