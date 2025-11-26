// Shared IP info cache to avoid duplicate API calls
import React from 'react';

interface IPInfo {
  hostname?: string;
  country?: string;
  loading: boolean;
}

const cache = new Map<string, IPInfo>();
const pending = new Map<string, Promise<IPInfo>>();

export async function getIPInfo(ip: string): Promise<IPInfo> {
  // Check cache first
  if (cache.has(ip)) {
    return cache.get(ip)!;
  }

  // Check if already fetching
  if (pending.has(ip)) {
    return pending.get(ip)!;
  }

  // Start new fetch
  const promise = fetchIPInfo(ip);
  pending.set(ip, promise);

  const result = await promise;
  pending.delete(ip);
  cache.set(ip, result);

  return result;
}

async function fetchIPInfo(ip: string): Promise<IPInfo> {
  // Don't fetch for private/local IPs
  if (ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
    return { hostname: 'Local Network', country: undefined, loading: false };
  }

  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`);
    const data = await res.json();
    
    return {
      hostname: data.org || data.city || 'Unknown',
      country: data.country_name || data.country_code,
      loading: false
    };
  } catch {
    return { hostname: 'Unknown', country: undefined, loading: false };
  }
}

export function useIPInfoCache(ip: string): IPInfo {
  const [info, setInfo] = React.useState<IPInfo>({ loading: true });

  React.useEffect(() => {
    getIPInfo(ip).then(setInfo);
  }, [ip]);

  return info;
}

export function IPInfoDisplay({ ip }: { ip: string }) {
  const info = useIPInfoCache(ip);

  if (info.loading) {
    return <span className="text-xs text-slate-500">Loading...</span>;
  }

  if (!info.hostname) {
    return null;
  }

  return (
    <span className="text-xs text-slate-400">
      {info.hostname}
      {info.country && ` • ${info.country}`}
    </span>
  );
}
