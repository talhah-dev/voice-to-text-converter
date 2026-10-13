'use client';

import React, { useState, useEffect } from 'react';
import { Info } from 'lucide-react';

export interface RateLimitData {
  limit: number;
  remaining: number;
  percentage: number;
  reset: string;
  provider: string;
}

interface RateLimitBadgeProps {
  initialData?: RateLimitData | null;
}

export const RateLimitBadge: React.FC<RateLimitBadgeProps> = ({ initialData }) => {
  const [data, setData] = useState<RateLimitData | null>(initialData || null);
  const [showDetails, setShowDetails] = useState(false);
  const [displayMode, setDisplayMode] = useState<'percent' | 'count'>('percent');

  const fetchRateLimit = async () => {
    try {
      const res = await fetch('/api/rate-limit');
      const json = await res.json();
      if (json.success) {
        setData({
          limit: json.limit,
          remaining: json.remaining,
          percentage: json.percentage,
          reset: json.reset,
          provider: json.provider || 'Groq',
        });
      }
    } catch (err) {
      console.error('Failed to fetch rate limit:', err);
    }
  };

  useEffect(() => {
    if (!initialData) {
      fetchRateLimit();
    } else {
      setData(initialData);
    }
  }, [initialData]);

  if (!data) return null;

  const isLow = data.percentage < 20;
  const isMedium = data.percentage >= 20 && data.percentage < 50;

  const statusColor = isLow
    ? 'text-rose-500 bg-rose-500/10 border-rose-500/30'
    : isMedium
    ? 'text-amber-500 bg-amber-500/10 border-amber-500/30'
    : 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20';

  return (
    <div className="relative inline-block text-left">
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-md transition-all shadow-2xs select-none ${statusColor}`}
      >
        {/* Clickable text to toggle between percent and count */}
        <button
          type="button"
          onClick={() => setDisplayMode((prev) => (prev === 'percent' ? 'count' : 'percent'))}
          className="hover:opacity-85 focus:outline-none cursor-pointer"
          title="Click to toggle between percentage and remaining requests"
        >
          <span>
            {displayMode === 'percent'
              ? `${data.percentage}% Credit`
              : `${data.remaining.toLocaleString()} / ${data.limit.toLocaleString()}`}
          </span>
        </button>

        {/* Info button to toggle popup details */}
        <button
          type="button"
          onClick={() => setShowDetails((prev) => !prev)}
          className="opacity-75 hover:opacity-100 p-0.5 rounded transition-opacity cursor-pointer"
          title="View quota details"
          aria-label="View quota details"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Popover Card */}
      {showDetails && (
        <div className="absolute right-0 top-8 mt-1 w-64 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl z-40 text-xs text-zinc-700 dark:text-zinc-300 animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100 dark:border-zinc-800">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              API Quota Status
            </span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              {data.provider}
            </span>
          </div>

          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span>Remaining Quota</span>
                <span className="font-semibold">{data.percentage}%</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    isLow ? 'bg-rose-500' : isMedium ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, data.percentage))}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between pt-1">
              <span className="text-zinc-500">Available:</span>
              <span className="font-mono font-medium">
                {data.remaining.toLocaleString()} requests
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-500">Daily Limit:</span>
              <span className="font-mono font-medium">
                {data.limit.toLocaleString()} requests
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-500">Resets:</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {data.reset.startsWith('daily') ? 'Daily (every 24h)' : data.reset}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
