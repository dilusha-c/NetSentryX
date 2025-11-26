import React, { useState, useEffect } from "react";
import type { AlertDoc } from "../api";

interface AlertsHistoryProps {
  onClose: () => void;
}

function formatDate(ts: string) {
  // Ensure the timestamp is treated as UTC if it doesn't have timezone info
  const utcString = ts.endsWith('Z') ? ts : ts + 'Z';
  const d = new Date(utcString);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${month}/${day}/${year}, ${hours}:${minutes}:${seconds}`;
}

function formatHour(ts: string) {
  const d = new Date(ts);
  return d.toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

function groupAlertsByHour(alerts: AlertDoc[]) {
  const groups: Record<string, AlertDoc[]> = {};
  
  alerts.forEach(alert => {
    const date = new Date(alert.detected_at);
    const hourKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
    
    if (!groups[hourKey]) {
      groups[hourKey] = [];
    }
    groups[hourKey].push(alert);
  });
  
  return groups;
}

export default function AlertsHistory({ onClose }: AlertsHistoryProps) {
  const [alerts, setAlerts] = useState<AlertDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [viewMode, setViewMode] = useState<'hourly' | 'list'>('hourly');
  
  // Set default dates (last 24 hours)
  useEffect(() => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    setEndDate(now.toISOString().slice(0, 16));
    setStartDate(yesterday.toISOString().slice(0, 16));
  }, []);
  
  async function fetchAlerts() {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/alerts/recent?limit=1000`);
      const data = await response.json();
      
      // Filter by date range
      let filtered = data as AlertDoc[];
      if (startDate) {
        const start = new Date(startDate).getTime();
        filtered = filtered.filter(a => new Date(a.detected_at).getTime() >= start);
      }
      if (endDate) {
        const end = new Date(endDate).getTime();
        filtered = filtered.filter(a => new Date(a.detected_at).getTime() <= end);
      }
      
      setAlerts(filtered);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  }
  
  useEffect(() => {
    if (startDate && endDate) {
      fetchAlerts();
    }
  }, [startDate, endDate]);
  
  const groupedAlerts = viewMode === 'hourly' ? groupAlertsByHour(alerts) : null;
  const sortedHours = groupedAlerts ? Object.keys(groupedAlerts).sort().reverse() : [];
  
  const totalAlerts = alerts.length;
  const totalAttacks = alerts.filter(a => a.attack).length;
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-lg shadow-2xl border border-slate-700 max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Alert History</h2>
            <p className="text-sm text-slate-400 mt-1">
              {totalAlerts} total alerts • {totalAttacks} attacks ({((totalAttacks/totalAlerts)*100).toFixed(1)}%)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-2xl font-bold px-3 py-1"
          >
            ✕
          </button>
        </div>
        
        {/* Filters */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/50">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-slate-400 mb-2">Start Date & Time</label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-100 text-sm"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-slate-400 mb-2">End Date & Time</label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-100 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('hourly')}
                className={`px-4 py-2 text-sm rounded ${
                  viewMode === 'hourly'
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                Hourly View
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 text-sm rounded ${
                  viewMode === 'list'
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                List View
              </button>
            </div>
            <button
              onClick={fetchAlerts}
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12 text-slate-400">Loading alerts...</div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-12 text-slate-400">No alerts found in this time range</div>
          ) : viewMode === 'hourly' ? (
            <div className="space-y-6">
              {sortedHours.map(hour => {
                const hourAlerts = groupedAlerts![hour];
                const attacks = hourAlerts.filter(a => a.attack).length;
                
                return (
                  <div key={hour} className="border border-slate-800 rounded-lg overflow-hidden">
                    <div className="bg-slate-800/50 px-4 py-3 flex items-center justify-between">
                      <h3 className="font-semibold text-slate-100">{hour}</h3>
                      <div className="flex gap-4 text-sm">
                        <span className="text-slate-400">
                          {hourAlerts.length} alerts
                        </span>
                        <span className={attacks > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                          {attacks} attacks
                        </span>
                      </div>
                    </div>
                    <div className="divide-y divide-slate-800">
                      {hourAlerts.map(alert => (
                        <div key={alert._id} className="px-4 py-3 hover:bg-slate-800/30 flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-slate-500">
                                {new Date(alert.detected_at).toLocaleTimeString()}
                              </span>
                              <span className="font-mono text-sky-400">{alert.src_ip}</span>
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                alert.attack 
                                  ? 'bg-rose-500/20 text-rose-300' 
                                  : 'bg-emerald-500/10 text-emerald-300'
                              }`}>
                                {alert.attack ? (alert.attack_type || 'Attack') : 'Benign'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-slate-100">
                              {alert.score.toFixed(3)}
                            </div>
                            <div className="text-xs text-slate-500">
                              threshold: {alert.threshold?.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="border border-slate-800 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-slate-800 bg-slate-900/60 text-sm">
                <thead className="bg-slate-900/80 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-4 py-3 text-left">Time</th>
                    <th className="px-4 py-3 text-left">Source IP</th>
                    <th className="px-4 py-3 text-right">Score</th>
                    <th className="px-4 py-3 text-right">Threshold</th>
                    <th className="px-4 py-3 text-center">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {alerts.map(alert => (
                    <tr key={alert._id} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3 text-slate-200">{formatDate(alert.detected_at)}</td>
                      <td className="px-4 py-3 font-mono text-sky-300">{alert.src_ip}</td>
                      <td className="px-4 py-3 text-right font-semibold">{alert.score.toFixed(3)}</td>
                      <td className="px-4 py-3 text-right text-slate-400">{alert.threshold?.toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                          alert.attack
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-emerald-500/10 text-emerald-300'
                        }`}>
                          {alert.attack ? (alert.attack_type || 'Attack') : 'Benign'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
