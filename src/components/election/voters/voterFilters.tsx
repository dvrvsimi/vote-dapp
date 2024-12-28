// src/components/election/voters/voterFilters.tsx
import { Filter, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VoterStatus } from "@/types/vote";

interface VoterFilters {
  status: VoterStatus | "all";
  voterType: "student" | "staff" | "all";
  hasVoted: boolean | "all";
  registrationDate: "today" | "week" | "month" | "all";
}

interface VoterFiltersProps {
  filters: VoterFilters;
  onFilterChange: (filters: VoterFilters) => void;
  onReset: () => void;
  totalCount: number;
  filteredCount: number;
}

export function VoterFilters({
  filters,
  onFilterChange,
  onReset,
  totalCount,
  filteredCount,
}: VoterFiltersProps) {
  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "active", label: "Active" },
    { value: "suspended", label: "Suspended" },
    { value: "revoked", label: "Revoked" },
    { value: "pending", label: "Pending" },
    { value: "onHold", label: "On Hold" },
  ];

  const voterTypeOptions = [
    { value: "all", label: "All Types" },
    { value: "student", label: "Student" },
    { value: "staff", label: "Staff" },
  ];

  const votingStatusOptions = [
    { value: "all", label: "All" },
    { value: "true", label: "Voted" },
    { value: "false", label: "Not Voted" },
  ];

  const dateRangeOptions = [
    { value: "all", label: "All Time" },
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
  ];

  const handleFilterChange = (key: keyof VoterFilters, value: any) => {
    if (key === "status") {
      let newStatus: VoterStatus | "all" = "all";
      if (value !== "all") {
        newStatus = { [value]: {} } as VoterStatus;
      }
      onFilterChange({
        ...filters,
        status: newStatus,
      });
    } else if (key === "hasVoted") {
      onFilterChange({
        ...filters,
        hasVoted: value === "all" ? "all" : value === "true",
      });
    } else {
      onFilterChange({
        ...filters,
        [key]: value,
      });
    }
  };

  const getActiveFilterCount = () => {
    return Object.entries(filters).filter(([_, value]) => value !== "all")
      .length;
  };

  const getStatusDisplayValue = (status: VoterStatus | "all"): string => {
    if (status === "all") return "all";
    return Object.keys(status)[0];
  };

  const getFilterLabel = (key: keyof VoterFilters, value: any): string => {
    switch (key) {
      case "status":
        return (
          statusOptions.find(
            (opt) =>
              opt.value === (value === "all" ? "all" : Object.keys(value)[0])
          )?.label || ""
        );
      case "voterType":
        return voterTypeOptions.find((opt) => opt.value === value)?.label || "";
      case "hasVoted":
        return (
          votingStatusOptions.find((opt) => opt.value === String(value))
            ?.label || ""
        );
      case "registrationDate":
        return dateRangeOptions.find((opt) => opt.value === value)?.label || "";
      default:
        return String(value);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Filter className="h-5 w-5 text-gray-500" />
            <div>
              <h3 className="font-medium">Filter Voters</h3>
              <p className="text-sm text-gray-500">
                Showing {filteredCount} of {totalCount} voters
              </p>
            </div>
          </div>
          {getActiveFilterCount() > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4 mr-1" />
              Clear filters
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <Select
              value={getStatusDisplayValue(filters.status)}
              onValueChange={(value) => handleFilterChange("status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Voter Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Voter Type
            </label>
            <Select
              value={filters.voterType}
              onValueChange={(value) => handleFilterChange("voterType", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {voterTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Voting Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Voting Status
            </label>
            <Select
              value={String(filters.hasVoted)}
              onValueChange={(value) => handleFilterChange("hasVoted", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {votingStatusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Registration Date
            </label>
            <Select
              value={filters.registrationDate}
              onValueChange={(value) =>
                handleFilterChange("registrationDate", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {dateRangeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Filters */}
        {getActiveFilterCount() > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {(Object.entries(filters) as [keyof VoterFilters, any][]).map(
              ([key, value]) => {
                if (value === "all") return null;
                return (
                  <Badge
                    key={key}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {getFilterLabel(key, value)}
                    <button
                      onClick={() => handleFilterChange(key, "all")}
                      className="ml-1 hover:text-gray-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              }
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
