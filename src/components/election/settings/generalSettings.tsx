// components/election/settings/generalSettings.tsx
import React, { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useElectionSettings } from "@/hooks/useElectionSettings";
import { validateElectionSettings } from "@/utils/settingsValidation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import LoadingSpinner from "@/components/ui/loadingSpinner";
import { toast } from "sonner";

interface GeneralSettingsProps {
  electionPDA: string;
}

const GeneralSettings: React.FC<GeneralSettingsProps> = ({ electionPDA }) => {
  const { election, isLoading, isAuthorized, updateSettings } =
    useElectionSettings(electionPDA);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: election?.name || "",
    description: "", // Add to election type if needed
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const validation = validateElectionSettings(formData);
      if (!validation.isValid) {
        validation.errors.forEach((error) => toast.error(error));
        return;
      }

      try {
        await updateSettings({
          name: formData.title,
          // Add other fields as needed
        });
        toast.success("Settings updated successfully");
      } catch (error) {
        toast.error("Failed to update settings");
      }
    },
    [formData, updateSettings]
  );

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          General Settings
        </h3>
        <div className="flex items-center space-x-2">
          {election.status.active && (
            <Button
              variant="destructive"
              onClick={() => setShowEndDialog(true)}
              disabled={isLoading}
            >
              End Election
            </Button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700"
          >
            Election Name
          </label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="mt-1"
            disabled={isLoading}
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Election Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <p className="mt-1 text-sm text-gray-600">
            {election.status.active
              ? "Active"
              : election.status.ended
              ? "Ended"
              : "Created"}
          </p>
        </div>

        <div className="pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <LoadingSpinner /> : "Save Changes"}
          </Button>
        </div>
      </form>

      <AlertDialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Election</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to end this election? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                // Implement end election logic
                setShowEndDialog(false);
              }}
            >
              End Election
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GeneralSettings;
