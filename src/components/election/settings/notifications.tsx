// components/election/settings/notifications.tsx
import React, { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useElectionSettings } from "@/hooks/useElectionSettings";
import LoadingSpinner from "@/components/ui/loadingSpinner";
import { toast } from "sonner";

interface NotificationsProps {
  electionPDA: string;
}

const Notifications: React.FC<NotificationsProps> = ({ electionPDA }) => {
  const { election, isLoading, isAuthorized } =
    useElectionSettings(electionPDA);
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: false,
    emailAddress: "",
    pushNotifications: false,
  });

  const handleToggle = (setting: keyof typeof notificationSettings) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    toast.info("Notification settings will be implemented in a future update");
  };

  if (!election || !isAuthorized) {
    return (
      <div className="text-center p-6">
        <p className="text-gray-600">
          {!election
            ? "Loading..."
            : "You are not authorized to modify these settings."}
        </p>
      </div>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Notification Settings
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-medium text-gray-700">
                  Email Notifications
                </label>
                <p className="text-sm text-gray-500">
                  Receive updates about election activity
                </p>
              </div>
              <Switch
                checked={notificationSettings.emailNotifications}
                onCheckedChange={() => handleToggle("emailNotifications")}
                disabled={isLoading}
              />
            </div>

            {notificationSettings.emailNotifications && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Notification Email
                </label>
                <Input
                  type="email"
                  value={notificationSettings.emailAddress}
                  onChange={(e) =>
                    setNotificationSettings((prev) => ({
                      ...prev,
                      emailAddress: e.target.value,
                    }))
                  }
                  className="mt-1"
                  placeholder="Enter email address"
                  disabled={isLoading}
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-medium text-gray-700">
                  Push Notifications
                </label>
                <p className="text-sm text-gray-500">
                  Get browser notifications for important events
                </p>
              </div>
              <Switch
                checked={notificationSettings.pushNotifications}
                onCheckedChange={() => handleToggle("pushNotifications")}
                disabled={isLoading}
              />
            </div>

            <div className="pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <LoadingSpinner /> : "Save Preferences"}
              </Button>
            </div>
          </div>
        </form>

        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Notification Events
          </h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• New voter registrations</li>
            <li>• Vote submissions</li>
            <li>• Election status changes</li>
            <li>• Final results announcement</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};

export default Notifications;
