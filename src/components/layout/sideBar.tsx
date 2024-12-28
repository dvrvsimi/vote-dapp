// src/components/layout/sideBar.tsx
import React from "react";
import * as lucideReact from "lucide-react";
import { cn } from "@/utils/utils";
import { PublicKey } from "@solana/web3.js";

export type NavigationPath =
  | `/election/${string}/overview`
  | `/election/${string}/voters`
  | `/election/${string}/results`
  | `/election/${string}/monitoring`
  | `/election/${string}/settings`;

export interface NavItem {
  label: string;
  path: NavigationPath;
  icon: lucideReact.LucideIcon;
  creatorOnly?: boolean;
}

interface SideNavigationProps {
  currentPath: NavigationPath;
  onNavigate: (path: NavigationPath) => void;
  electionPDA?: PublicKey;
  isCreator?: boolean;
}

const getNavigationItems = (electionPDA?: PublicKey): NavItem[] => {
  const basePath = electionPDA ? `/election/${electionPDA.toString()}` : "";

  return [
    {
      label: "Overview",
      path: `${basePath}/overview` as NavigationPath,
      icon: lucideReact.Home,
    },
    {
      label: "Voters",
      path: `${basePath}/voters` as NavigationPath,
      icon: lucideReact.Users,
      // creatorOnly: true, // Only show this tab for creators
    },
    {
      label: "Results",
      path: `${basePath}/results` as NavigationPath,
      icon: lucideReact.PieChart,
    },
    {
      label: "Monitoring",
      path: `${basePath}/monitoring` as NavigationPath,
      icon: lucideReact.Activity,
    },
    {
      label: "Settings",
      path: `${basePath}/settings` as NavigationPath,
      icon: lucideReact.Settings,
    },
  ];
};

const SideNavigation = ({
  currentPath,
  onNavigate,
  electionPDA,
  isCreator = false, // Default to false
}: SideNavigationProps) => {
  const navigationItems = getNavigationItems(electionPDA);

  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-4">
      <nav className="space-y-2">
        {navigationItems
          // Filter out creator-only items if user is not creator
          .filter((item) => !item.creatorOnly || isCreator)
          .map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                className={cn(
                  "w-full flex items-center px-4 py-2 rounded-md transition-colors",
                  currentPath === item.path
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.label}
              </button>
            );
          })}
      </nav>
    </aside>
  );
};

export default SideNavigation;
