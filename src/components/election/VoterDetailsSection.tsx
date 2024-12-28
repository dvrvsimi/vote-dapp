// src/components/election/VoterDetailsSection.tsx
import { VoterInfo } from "@/types/election-registration";
import { formatDate } from "@/utils/election-helpers";
import { CheckCircle, XCircle } from "lucide-react";

interface VoterDetailsSectionProps {
  voterInfo: VoterInfo;
}

export const VoterDetailsSection: React.FC<VoterDetailsSectionProps> = ({
  voterInfo,
}) => {
  if (!voterInfo) return null;

  function formatVoterStatus(status: {
    pending?: {};
    active?: {};
    suspended?: {};
    revoked?: {};
    onHold?: {};
  }): import("react").ReactNode {
    throw new Error("Function not implemented.");
  }

  return (
    <div className="mt-4 space-y-2" role="region" aria-label="Voter Details">
      <h3 className="text-lg font-medium">Your Voter Details</h3>
      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="text-sm text-gray-500">Status</p>
          <p className="font-medium">{formatVoterStatus(voterInfo.status)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Registration Time</p>
          <p className="font-medium">
            {formatDate(voterInfo.registrationTime.toNumber())}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Eligibility</p>
          <div className="flex items-center">
            {voterInfo.isEligible ? (
              <>
                <CheckCircle
                  className="h-4 w-4 text-green-500 mr-1"
                  aria-hidden="true"
                />
                <span className="text-green-600">Eligible</span>
              </>
            ) : (
              <>
                <XCircle
                  className="h-4 w-4 text-red-500 mr-1"
                  aria-hidden="true"
                />
                <span className="text-red-600">Not Eligible</span>
              </>
            )}
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-500">Has Voted</p>
          <div className="flex items-center">
            {voterInfo.hasVoted ? (
              <>
                <CheckCircle
                  className="h-4 w-4 text-green-500 mr-1"
                  aria-hidden="true"
                />
                <span className="text-green-600">Yes</span>
              </>
            ) : (
              <>
                <XCircle
                  className="h-4 w-4 text-gray-500 mr-1"
                  aria-hidden="true"
                />
                <span className="text-gray-600">No</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
