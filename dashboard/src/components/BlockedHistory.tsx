import React, { useState, useEffect } from "react";
import type { BlockDoc } from "../api";

interface BlockedHistoryProps {
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

function groupBlocksByDay(blocks: BlockDoc[]) {
  const groups: Record<string, BlockDoc[]> = {};
  
  blocks.forEach(block => {
    const date = new Date(block.blocked_at);
    const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    if (!groups[dayKey]) {
      groups[dayKey] = [];
    }
    groups[dayKey].push(block);
  });
  
  return groups;
}

export default function BlockedHistory({ onClose }: BlockedHistoryProps) {
  const [blocks, setBlocks] = useState<BlockDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [viewMode, setViewMode] = useState<'daily' | 'list'>('daily');
  
  // Set default dates (last 7 days)
  useEffect(() => {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    setEndDate(now.toISOString().slice(0, 16));
    setStartDate(lastWeek.toISOString().slice(0, 16));
  }, []);
  
  async function fetchBlocks() {
    setLoading(true);
    try {
      // Fetch from history endpoint (includes expired blocks)
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/blocked/history?limit=5000`);
      const data = await response.json();
      
      // Filter by date range
      let filtered = data as BlockDoc[];
      if (startDate) {
        const start = new Date(startDate).getTime();
        filtered = filtered.filter(b => new Date(b.blocked_at).getTime() >= start);
      }
      if (endDate) {
        const end = new Date(endDate).getTime();
        filtered = filtered.filter(b => new Date(b.blocked_at).getTime() <= end);
      }
      
      setBlocks(filtered);
    } catch (error) {
      console.error('Failed to fetch blocked IPs history:', error);
    } finally {
      setLoading(false);
    }
  }
  
  useEffect(() => {
    if (startDate && endDate) {
      fetchBlocks();
    }
  }, [startDate, endDate]);
  
  const groupedBlocks = viewMode === 'daily' ? groupBlocksByDay(blocks) : null;
  const sortedDays = groupedBlocks ? Object.keys(groupedBlocks).sort().reverse() : [];
  
  const totalBlocks = blocks.length;
  const uniqueIPs = new Set(blocks.map(b => b.ip)).size;
  
  // Count by attack type
  const attackTypeCounts: Record<string, number> = {};
  blocks.forEach(b => {
    if (b.reason && b.reason !== 'auto-detect') {
      attackTypeCounts[b.reason] = (attackTypeCounts[b.reason] || 0) + 1;
    }
  });
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-slate-100">Blocked IPs History</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 text-2xl leading-none"
            >
              ×
            </button>
          </div>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-xs text-slate-400">Total Blocks</div>
              <div className="text-2xl font-bold text-rose-400">{totalBlocks}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-xs text-slate-400">Unique IPs</div>
              <div className="text-2xl font-bold text-amber-400">{uniqueIPs}</div>
            </div>
            {Object.entries(attackTypeCounts).slice(0, 2).map(([type, count]) => (
              <div key={type} className="bg-slate-800/50 rounded-lg p-3">
                <div className="text-xs text-slate-400">{type}</div>
                <div className="text-2xl font-bold text-sky-400">{count}</div>
              </div>
            ))}
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-slate-400 mb-1">Start Date/Time</label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-slate-400 mb-1">End Date/Time</label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('daily')}
                className={`px-4 py-2 text-sm rounded ${
                  viewMode === 'daily'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Daily View
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 text-sm rounded ${
                  viewMode === 'list'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                List View
              </button>
            </div>
            <button
              onClick={fetchBlocks}
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
            <div className="text-center py-12 text-slate-400">Loading blocked IPs...</div>
          ) : blocks.length === 0 ? (
            <div className="text-center py-12 text-slate-400">No blocked IPs found in this time range</div>
          ) : viewMode === 'daily' ? (
            <div className="space-y-6">
              {sortedDays.map(day => {
                const dayBlocks = groupedBlocks![day];
                const dayUniqueIPs = new Set(dayBlocks.map(b => b.ip)).size;
                
                return (
                  <div key={day} className="border border-slate-800 rounded-lg overflow-hidden">
                    <div className="bg-slate-800/50 px-4 py-3 flex items-center justify-between">
                      <h3 className="font-semibold text-slate-100">
                        {new Date(day).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </h3>
                      <div className="flex gap-4 text-sm">
                        <span className="text-slate-400">
                          {dayBlocks.length} blocks
                        </span>
                        <span className="text-rose-400">
                          {dayUniqueIPs} unique IPs
                        </span>
                      </div>
                    </div>
                    <div className="divide-y divide-slate-800">
                      {dayBlocks.map(block => (
                        <div key={block._id} className="px-4 py-3 hover:bg-slate-800/30 flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-slate-500">
                                {new Date(block.blocked_at).toLocaleTimeString()}
                              </span>
                              <span className="font-mono text-rose-400">{block.ip}</span>
                              {block.reason && block.reason !== 'auto-detect' && (
                                <span className="text-xs px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                                  {block.reason}
                                </span>
                              )}
                              {block.actor === 'admin' && (
                                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                                  Manual
                                </span>
                              )}
                            </div>
                            {block.note && (
                              <div className="text-xs text-slate-500 mt-1">
                                Note: {block.note}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-slate-300">
                              Duration: {Math.floor((block.duration_sec || 300) / 60)}m
                            </div>
                            {block.unblock_at && (
                              <div className="text-xs text-slate-500">
                                Until: {new Date(block.unblock_at).toLocaleTimeString()}
                              </div>
                            )}
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
                    <th className="px-4 py-3 text-left">Blocked Time</th>
                    <th className="px-4 py-3 text-left">IP Address</th>
                    <th className="px-4 py-3 text-left">Attack Type</th>
                    <th className="px-4 py-3 text-center">Duration</th>
                    <th className="px-4 py-3 text-left">Unblock Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {blocks.map(block => (
                    <tr key={block._id} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3 text-slate-200">{formatDate(block.blocked_at)}</td>
                      <td className="px-4 py-3 font-mono text-rose-300">{block.ip}</td>
                      <td className="px-4 py-3">
                        {block.reason && block.reason !== 'auto-detect' ? (
                          <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/20 text-rose-300">
                            {block.reason}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-300">
                        {Math.floor((block.duration_sec || 300) / 60)} min
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {block.unblock_at ? formatDate(block.unblock_at) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="border-t border-slate-700 px-6 py-4 bg-slate-900/80">
          <div className="flex items-center justify-between text-sm text-slate-400">
            <div>
              Showing {blocks.length} blocked IP{blocks.length !== 1 ? 's' : ''}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
