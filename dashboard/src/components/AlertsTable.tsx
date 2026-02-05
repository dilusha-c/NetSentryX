import React, { useState } from "react";
import type { AlertDoc } from "../api";

function formatDate(ts: string) {
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

function getTimeSince(ts: string): string {
  const utcString = ts.endsWith('Z') ? ts : ts + 'Z';
  const d = new Date(utcString);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

function getThreatLevel(score: number): 'critical' | 'high' | 'medium' | 'low' {
  if (score >= 0.9) return 'critical';
  if (score >= 0.7) return 'high';
  if (score >= 0.4) return 'medium';
  return 'low';
}

const threatColors = {
  critical: {
    bg: 'bg-red-500/20',
    border: 'border-red-500/50',
    text: 'text-red-400',
    dot: 'threat-dot-critical',
    bar: 'bg-red-500',
  },
  high: {
    bg: 'bg-orange-500/20',
    border: 'border-orange-500/50',
    text: 'text-orange-400',
    dot: 'threat-dot-high',
    bar: 'bg-orange-500',
  },
  medium: {
    bg: 'bg-amber-500/20',
    border: 'border-amber-500/50',
    text: 'text-amber-400',
    dot: 'bg-amber-500',
    bar: 'bg-amber-500',
  },
  low: {
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-500/50',
    text: 'text-emerald-400',
    dot: 'threat-dot-low',
    bar: 'bg-emerald-500',
  },
};

function useIPInfo(ip: string) {
  const [info, setInfo] = React.useState<{ hostname?: string; country?: string; loading: boolean }>({ loading: false });

  const fetchInfo = async () => {
    if (info.hostname !== undefined || info.loading) return;
    setInfo({ loading: true });

    try {
      const res = await fetch(`https://ipapi.co/${ip}/json/`);
      const data = await res.json();
      setInfo({
        hostname: data.org || data.city || 'Unknown',
        country: data.country_name || data.country_code,
        loading: false
      });
    } catch {
      setInfo({ hostname: 'Unknown', country: undefined, loading: false });
    }
  };

  return { info, fetchInfo };
}

function AlertRow({ alert, index }: { alert: AlertDoc; index: number }) {
  const { info, fetchInfo } = useIPInfo(alert.src_ip);
  const [expanded, setExpanded] = useState(false);
  const threatLevel = alert.attack ? getThreatLevel(alert.score) : 'low';
  const colors = threatColors[threatLevel];
  const isRecent = (new Date().getTime() - new Date(alert.detected_at).getTime()) < 60000;

  React.useEffect(() => {
    fetchInfo();
  }, []);

  return (
    <>
      <tr
        className={`
          table-row-animated cursor-pointer relative
          ${alert.attack ? 'hover:bg-rose-500/5' : 'hover:bg-slate-800/40'}
          ${isRecent ? 'animate-fade-in-up' : ''}
        `}
        style={{ animationDelay: `${index * 30}ms` }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Threat level indicator bar */}
        <td className="w-1 p-0">
          <div className={`h-full w-1 ${colors.bar}`} />
        </td>

        <td className="px-4 py-3.5 align-top">
          <div className="flex items-center gap-2">
            {/* Threat dot indicator */}
            {alert.attack && (
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${colors.dot}`} />
            )}
            <div>
              <div className="text-slate-200">{formatDate(alert.detected_at)}</div>
              <div className="text-xs text-slate-500 mt-0.5">{getTimeSince(alert.detected_at)}</div>
            </div>
          </div>
        </td>

        <td className="px-4 py-3.5 align-top">
          <div className="font-mono text-sky-300 hover:text-sky-200 transition-colors">
            {alert.src_ip}
          </div>
          {info.loading ? (
            <div className="text-xs text-slate-600 mt-0.5 animate-pulse">Loading...</div>
          ) : info.hostname ? (
            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <span>{info.hostname}</span>
              {info.country && (
                <>
                  <span className="text-slate-600">•</span>
                  <span>{info.country}</span>
                </>
              )}
            </div>
          ) : null}
        </td>

        <td className="px-4 py-3.5 align-top text-right">
          <div className={`font-bold text-lg ${colors.text} stat-number`}>
            {alert.score.toFixed(3)}
          </div>
          {/* Mini progress bar */}
          <div className="w-16 h-1 bg-slate-800 rounded-full mt-1.5 ml-auto overflow-hidden">
            <div
              className={`h-full ${colors.bar} transition-all duration-500`}
              style={{ width: `${alert.score * 100}%` }}
            />
          </div>
        </td>

        <td className="px-4 py-3.5 align-top text-right text-slate-400">
          {alert.threshold?.toFixed(2) ?? "—"}
        </td>

        <td className="px-4 py-3.5 align-top text-center">
          <span className={`
            inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold
            transition-all duration-200
            ${alert.attack
              ? `${colors.bg} ${colors.text} ${colors.border} border`
              : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
            }
          `}>
            {alert.attack && (
              <span className={`w-1.5 h-1.5 rounded-full ${colors.bar} ${threatLevel === 'critical' ? 'animate-pulse' : ''}`} />
            )}
            {alert.attack ? (alert.attack_type || "Attack") : "Benign"}
          </span>
        </td>

        <td className="px-4 py-3.5 text-slate-500">
          <div className={`
            transition-transform duration-200
            ${expanded ? 'rotate-90' : ''}
          `}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </td>
      </tr>

      {/* Expanded details row */}
      {expanded && (
        <tr className="bg-slate-900/50 animate-fade-in">
          <td colSpan={7} className="px-6 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wider text-slate-500">Source IP</div>
                <div className="font-mono text-sky-300">{alert.src_ip}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wider text-slate-500">Threat Score</div>
                <div className={`font-bold ${colors.text}`}>{alert.score.toFixed(4)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wider text-slate-500">Threat Level</div>
                <div className={`font-semibold capitalize ${colors.text}`}>{threatLevel}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wider text-slate-500">Detection Time</div>
                <div className="text-slate-300">{formatDate(alert.detected_at)}</div>
              </div>
              {info.hostname && (
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-wider text-slate-500">Organization</div>
                  <div className="text-slate-300">{info.hostname}</div>
                </div>
              )}
              {info.country && (
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-wider text-slate-500">Country</div>
                  <div className="text-slate-300">{info.country}</div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function AlertsTable({ alerts }: { alerts: AlertDoc[] }) {
  if (!alerts.length) {
    return (
      <div className="rounded-xl border border-slate-800/50 glass p-8 text-center animate-fade-in">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
          <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-slate-400 font-medium">No alerts detected</p>
        <p className="text-sm text-slate-500 mt-1">Your network is currently secure</p>
      </div>
    );
  }

  const attackCount = alerts.filter(a => a.attack).length;
  const criticalCount = alerts.filter(a => a.attack && a.score >= 0.9).length;

  return (
    <div className="space-y-3">
      {/* Quick stats bar */}
      {attackCount > 0 && (
        <div className="flex items-center gap-4 px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-800/50 text-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-slate-400">
              <span className="font-semibold text-rose-400">{attackCount}</span> attacks detected
            </span>
          </div>
          {criticalCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-600 threat-dot-critical" />
              <span className="text-slate-400">
                <span className="font-semibold text-red-400">{criticalCount}</span> critical
              </span>
            </div>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-800/50 glass">
        <table className="min-w-full divide-y divide-slate-800/50 text-sm">
          <thead className="bg-slate-900/80">
            <tr>
              <th className="w-1"></th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                Time
              </th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                Source IP / Location
              </th>
              <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                Score
              </th>
              <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                Threshold
              </th>
              <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
                Status
              </th>
              <th className="px-4 py-3.5 w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {alerts.map((alert, index) => (
              <AlertRow key={alert._id} alert={alert} index={index} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
