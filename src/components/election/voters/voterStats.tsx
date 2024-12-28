// src/components/election/voters/voterStats.tsx
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Users, UserCheck, UserX, Vote } from "lucide-react";
import { ElectionVoter } from "@/types/vote";

interface VoterStatsProps {
  voters: ElectionVoter[];
}

export function VoterStats({ voters }: VoterStatsProps) {
  // Calculate key statistics
  const stats = useMemo(() => {
    const total = voters.length;
    const active = voters.filter((v) => "active" in v.status).length;
    const suspended = voters.filter((v) => "suspended" in v.status).length;
    const voted = voters.filter((v) => v.hasVoted).length;
    const eligible = voters.filter((v) => v.isEligible).length;

    return {
      total,
      active,
      suspended,
      voted,
      eligible,
      participationRate: total ? ((voted / total) * 100).toFixed(1) : "0",
      eligibilityRate: total ? ((eligible / total) * 100).toFixed(1) : "0",
    };
  }, [voters]);

  // Prepare registration trend data
  const registrationTrends = useMemo(() => {
    const trends = voters.reduce((acc: Record<string, number>, voter) => {
      const date = new Date(Number(voter.registrationTime) * 1000)
        .toISOString()
        .split("T")[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(trends)
      .map(([date, count]) => ({
        date,
        registrations: count,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [voters]);

  // Prepare voter status distribution data
  const statusDistribution = useMemo(() => {
    const distribution = voters.reduce((acc: Record<string, number>, voter) => {
      const status = Object.keys(voter.status)[0];
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(distribution).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
    }));
  }, [voters]);

  // Colors for pie chart
  const COLORS = ["#3b82f6", "#22c55e", "#ef4444", "#f59e0b", "#8b5cf6"];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Voters"
          value={stats.total}
          icon={Users}
          description="Total registered voters"
        />
        <StatCard
          title="Active Voters"
          value={stats.active}
          icon={UserCheck}
          description={`${stats.eligibilityRate}% eligible`}
        />
        <StatCard
          title="Votes Cast"
          value={stats.voted}
          icon={Vote}
          description={`${stats.participationRate}% participation`}
        />
        <StatCard
          title="Suspended"
          value={stats.suspended}
          icon={UserX}
          description="Currently suspended voters"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Registration Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Registration Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={registrationTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) =>
                      new Date(date).toLocaleDateString()
                    }
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(date) =>
                      new Date(date).toLocaleDateString()
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="registrations"
                    stroke="#3b82f6"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusDistribution.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper component for stat cards
function StatCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string;
  value: number;
  icon: typeof Users;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          </div>
          <Icon className="h-8 w-8 text-blue-500" />
        </div>
      </CardContent>
    </Card>
  );
}
