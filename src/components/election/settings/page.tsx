// components/election/settings/page.tsx
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GeneralSettings from "./generalSettings";
import VotingRules from "./votingRules";
import AccessControl from "./accessControl";
import Notifications from "./notifications";
import { useElectionSettings } from "@/hooks/useElectionSettings";

interface SettingsPageProps {
  electionPDA: string;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ electionPDA }) => {
  const { election, isAuthorized } = useElectionSettings(electionPDA);
  const [activeTab, setActiveTab] = useState("general");

  if (!election) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-600">Loading election settings...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-red-600">
                Access Denied
              </h2>
              <p className="mt-2 text-gray-600">
                You are not authorized to view or modify election settings.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Election Settings</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="voting">Voting Rules</TabsTrigger>
          <TabsTrigger value="access">Access Control</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="general">
            <GeneralSettings electionPDA={electionPDA} />
          </TabsContent>

          <TabsContent value="voting">
            <VotingRules electionPDA={electionPDA} />
          </TabsContent>

          <TabsContent value="access">
            <AccessControl electionPDA={electionPDA} />
          </TabsContent>

          <TabsContent value="notifications">
            <Notifications electionPDA={electionPDA} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
