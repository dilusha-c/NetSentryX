import React, { useState } from "react";
import type { ConfigDoc } from "../api";

export default function ConfigPanel({
  config,
  onSave,
}: {
  config: ConfigDoc | null;
  onSave: (config: Partial<ConfigDoc>) => Promise<void>;
}) {
  const [threshold, setThreshold] = useState<string>(() =>
    config ? config.threshold.toString() : "0.70"
  );
  const [duration, setDuration] = useState<string>(() =>
    config ? config.block_duration_sec.toString() : "600"
  );
  const [blockingEnabled, setBlockingEnabled] = useState<boolean>(() =>
    config ? config.blocking_enabled !== false : true
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (config) {
      setThreshold(config.threshold.toString());
      setDuration(config.block_duration_sec.toString());
      setBlockingEnabled(config.blocking_enabled !== false);
    }
  }, [config?.threshold, config?.block_duration_sec, config?.blocking_enabled]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const parsedThreshold = Number(threshold);
    const parsedDuration = Number(duration);
    if (Number.isNaN(parsedThreshold) || parsedThreshold < 0 || parsedThreshold > 1) {
      setError("Threshold must be between 0 and 1");
      return;
    }
    if (Number.isNaN(parsedDuration) || parsedDuration <= 0) {
      setError("Block duration must be positive");
      return;
    }
    try {
      setSaving(true);
      await onSave({
        threshold: parsedThreshold,
        block_duration_sec: parsedDuration,
        blocking_enabled: blockingEnabled,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/70 p-4">
      {/* Blocking Toggle */}
      <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-950 p-4">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-slate-100">IP Blocking</h3>
          <p className="text-xs text-slate-500 mt-1">
            Enable or disable automatic IP blocking when attacks are detected
          </p>
        </div>
        <button
          type="button"
          onClick={() => setBlockingEnabled(!blockingEnabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            blockingEnabled ? 'bg-emerald-600' : 'bg-slate-700'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              blockingEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col text-xs uppercase tracking-wide text-slate-400">
          Detection Threshold
          <input
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            className="mt-2 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
          />
        </label>
        <label className="flex flex-col text-xs uppercase tracking-wide text-slate-400">
          Block Duration (seconds)
          <input
            type="number"
            min="1"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="mt-2 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
          />
        </label>
      </div>
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Save Policy
        </button>
      </div>
    </form>
  );
}
