import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { AlertDoc } from '../api';

interface TrendData {
  time: string;
  attacks: number;
  benign: number;
  total: number;
}

export default function AttackTrendsChart({ alerts }: { alerts: AlertDoc[] }) {
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h'>('1h');

  useEffect(() => {
    console.log('AttackTrends - Total alerts:', alerts.length);
    if (!alerts.length) return;

    const now = Date.now();
    const ranges = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
    };
    const rangeMs = ranges[timeRange];
    console.log('AttackTrends - Time range:', timeRange, 'Range ms:', rangeMs);
    const bucketSize = timeRange === '1h' ? 5 * 60 * 1000 : timeRange === '6h' ? 30 * 60 * 1000 : 60 * 60 * 1000;

    // Create time buckets
    const buckets: Record<number, { attacks: number; benign: number }> = {};
    
    // Pre-populate buckets for the entire time range to ensure continuity
    const startTime = Math.floor((now - rangeMs) / bucketSize) * bucketSize;
    for (let t = startTime; t <= now; t += bucketSize) {
      buckets[t] = { attacks: 0, benign: 0 };
    }
    
    alerts.forEach(alert => {
      const alertTime = new Date(alert.detected_at).getTime();
      if (now - alertTime > rangeMs) return;
      
      const bucketTime = Math.floor(alertTime / bucketSize) * bucketSize;
      if (!buckets[bucketTime]) {
        buckets[bucketTime] = { attacks: 0, benign: 0 };
      }
      
      if (alert.attack) {
        buckets[bucketTime].attacks++;
      } else {
        buckets[bucketTime].benign++;
      }
    });

    // Convert to array and sort
    const data: TrendData[] = Object.entries(buckets)
      .map(([time, counts]) => ({
        time: new Date(parseInt(time)).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        attacks: counts.attacks,
        benign: counts.benign,
        total: counts.attacks + counts.benign,
      }))
      .sort((a, b) => a.time.localeCompare(b.time));

    console.log('AttackTrends - Buckets found:', Object.keys(buckets).length, 'Data points:', data.length);
    setTrendData(data);
  }, [alerts, timeRange]);

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-100">Attack Trends</h3>
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
            onClick={() => setTimeRange('6h')}
            className={`px-3 py-1 text-xs rounded ${
              timeRange === '6h' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            6 Hours
          </button>
          <button
            onClick={() => setTimeRange('24h')}
            className={`px-3 py-1 text-xs rounded ${
              timeRange === '24h' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            24 Hours
          </button>
        </div>
      </div>

      {trendData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-slate-500">
          No data available for selected time range
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#94a3b8" style={{ fontSize: '12px' }} />
            <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '6px',
                color: '#f1f5f9',
              }}
            />
            <Legend wrapperStyle={{ color: '#94a3b8' }} />
            <Line type="monotone" dataKey="attacks" stroke="#f43f5e" strokeWidth={2} name="Attacks" />
            <Line type="monotone" dataKey="benign" stroke="#10b981" strokeWidth={2} name="Benign" />
            <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} name="Total" strokeDasharray="5 5" />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
