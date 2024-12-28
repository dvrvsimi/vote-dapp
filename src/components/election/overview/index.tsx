import React from 'react';
import QuickStats from './QuickStats';
import QuickActions from './QuickActions';
import RecentActivity from './RecentActivity';
import ElectionStatus from './ElectionStatus';

const OverviewPage = ({ electionPDA }: { electionPDA: string }) => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Election Overview</h1>
      
      {/* Top Section: Stats and Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <QuickStats electionPDA={electionPDA} />
        </div>
        <div>
          <QuickActions electionPDA={electionPDA} />
        </div>
      </div>

      {/* Bottom Section: Activity and Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivity electionPDA={electionPDA} />
        </div>
        <div>
          <ElectionStatus electionPDA={electionPDA} />
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;