import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import {
    ChartBarIcon,
    ShieldExclamationIcon,
    CircleStackIcon,
    UsersIcon,
    TruckIcon,
    MapPinIcon,
    ArrowTrendingUpIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';

export default function BfarDashboard({
    auth,
    metrics = {},
    speciesDistribution = [],
    catchVolumeTrends = [],
    portDistribution = [],
    alerts = []
}) {
    const [activeTab, setActiveTab] = useState('biomass');

    const maxBiomass = Math.max(...catchVolumeTrends.map((d) => d.biomass_kg), 100);
    const maxValue = Math.max(...catchVolumeTrends.map((d) => d.traded_value), 1000);
    const maxSpeciesWeight = Math.max(...speciesDistribution.map((s) => s.total_weight), 10);

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-black">
                            🛡️
                        </div>
                        <div>
                            <h2 className="font-black text-xl text-slate-900 leading-tight tracking-tight">
                                BFAR Supervisory Gateway & Telemetry
                            </h2>
                            <p className="text-xs font-mono text-slate-500">
                                Region IX Marine Biomass & Sustainability Compliance Desk
                            </p>
                        </div>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Live Conservation Ledger</span>
                    </div>
                </div>
            }
        >
            <Head title="BFAR Maritime Analytics — IsdaLog" />

            <div className="py-8 bg-slate-50 min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                    
                    {/* Top Tier: Telemetry Metric Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                            <div className="flex items-center justify-between text-slate-500">
                                <span className="text-xs font-mono font-bold uppercase tracking-wider">Total Biomass</span>
                                <ChartBarIcon className="w-5 h-5 text-cyan-600" />
                            </div>
                            <div className="text-2xl font-black text-slate-900 font-mono">
                                {Number(metrics.total_biomass_kg || 0).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} <span className="text-sm font-normal text-slate-500">kg</span>
                            </div>
                            <p className="text-[11px] text-slate-500">Aggregated landing volume</p>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                            <div className="flex items-center justify-between text-slate-500">
                                <span className="text-xs font-mono font-bold uppercase tracking-wider">Market Turnover</span>
                                <CircleStackIcon className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div className="text-2xl font-black text-slate-900 font-mono">
                                ₱{Number(metrics.total_market_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <p className="text-[11px] text-slate-500">Gross settled escrow trading</p>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                            <div className="flex items-center justify-between text-slate-500">
                                <span className="text-xs font-mono font-bold uppercase tracking-wider">Avg Market Rate</span>
                                <ArrowTrendingUpIcon className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div className="text-2xl font-black text-slate-900 font-mono">
                                ₱{Number(metrics.avg_price_per_kg || 0).toFixed(2)} <span className="text-sm font-normal text-slate-500">/kg</span>
                            </div>
                            <p className="text-[11px] text-slate-500">Mean municipal valuation</p>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                            <div className="flex items-center justify-between text-slate-500">
                                <span className="text-xs font-mono font-bold uppercase tracking-wider">Harvesters</span>
                                <UsersIcon className="w-5 h-5 text-amber-600" />
                            </div>
                            <div className="text-2xl font-black text-slate-900 font-mono">
                                {metrics.active_fishermen || 0}
                            </div>
                            <p className="text-[11px] text-slate-500">Registered fleet operators</p>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                            <div className="flex items-center justify-between text-slate-500">
                                <span className="text-xs font-mono font-bold uppercase tracking-wider">Logistics Fleet</span>
                                <TruckIcon className="w-5 h-5 text-purple-600" />
                            </div>
                            <div className="text-2xl font-black text-slate-900 font-mono">
                                {metrics.active_riders || 0}
                            </div>
                            <p className="text-[11px] text-slate-500">Active cold-chain couriers</p>
                        </div>
                    </div>

                    {/* Sustainability Infractions Banner */}
                    {alerts.length > 0 && (
                        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl">
                                        <ShieldExclamationIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-rose-900">
                                            Restricted Marine Species Alert ({alerts.length} Flagged Catches)
                                        </h3>
                                        <p className="text-xs text-rose-700">
                                            Catches cross-referenced against BFAR restricted species protection registers.
                                        </p>
                                    </div>
                                </div>
                                <span className="text-xs font-bold font-mono px-3 py-1 bg-rose-200 text-rose-900 rounded-full">
                                    CRITICAL OVERSIGHT
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full text-xs text-left divide-y divide-rose-200">
                                    <thead>
                                        <tr className="text-rose-800 font-mono uppercase tracking-wider">
                                            <th className="py-2 px-3">Listing ID</th>
                                            <th className="py-2 px-3">Protected Species</th>
                                            <th className="py-2 px-3">Harvest Weight</th>
                                            <th className="py-2 px-3">Landing Port</th>
                                            <th className="py-2 px-3">Operator Name</th>
                                            <th className="py-2 px-3">Logged Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-rose-100">
                                        {alerts.map((alert) => (
                                            <tr key={alert.listing_id} className="hover:bg-rose-100/50">
                                                <td className="py-2 px-3 font-mono font-bold">#{alert.listing_id}</td>
                                                <td className="py-2 px-3 font-bold text-rose-950">{alert.fish_name}</td>
                                                <td className="py-2 px-3 font-mono">{alert.weight_kg} kg</td>
                                                <td className="py-2 px-3">{alert.location}</td>
                                                <td className="py-2 px-3 font-semibold">{alert.fisherman_name}</td>
                                                <td className="py-2 px-3 font-mono text-slate-600">{alert.captured_at}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Middle Tier: Time-Series Catch Trends Visualization */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                                    <SparklesIcon className="w-5 h-5 text-cyan-600" />
                                    Historical Catch Volume & Valuation Timeline
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Daily aggregated municipal biomass yields and trading turnover
                                </p>
                            </div>
                            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                                <button
                                    onClick={() => setActiveTab('biomass')}
                                    className={`px-3 py-1.5 rounded-lg transition-all ${
                                        activeTab === 'biomass'
                                            ? 'bg-white text-slate-900 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-900'
                                    }`}
                                >
                                    Biomass (kg)
                                </button>
                                <button
                                    onClick={() => setActiveTab('value')}
                                    className={`px-3 py-1.5 rounded-lg transition-all ${
                                        activeTab === 'value'
                                            ? 'bg-white text-slate-900 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-900'
                                    }`}
                                >
                                    Market Value (₱)
                                </button>
                            </div>
                        </div>

                        {catchVolumeTrends.length === 0 ? (
                            <div className="text-center py-12 text-slate-400 font-mono text-sm">
                                No historical landing records logged in this interval.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="h-64 flex items-end gap-2 sm:gap-4 pt-8 pb-2 border-b border-slate-200 overflow-x-auto">
                                    {catchVolumeTrends.map((point) => {
                                        const value = activeTab === 'biomass' ? point.biomass_kg : point.traded_value;
                                        const max = activeTab === 'biomass' ? maxBiomass : maxValue;
                                        const heightPercent = Math.max(8, Math.round((value / max) * 100));

                                        return (
                                            <div
                                                key={point.date}
                                                className="flex-1 min-w-[48px] flex flex-col items-center gap-2 group relative"
                                            >
                                                {/* Hover Tooltip */}
                                                <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[11px] font-mono py-1 px-2 rounded-lg pointer-events-none whitespace-nowrap z-20 shadow-lg">
                                                    {point.date}: {activeTab === 'biomass' ? `${point.biomass_kg} kg` : `₱${point.traded_value}`} ({point.total_catches} catches)
                                                </div>

                                                <div className="w-full bg-slate-100 rounded-t-lg h-full flex items-end overflow-hidden">
                                                    <div
                                                        style={{ height: `${heightPercent}%` }}
                                                        className={`w-full rounded-t-md transition-all duration-500 ${
                                                            activeTab === 'biomass'
                                                                ? 'bg-gradient-to-t from-cyan-600 to-teal-400 group-hover:from-cyan-500 group-hover:to-teal-300'
                                                                : 'bg-gradient-to-t from-emerald-600 to-green-400 group-hover:from-emerald-500 group-hover:to-green-300'
                                                        }`}
                                                    />
                                                </div>
                                                <span className="text-[10px] font-mono text-slate-400 rotate-45 sm:rotate-0 mt-1">
                                                    {point.date.slice(5)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom Tier: Species Breakdown & Port Distribution */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        
                        {/* Species Distribution */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                                <ChartBarIcon className="w-5 h-5 text-indigo-600" />
                                Species Biomass Matrix
                            </h3>
                            <p className="text-xs text-slate-500">
                                Harvest distribution by taxonomic category
                            </p>

                            <div className="space-y-3 pt-2">
                                {speciesDistribution.map((species) => {
                                    const percent = Math.round((species.total_weight / maxSpeciesWeight) * 100);
                                    return (
                                        <div key={species.fish_name} className="space-y-1">
                                            <div className="flex justify-between text-xs font-semibold text-slate-800">
                                                <span>{species.fish_name}</span>
                                                <span className="font-mono text-slate-600">
                                                    {species.total_weight} kg ({species.catch_count} lots · avg ₱{species.avg_price})
                                                </span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    style={{ width: `${percent}%` }}
                                                    className="h-full bg-indigo-600 rounded-full"
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Port Landing Volume Matrix */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                                <MapPinIcon className="w-5 h-5 text-emerald-600" />
                                Port Landing Volume Distribution
                            </h3>
                            <p className="text-xs text-slate-500">
                                Intake capacity across municipal docking facilities
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                {portDistribution.map((port) => (
                                    <div
                                        key={port.location}
                                        className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                                    >
                                        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                                            <MapPinIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                                            <span>{port.location}</span>
                                        </div>
                                        <div className="text-xl font-black font-mono text-slate-900">
                                            {port.total_weight.toLocaleString()} <span className="text-xs font-normal text-slate-500">kg</span>
                                        </div>
                                        <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                                            <span>{port.total_landings} Landings</span>
                                            <span>₱{Number(port.total_value).toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}