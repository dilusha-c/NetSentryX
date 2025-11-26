import React from "react";
import {
  fetchAlerts,
  fetchBlocked,
  fetchBlockedHistory,
  fetchConfig,
  fetchWhitelist,
  fetchStatus,
  updateConfig,
  manualBlock,
  manualUnblock,
  addWhitelist,
  removeWhitelist,
  detectFlow,
  type AlertDoc,
  type BlockDoc,
  type ConfigDoc,
  type DetectPreview,
  type SystemStatus,
} from "./api";
import SummaryCard from "./components/SummaryCard";
import AlertsTable from "./components/AlertsTable";
import AlertsHistory from "./components/AlertsHistory";
import BlockedHistory from "./components/BlockedHistory";
import NetworkMonitor from "./components/NetworkMonitor";
import BlockedList from "./components/BlockedList";
import ConfigPanel from "./components/ConfigPanel";
import WhitelistPanel from "./components/WhitelistPanel";
import ManualControls from "./components/ManualControls";
import AnalyticsView from "./components/AnalyticsView";
import { usePolling } from "./hooks/usePolling";

function useNow(intervalMs: number) {
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export default function App() {
  const [alertsLimit, setAlertsLimit] = React.useState(20);
  const [sortOrder, setSortOrder] = React.useState<'recent' | 'oldest'>('recent');
  const [showHistory, setShowHistory] = React.useState(false);
  const [showBlockedHistory, setShowBlockedHistory] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState<'dashboard' | 'network' | 'analytics'>('dashboard');
  
  const alertsPoll = usePolling(() => fetchAlerts(alertsLimit), 5000, [alertsLimit]);
  const blockedPoll = usePolling(() => fetchBlocked(50), 5000, []);
  const blockedHistoryPoll = usePolling(() => fetchBlockedHistory(5000), 30000, []);
  const configPoll = usePolling(() => fetchConfig(), 15000, []);
  const whitelistPoll = usePolling(() => fetchWhitelist(100), 30000, []);
  const statusPoll = usePolling(() => fetchStatus(), 3000, []);
  const now = useNow(1000);

  let alerts = (alertsPoll.data ?? []) as AlertDoc[];
  
  // Sort alerts based on selected order
  if (sortOrder === 'oldest') {
    alerts = [...alerts].reverse();
  }
  
  const blocked = (blockedPoll.data ?? []) as BlockDoc[];
  const blockedHistory = (blockedHistoryPoll.data ?? []) as BlockDoc[];
  const whitelist = whitelistPoll.data ?? [];
  const config = (configPoll.data ?? null) as ConfigDoc | null;
  const status = (statusPoll.data ?? null) as SystemStatus | null;

  async function handleConfigSave(payload: Partial<ConfigDoc>) {
    await updateConfig(payload);
    const fresh = await fetchConfig();
    configPoll.setData(fresh);
  }

  async function handleManualBlock(ip: string, duration?: number, note?: string) {
    await manualBlock(ip, duration, note);
    const [freshBlocked, freshAlerts] = await Promise.all([
      fetchBlocked(50),
      fetchAlerts(20),
    ]);
    blockedPoll.setData(freshBlocked);
    alertsPoll.setData(freshAlerts);
  }

  async function handleManualUnblock(ip: string) {
    await manualUnblock(ip);
    const freshBlocked = await fetchBlocked(50);
    blockedPoll.setData(freshBlocked);
  }

  async function handleWhitelistAdd(ip: string, note?: string) {
    await addWhitelist(ip, note);
    const fresh = await fetchWhitelist(100);
    whitelistPoll.setData(fresh);
  }

  async function handleWhitelistRemove(ip: string) {
    await removeWhitelist(ip);
    const fresh = await fetchWhitelist(100);
    whitelistPoll.setData(fresh);
  }

  async function handleDetectPreview(payload: Record<string, unknown>): Promise<DetectPreview> {
    return detectFlow(payload);
  }

  const latestAttack = alerts.find((a) => a.attack);
  const attackRate = alerts.length
    ? alerts.filter((a) => a.attack).length / alerts.length
    : 0;

  return (
    <div className="min-h-screen bg-slate-950 pb-12 text-slate-100">
      {showHistory && <AlertsHistory onClose={() => setShowHistory(false)} />}
      
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <img src="/logo1.png" alt="NetSentryX" className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-semibold text-slate-100">NetSentryX</h1>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                {now.toLocaleString('en-US', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Navigation */}
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage('dashboard')}
                className={`px-4 py-2 text-sm font-medium rounded ${
                  currentPage === 'dashboard'
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setCurrentPage('analytics')}
                className={`px-4 py-2 text-sm font-medium rounded ${
                  currentPage === 'analytics'
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                📈 Analytics
              </button>
              <button
                onClick={() => setCurrentPage('network')}
                className={`px-4 py-2 text-sm font-medium rounded ${
                  currentPage === 'network'
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                📊 Network Monitor
              </button>
            </div>
            
            <div className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2">
              <div className={`h-2.5 w-2.5 rounded-full ${
                status?.live_capture_active 
                  ? 'bg-green-500 animate-pulse' 
                  : 'bg-slate-600'
              }`} />
              <span className="text-sm font-medium text-slate-300">
                {status?.live_capture_active ? 'Live Capture ON' : 'Live Capture OFF'}
              </span>
              {status?.flows_last_minute ? (
                <span className="text-xs text-slate-500">
                  ({status.flows_last_minute}/min)
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {currentPage === 'network' ? (
          <NetworkMonitor />
        ) : currentPage === 'analytics' ? (
          <AnalyticsView alerts={alerts} blockedHistory={blockedHistory} currentBlocked={blocked} />
        ) : (
          <>
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Recent Alerts"
            value={alerts.length}
            hint="Last 20 alerts"
          />
          <SummaryCard
            title="Attack Rate"
            value={`${(attackRate * 100).toFixed(1)}%`}
            hint="Attack vs benign in current window"
          />
          <SummaryCard
            title="Blocked IPs"
            value={blocked.length}
            hint="Currently enforced"
          />
          <SummaryCard
            title="Last Attack"
            value={latestAttack ? new Date(latestAttack.detected_at).toLocaleTimeString() : "—"}
            hint={latestAttack ? latestAttack.src_ip : "No attacks yet"}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-lg font-semibold text-slate-100">Recent Alerts</h2>
              <div className="flex items-center gap-3">
                {alertsPoll.loading && <span className="text-xs text-slate-500">Refreshing…</span>}
                
                {/* Sort Controls */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setSortOrder('recent')}
                    className={`px-3 py-1.5 text-xs rounded ${
                      sortOrder === 'recent'
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    Recent First
                  </button>
                  <button
                    onClick={() => setSortOrder('oldest')}
                    className={`px-3 py-1.5 text-xs rounded ${
                      sortOrder === 'oldest'
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    Oldest First
                  </button>
                </div>
                
                {/* Limit Controls */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setAlertsLimit(20)}
                    className={`px-3 py-1.5 text-xs rounded ${
                      alertsLimit === 20
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    20
                  </button>
                  <button
                    onClick={() => setAlertsLimit(50)}
                    className={`px-3 py-1.5 text-xs rounded ${
                      alertsLimit === 50
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    50
                  </button>
                  <button
                    onClick={() => setAlertsLimit(100)}
                    className={`px-3 py-1.5 text-xs rounded ${
                      alertsLimit === 100
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    100
                  </button>
                  <button
                    onClick={() => setShowHistory(true)}
                    className="px-3 py-1.5 text-xs rounded bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                  >
                    📊 See All
                  </button>
                </div>
              </div>
            </div>
            <div className="text-xs text-slate-500 -mt-2">
              Showing {alerts.length} alerts • Sorted by {sortOrder === 'recent' ? 'newest' : 'oldest'}
            </div>
            <AlertsTable alerts={alerts} />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-100">Blocked IPs</h2>
              <div className="flex items-center gap-3">
                {blockedPoll.loading && <span className="text-xs text-slate-500">Refreshing…</span>}
                <button
                  onClick={() => setShowBlockedHistory(true)}
                  className="px-3 py-1.5 text-xs rounded bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                >
                  📊 See All
                </button>
              </div>
            </div>
            <BlockedList entries={blocked} onUnblock={handleManualUnblock} />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-100">Detection Policy</h2>
              {configPoll.loading ? <span className="text-xs text-slate-500">Refreshing…</span> : null}
            </div>
            <ConfigPanel config={config} onSave={handleConfigSave} />
            <ManualControls onPreview={handleDetectPreview} onBlock={handleManualBlock} />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-100">Whitelist</h2>
              {whitelistPoll.loading ? <span className="text-xs text-slate-500">Refreshing…</span> : null}
            </div>
            <WhitelistPanel
              entries={whitelist}
              onAdd={handleWhitelistAdd}
              onRemove={handleWhitelistRemove}
            />
          </div>
        </section>
        </>
        )}
      </main>
      
      {/* Modals */}
      {showHistory && <AlertsHistory onClose={() => setShowHistory(false)} />}
      {showBlockedHistory && <BlockedHistory onClose={() => setShowBlockedHistory(false)} />}
    </div>
  );
}
