import React from 'react';
import { BackgroundVideoSelector } from './BackgroundVideoSelector';

export const DashboardSettings: React.FC = () => {
  return (
    <div className="space-y-3">
      <BackgroundVideoSelector view="dashboard" />
    </div>
  );
};

