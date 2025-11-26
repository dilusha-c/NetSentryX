import React, { useState } from "react";
import type { AlertDoc } from "../api";

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

// Hook to fetch IP info on demand
function useIPInfo(ip: string) {
  const [info, setInfo] = React.useState<{ hostname?: string; country?: string; loading: boolean }>({ loading: false });
  
  const fetchInfo = async () => {
    if (info.hostname !== undefined || info.loading) return;
    setInfo({ loading: true });
    
    try {
      // Free IP geolocation API
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

function AlertRow({ alert }: { alert: AlertDoc }) {
  const { info, fetchInfo } = useIPInfo(alert.src_ip);
  const [expanded, setExpanded] = useState(false);

  // Auto-fetch IP info on mount
  React.useEffect(() => {
    fetchInfo();
  }, []);

  return (
    <>
      <tr 
        className="hover:bg-slate-800/40 cursor-pointer"
        onClick={() => {
          setExpanded(!expanded);
        }}
      >
        <td className="px-4 py-3 align-top text-slate-200">{formatDate(alert.detected_at)}</td>
        <td className="px-4 py-3 align-top">
          <div className="font-mono text-sky-300">{alert.src_ip}</div>
          {info.loading ? (
            <div className="text-xs text-slate-500 mt-0.5">Loading...</div>
          ) : info.hostname ? (
            <div className="text-xs text-slate-400 mt-0.5">
              {info.hostname}
              {info.country && ` • ${info.country}`}
            </div>
          ) : null}
        </td>
        <td className="px-4 py-3 align-top text-right font-semibold text-slate-100">
          {alert.score.toFixed(3)}
        </td>
        <td className="px-4 py-3 align-top text-right text-slate-400">
          {alert.threshold?.toFixed(2) ?? "—"}
        </td>
        <td className="px-4 py-3 align-top text-center">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
              alert.attack
                ? "bg-rose-500/20 text-rose-300"
                : "bg-emerald-500/10 text-emerald-300"
            }`}
          >
            {alert.attack ? (alert.attack_type || "Attack") : "Benign"}
          </span>
        </td>
        <td className="px-4 py-3 text-slate-500">
          {expanded ? "▼" : "▶"}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-slate-800/20">
          <td colSpan={6} className="px-4 py-3">
            <div className="text-xs space-y-1 text-slate-400">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-slate-500">IP:</span> {alert.src_ip}</div>
                <div><span className="text-slate-500">Score:</span> {alert.score.toFixed(4)}</div>
                {info.loading && <div className="text-slate-500">Loading location...</div>}
                {info.hostname && <div><span className="text-slate-500">Organization:</span> {info.hostname}</div>}
                {info.country && <div><span className="text-slate-500">Country:</span> {info.country}</div>}
              </div>
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
      <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-6 text-center text-sm text-slate-400">
        No alerts yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-800">
      <table className="min-w-full divide-y divide-slate-800 bg-slate-900/60 text-sm text-slate-100">
        <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-4 py-3 text-left">Time</th>
            <th className="px-4 py-3 text-left">Source IP / Location</th>
            <th className="px-4 py-3 text-right">Score</th>
            <th className="px-4 py-3 text-right">Threshold</th>
            <th className="px-4 py-3 text-center">Attack?</th>
            <th className="px-4 py-3 w-8"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {alerts.map((alert) => (
            <AlertRow key={alert._id} alert={alert} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
