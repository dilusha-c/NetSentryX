import React from 'react';
import type { AlertDoc } from '../api';

interface ThreatIndicatorProps {
    alerts: AlertDoc[];
    className?: string;
}

function getThreatLevel(alerts: AlertDoc[]): {
    level: 'critical' | 'high' | 'medium' | 'low';
    score: number;
    description: string;
} {
    if (!alerts.length) {
        return { level: 'low', score: 0, description: 'No threats detected' };
    }

    const recentAlerts = alerts.filter(a => {
        const alertTime = new Date(a.detected_at).getTime();
        const now = Date.now();
        return now - alertTime < 5 * 60 * 1000; // Last 5 minutes
    });

    const attackCount = recentAlerts.filter(a => a.attack).length;
    const criticalCount = recentAlerts.filter(a => a.attack && a.score >= 0.9).length;

    if (criticalCount >= 3) {
        return { level: 'critical', score: 95, description: 'Critical threat activity' };
    }
    if (criticalCount >= 1 || attackCount >= 5) {
        return { level: 'high', score: 75, description: 'High threat activity' };
    }
    if (attackCount >= 2) {
        return { level: 'medium', score: 50, description: 'Moderate threat activity' };
    }
    if (attackCount >= 1) {
        return { level: 'medium', score: 35, description: 'Low threat activity' };
    }
    return { level: 'low', score: 10, description: 'Network secure' };
}

const levelConfig = {
    critical: {
        color: 'from-red-600 to-red-500',
        bgColor: 'bg-red-500/20',
        borderColor: 'border-red-500/50',
        textColor: 'text-red-400',
        glowColor: 'shadow-glow-rose',
        pulseRing: 'bg-red-500',
        label: 'CRITICAL',
    },
    high: {
        color: 'from-orange-600 to-orange-500',
        bgColor: 'bg-orange-500/20',
        borderColor: 'border-orange-500/50',
        textColor: 'text-orange-400',
        glowColor: 'shadow-glow-amber',
        pulseRing: 'bg-orange-500',
        label: 'HIGH',
    },
    medium: {
        color: 'from-amber-600 to-amber-500',
        bgColor: 'bg-amber-500/20',
        borderColor: 'border-amber-500/50',
        textColor: 'text-amber-400',
        glowColor: 'shadow-glow-amber',
        pulseRing: 'bg-amber-500',
        label: 'MEDIUM',
    },
    low: {
        color: 'from-emerald-600 to-emerald-500',
        bgColor: 'bg-emerald-500/20',
        borderColor: 'border-emerald-500/50',
        textColor: 'text-emerald-400',
        glowColor: 'shadow-glow-emerald',
        pulseRing: 'bg-emerald-500',
        label: 'SECURE',
    },
};

export default function ThreatIndicator({ alerts, className = '' }: ThreatIndicatorProps) {
    const { level, score, description } = getThreatLevel(alerts);
    const config = levelConfig[level];
    const isHighThreat = level === 'critical' || level === 'high';

    return (
        <div className={`relative ${className}`}>
            <div className={`
        relative overflow-hidden rounded-xl border ${config.borderColor} ${config.bgColor}
        backdrop-blur-sm p-4 transition-all duration-300
        ${isHighThreat ? config.glowColor : ''}
      `}>
                {/* Animated background for high threats */}
                {isHighThreat && (
                    <div className="absolute inset-0 opacity-30">
                        <div className={`absolute inset-0 ${config.bgColor} animate-pulse`} />
                    </div>
                )}

                <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            {/* Threat indicator dot with pulse */}
                            <div className="relative">
                                <div className={`w-3 h-3 rounded-full ${config.pulseRing}`} />
                                {isHighThreat && (
                                    <div className={`absolute inset-0 w-3 h-3 rounded-full ${config.pulseRing} animate-ping`} />
                                )}
                            </div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Threat Level
                            </span>
                        </div>
                        <span className={`
              text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded
              ${config.bgColor} ${config.textColor} border ${config.borderColor}
              ${isHighThreat ? 'animate-pulse' : ''}
            `}>
                            {config.label}
                        </span>
                    </div>

                    {/* Gauge visualization */}
                    <div className="relative h-3 bg-slate-800/80 rounded-full overflow-hidden mb-3">
                        {/* Background gradient stops */}
                        <div className="absolute inset-0 flex">
                            <div className="flex-1 bg-gradient-to-r from-emerald-600/20 to-amber-600/20" />
                            <div className="flex-1 bg-gradient-to-r from-amber-600/20 to-orange-600/20" />
                            <div className="flex-1 bg-gradient-to-r from-orange-600/20 to-red-600/20" />
                        </div>

                        {/* Animated fill bar */}
                        <div
                            className={`
                absolute inset-y-0 left-0 bg-gradient-to-r ${config.color}
                transition-all duration-1000 ease-out rounded-full
              `}
                            style={{ width: `${score}%` }}
                        >
                            {/* Shimmer effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                        </div>

                        {/* Marker lines */}
                        <div className="absolute inset-0 flex">
                            <div className="flex-1 border-r border-slate-700/50" />
                            <div className="flex-1 border-r border-slate-700/50" />
                            <div className="flex-1" />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${config.textColor}`}>
                            {description}
                        </p>
                        <p className="text-xs text-slate-500">
                            Last 5 min
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Compact version for header
export function ThreatIndicatorCompact({ alerts }: { alerts: AlertDoc[] }) {
    const { level, description } = getThreatLevel(alerts);
    const config = levelConfig[level];
    const isHighThreat = level === 'critical' || level === 'high';

    return (
        <div className={`
      flex items-center gap-2 px-3 py-1.5 rounded-lg
      ${config.bgColor} border ${config.borderColor}
      transition-all duration-300
      ${isHighThreat ? 'animate-pulse' : ''}
    `}>
            <div className="relative">
                <div className={`w-2 h-2 rounded-full ${config.pulseRing}`} />
                {isHighThreat && (
                    <div className={`absolute inset-0 w-2 h-2 rounded-full ${config.pulseRing} animate-ping`} />
                )}
            </div>
            <span className={`text-xs font-semibold ${config.textColor}`}>
                {config.label}
            </span>
        </div>
    );
}
