import React from "react";
import type { BlockDoc } from "../api";
import { IPInfoDisplay } from "../utils/ipInfo";

function formatDate(ts?: string) {
  if (!ts) return "—";
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

function BlockedItem({ entry, onUnblock }: { entry: BlockDoc; onUnblock: (ip: string) => void }) {
  return (
    <div className="flex items-start justify-between rounded-lg border border-slate-800 bg-slate-900/70 p-4">
      <div className="flex-1">
        <p className="font-mono text-lg text-rose-200">{entry.ip}</p>
        <p className="mt-1 text-xs">
          <IPInfoDisplay ip={entry.ip} />
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Blocked: {formatDate(entry.blocked_at)} · Unblock: {formatDate(entry.unblock_at)}
        </p>
        {entry.reason && (
          <p className="mt-1 text-xs">
            <span className="inline-flex items-center rounded-full bg-rose-500/20 px-2 py-0.5 text-xs font-semibold text-rose-300">
              {entry.reason}
            </span>
          </p>
        )}
        {entry.note ? (
          <p className="mt-1 text-xs text-slate-500">Note: {entry.note}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => onUnblock(entry.ip)}
        className="rounded-md border border-rose-500/50 px-3 py-1 text-sm text-rose-200 hover:bg-rose-500/10"
      >
        Unblock
      </button>
    </div>
  );
}

export default function BlockedList({
  entries,
  onUnblock,
}: {
  entries: BlockDoc[];
  onUnblock: (ip: string) => void;
}) {
  if (!entries.length) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-6 text-center text-sm text-slate-400">
        No IPs currently blocked.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <BlockedItem key={entry._id} entry={entry} onUnblock={onUnblock} />
      ))}
    </div>
  );
}
