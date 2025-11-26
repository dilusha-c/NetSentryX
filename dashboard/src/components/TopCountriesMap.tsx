import React, { useState, useEffect } from 'react';
import type { BlockDoc } from '../api';

interface CountryData {
  country: string;
  count: number;
  percentage: number;
}

function CountryRow({ country, count, percentage }: CountryData) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-800">
      <div className="flex-1">
        <span className="text-slate-200">{country}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-32 bg-slate-800 rounded-full h-2">
          <div
            className="bg-rose-500 h-2 rounded-full transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-slate-300 w-12 text-right">{count}</span>
      </div>
    </div>
  );
}

export default function TopCountriesMap({ blockedHistory }: { blockedHistory: BlockDoc[] }) {
  const [countryData, setCountryData] = useState<CountryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCountryData() {
      setLoading(true);
      
      if (blockedHistory.length === 0) {
        setCountryData([]);
        setLoading(false);
        return;
      }
      
      // Get unique blocked IPs from history
      const blockedIPs = blockedHistory
        .map(b => b.ip)
        .filter((ip, idx, arr) => arr.indexOf(ip) === idx); // unique

      console.log('Fetching countries for blocked IPs:', blockedIPs);

      // Fetch country for each IP with delay to avoid rate limiting
      const countryResults: string[] = [];
      
      for (const ip of blockedIPs) {
        // Skip local IPs
        if (ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.') || 
            ip.startsWith('172.16.') || ip.startsWith('172.17.') || ip.startsWith('172.18.') ||
            ip.startsWith('172.19.') || ip.startsWith('172.20.') || ip.startsWith('172.21.') ||
            ip.startsWith('172.22.') || ip.startsWith('172.23.') || ip.startsWith('172.24.') ||
            ip.startsWith('172.25.') || ip.startsWith('172.26.') || ip.startsWith('172.27.') ||
            ip.startsWith('172.28.') || ip.startsWith('172.29.') || ip.startsWith('172.30.') ||
            ip.startsWith('172.31.')) {
          continue;
        }

        try {
          const res = await fetch(`https://ipapi.co/${ip}/json/`);
          if (res.ok) {
            const data = await res.json();
            const country = data.country_name || data.country || 'Unknown';
            countryResults.push(country);
            console.log(`${ip} -> ${country}`);
          } else {
            console.warn(`Failed to get country for ${ip}: ${res.status}`);
            countryResults.push('Unknown');
          }
          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (err) {
          console.error(`Error fetching country for ${ip}:`, err);
          countryResults.push('Unknown');
        }
      }

      if (countryResults.length === 0) {
        setCountryData([]);
        setLoading(false);
        return;
      }

      // Count by country
      const counts: Record<string, number> = {};
      countryResults.forEach((country: string) => {
        counts[country] = (counts[country] || 0) + 1;
      });

      const total = Object.values(counts).reduce((sum, c) => sum + c, 0);

      // Convert to array and sort
      const data: CountryData[] = Object.entries(counts)
        .map(([country, count]) => ({
          country,
          count,
          percentage: total > 0 ? (count / total) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10

      console.log('Country data:', data);
      console.log('Total countries found:', Object.keys(counts).length);
      console.log('Full counts:', counts);
      setCountryData(data);
      setLoading(false);
    }

    fetchCountryData();
  }, [blockedHistory]);

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
      <h3 className="text-lg font-semibold text-slate-100 mb-4">
        Top Attacking Countries
        <span className="text-xs text-slate-500 ml-2 font-normal">
          (Total Blocked: {blockedHistory.length} | Unique IPs: {[...new Set(blockedHistory.map(b => b.ip))].length})
        </span>
      </h3>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-slate-500">
          Loading country data...
        </div>
      ) : countryData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-slate-500">
          {blockedHistory.length === 0 ? 'No IPs have been blocked yet' : 'No external IPs to display'}
        </div>
      ) : (
        <div className="space-y-1">
          {countryData.map((data, idx) => (
            <CountryRow key={idx} {...data} />
          ))}
        </div>
      )}
    </div>
  );
}
