import React, { useState } from "react";

export interface WhitelistEntry {
  _id?: string;
  ip: string;
  note?: string;
  created_at?: string;
}

export default function WhitelistPanel({
  entries,
  onAdd,
  onRemove,
}: {
  entries: WhitelistEntry[];
  onAdd: (ip: string, note?: string) => Promise<void>;
  onRemove: (ip: string) => Promise<void>;
}) {
  const [ip, setIp] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!ip.trim()) {
      setError("IP is required");
      return;
    }
    try {
      setSubmitting(true);
      await onAdd(ip.trim(), note.trim() || undefined);
      setIp("");
      setNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            placeholder="IP address"
            className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
          />
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
            className="w-full flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Add to whitelist
          </button>
        </div>
        {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
      </form>

      <div className="space-y-2">
        {entries.length === 0 ? (
          <p className="text-sm text-slate-400">No whitelisted IPs yet.</p>
        ) : (
          entries.map((entry) => (
            <div
              key={entry._id ?? entry.ip}
              className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/70 px-4 py-3"
            >
              <div>
                <p className="font-mono text-slate-200">{entry.ip}</p>
                {entry.note ? (
                  <p className="mt-1 text-xs text-slate-500">{entry.note}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => onRemove(entry.ip)}
                className="rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:bg-slate-800"
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
