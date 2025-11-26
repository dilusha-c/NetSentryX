import React, { useState } from "react";
import type { DetectPreview } from "../api";

export default function ManualControls({
  onPreview,
  onBlock,
}: {
  onPreview: (payload: Record<string, unknown>) => Promise<DetectPreview>;
  onBlock: (ip: string, duration?: number, note?: string) => Promise<void>;
}) {
  const [ip, setIp] = useState("1.2.3.4");
  const [duration, setDuration] = useState("600");
  const [note, setNote] = useState("Manual block");
  const [preview, setPreview] = useState<DetectPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePreview() {
    setError(null);
    try {
      setLoading(true);
      const payload = {
        src_ip: ip,
        total_packets: 200,
        total_bytes: 40000,
        duration: 1,
        pkts_per_sec: 200,
        bytes_per_sec: 40000,
        syn_count: 10,
        unique_dst_ports: 1,
      };
      const res = await onPreview(payload);
      setPreview(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleBlock() {
    setError(null);
    try {
      setLoading(true);
      await onBlock(ip, Number(duration) || undefined, note || undefined);
      setPreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
        Quick Actions
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-xs uppercase tracking-wide text-slate-500">
          Target IP
          <input
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
          />
        </label>
        <label className="text-xs uppercase tracking-wide text-slate-500">
          Block duration (sec)
          <input
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
          />
        </label>
      </div>
      <label className="mt-3 block text-xs uppercase tracking-wide text-slate-500">
        Note (optional)
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
        />
      </label>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={handlePreview}
          disabled={loading}
          className="rounded-md border border-sky-500/50 px-4 py-2 text-sm text-sky-300 hover:bg-sky-500/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Preview detection
        </button>
        <button
          type="button"
          onClick={handleBlock}
          disabled={loading}
          className="rounded-md border border-rose-500/50 px-4 py-2 text-sm text-rose-200 hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Block IP
        </button>
      </div>
      {preview ? (
        <div className="mt-4 rounded-md border border-slate-800 bg-slate-900/70 p-3 text-xs text-slate-300">
          <p>Alert: {preview.alert ? "Yes" : "No"}</p>
          <p>Score: {preview.score.toFixed(3)} (threshold {preview.threshold.toFixed(2)})</p>
          {preview.note ? <p>Note: {preview.note}</p> : null}
        </div>
      ) : null}
      {error ? <p className="mt-3 text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
