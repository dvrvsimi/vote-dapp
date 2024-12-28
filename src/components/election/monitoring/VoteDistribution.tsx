// src/components/election/monitoring/VoteDistribution.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

export default function VoteDistribution({ election }: { election: any }) {
  // Calculate vote distribution
  const voteDistribution = election.candidates.map(
    (candidate: any, index: number) => ({
      name: `Candidate ${index + 1}`,
      value: Number(candidate.plusVotes) - Number(candidate.minusVotes),
      plusVotes: Number(candidate.plusVotes),
      minusVotes: Number(candidate.minusVotes),
      total: Number(candidate.plusVotes) + Number(candidate.minusVotes),
    })
  );

  // Colors for the pie chart
  const COLORS = [
    "#3b82f6",
    "#22c55e",
    "#ef4444",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vote Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={voteDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="total"
              >
                {voteDistribution.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-4 rounded-lg shadow border">
                        <p className="font-medium">{data.name}</p>
                        <p className="text-sm text-gray-600">
                          Net Score: {data.value}
                        </p>
                        <p className="text-sm text-green-600">
                          +{data.plusVotes}
                        </p>
                        <p className="text-sm text-red-600">
                          -{data.minusVotes}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          {voteDistribution.map((data, index) => (
            <div key={data.name} className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium">{data.name}</h3>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-600">
                  Net Score: <span className="font-medium">{data.value}</span>
                </p>
                <p className="text-sm text-green-600">
                  Plus Votes: +{data.plusVotes}
                </p>
                <p className="text-sm text-red-600">
                  Minus Votes: -{data.minusVotes}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
