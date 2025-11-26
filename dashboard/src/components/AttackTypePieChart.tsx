import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { AlertDoc } from '../api';

interface AttackTypeData {
  name: string;
  value: number;
  color: string;
}

const COLORS = {
  'Brute Force': '#f43f5e',
  'DDoS': '#ef4444',
  'Port Scan': '#f97316',
  'Bot': '#f59e0b',
  'Suspicious Activity': '#eab308',
  'Other': '#94a3b8',
};

export default function AttackTypePieChart({ alerts }: { alerts: AlertDoc[] }) {
  const [data, setData] = useState<AttackTypeData[]>([]);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | 'all'>('24h');

  useEffect(() => {
    console.log('AttackTypes - Total alerts:', alerts.length);
    const now = Date.now();
    const ranges = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      'all': Infinity,
    };
    const rangeMs = ranges[timeRange];
    console.log('AttackTypes - Time range:', timeRange, 'Range ms:', rangeMs);

    // Filter alerts by time range and only attacks
    const filteredAlerts = alerts.filter(a => {
      if (!a.attack) return false;
      const alertTime = new Date(a.detected_at).getTime();
      return now - alertTime <= rangeMs;
    });
    console.log('AttackTypes - Filtered alerts:', filteredAlerts.length);

    // Count by attack type
    const counts: Record<string, number> = {};
    filteredAlerts.forEach(alert => {
      const type = alert.attack_type || 'Other';
      counts[type] = (counts[type] || 0) + 1;
    });

    // Convert to chart data
    const chartData: AttackTypeData[] = Object.entries(counts)
      .map(([name, value]) => ({
        name,
        value,
        color: COLORS[name as keyof typeof COLORS] || COLORS['Other'],
      }))
      .sort((a, b) => b.value - a.value);

    console.log('AttackTypes - Chart data:', chartData);
    setData(chartData);
  }, [alerts, timeRange]);

  const totalAttacks = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-100">Attack Types</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange('1h')}
            className={`px-3 py-1 text-xs rounded ${
              timeRange === '1h' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            1 Hour
          </button>
          <button
            onClick={() => setTimeRange('24h')}
            className={`px-3 py-1 text-xs rounded ${
              timeRange === '24h' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            24 Hours
          </button>
          <button
            onClick={() => setTimeRange('all')}
            className={`px-3 py-1 text-xs rounded ${
              timeRange === 'all' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-slate-500">
          No attacks detected in selected time range
        </div>
      ) : (
        <>
          <div className="text-center mb-4">
            <div className="text-3xl font-bold text-rose-400">{totalAttacks}</div>
            <div className="text-xs text-slate-400">Total Attacks</div>
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data as any}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={(entry: any) => {
                  const percent = (entry.value / totalAttacks) * 100;
                  return `${entry.name} (${percent.toFixed(0)}%)`;
                }}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  color: '#f1f5f9',
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-4 space-y-2">
            {data.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300">{item.name}</span>
                </div>
                <span className="text-slate-400">
                  {item.value} ({((item.value / totalAttacks) * 100).toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
