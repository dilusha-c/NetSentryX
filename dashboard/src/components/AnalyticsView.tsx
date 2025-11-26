import React from 'react';
import type { AlertDoc } from '../api';
import type { BlockDoc } from '../api';
import AttackTrendsChart from './AttackTrendsChart';
import AttackTypePieChart from './AttackTypePieChart';
import TopCountriesMap from './TopCountriesMap';
import DailyReport from './DailyReport';
import IPReputationScoring from './IPReputationScoring';

export default function AnalyticsView({ alerts, blockedHistory, currentBlocked }: { alerts: AlertDoc[], blockedHistory: BlockDoc[], currentBlocked: BlockDoc[] }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Security Analytics</h1>
          <p className="text-sm text-slate-400 mt-1">
            Comprehensive analysis of network threats and patterns
          </p>
        </div>
      </div>

      {/* Top Row - Trend Chart */}
      <div className="grid gap-6">
        <AttackTrendsChart alerts={alerts} />
      </div>

      {/* Middle Row - Pie Chart and Countries */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AttackTypePieChart alerts={alerts} />
        <TopCountriesMap blockedHistory={blockedHistory} />
      </div>

      {/* IP Reputation */}
      <div className="grid gap-6">
        <IPReputationScoring blockedHistory={blockedHistory} />
      </div>

      {/* Daily Report */}
      <div className="grid gap-6">
        <DailyReport alerts={alerts} />
      </div>
    </div>
  );
}
