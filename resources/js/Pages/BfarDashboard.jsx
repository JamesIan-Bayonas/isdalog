import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import {
    ShieldExclamationIcon,
    CircleStackIcon,
    ChartBarIcon,
    UsersIcon,
    ScaleIcon,
    SparklesIcon,
    RadioIcon,
    ShieldCheckIcon,
    ExclamationTriangleIcon,
    ArrowTrendingUpIcon,
    BuildingOffice2Icon
} from '@heroicons/react/24/outline';

export default function BfarDashboard({ auth, metrics = {}, speciesDistribution = [], alerts = [] }) {
    const totalBiomass = metrics?.total_biomass_kg ?? 0;
    const marketVolume = metrics?.total_market_value ?? 0;
    const fleetNodes = metrics?.active_fishermen ?? 0;
    const couriers = metrics?.active_riders ?? 0;

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-sm">
                            <BuildingOffice2Icon className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-black text-xl text-white tracking-tight flex items-center gap-2">
                                BFAR Municipal Supervision Gateway
                                <span className="text-[10px] uppercase font-mono font-bold tracking-widest px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                    Regulatory Clearance
                                </span>
                            </h2>
                            <p className="text-xs font-mono text-slate-400">Zamboanga del Norte · Dipolog Coastal Command</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-xs text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Telemetry Online (8.58° N, 123.33° E)</span>
                    </div>
                </div>
            }
        >
            <Head title="BFAR Municipal Supervision" />

            <div className="min-h-screen bg-[#020617] text-slate-100 py-8 relative overflow-hidden">
                {/* Ambient Nautical Background Lighting */}
                <div className="absolute top-[-10%] left-[-10%] w-[38rem] h-[38rem] bg-gradient-to-br from-cyan-600/10 via-blue-700/[0.05] to-transparent rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[38rem] h-[38rem] bg-gradient-to-tr from-amber-600/[0.08] via-cyan-950/10 to-transparent rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 relative z-10">

                    {/* --- REGULATORY CONSERVATION ALERT BANNER --- */}
                    {alerts.length > 0 && (
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-950/80 via-slate-900/90 to-slate-900/90 border border-red-500/40 p-6 shadow-xl shadow-red-950/40 backdrop-blur-xl">
                            <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-red-500 animate-pulse" />
                            
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-red-500/20">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 animate-bounce">
                                        <ShieldExclamationIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black text-white tracking-wide flex items-center gap-2">
                                            Critical Regulatory Enforcement Alert
                                            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-red-500/30 text-red-300 border border-red-500/50">
                                                {alerts.length} Infraction{alerts.length > 1 ? 's' : ''} Detected
                                            </span>
                                        </h3>
                                        <p className="text-xs text-red-200/80 mt-0.5">
                                            Catch telemetry logged landing species strictly protected under municipal & national fisheries conservation directives.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto mt-4">
                                <table className="min-w-full divide-y divide-red-900/40 text-left">
                                    <thead>
                                        <tr className="text-[11px] font-mono uppercase text-red-400/90 tracking-wider">
                                            <th className="py-2.5 px-3">Crate Batch ID</th>
                                            <th className="py-2.5 px-3">Species Identifier</th>
                                            <th className="py-2.5 px-3">Harvest Mass</th>
                                            <th className="py-2.5 px-3">Harvester Node</th>
                                            <th className="py-2.5 px-3">Audit Timestamp</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-red-950/40 text-xs font-mono">
                                        {alerts.map((alert) => (
                                            <tr key={alert.listing_id} className="hover:bg-red-500/10 transition-colors">
                                                <td className="py-3 px-3 text-white font-bold">#CRATE-{alert.listing_id}</td>
                                                <td className="py-3 px-3 text-red-400 font-bold flex items-center gap-1.5">
                                                    <ExclamationTriangleIcon className="w-4 h-4 text-red-400 shrink-0" />
                                                    {alert.fish_name}
                                                </td>
                                                <td className="py-3 px-3 text-slate-300 font-semibold">{alert.weight_kg} KG</td>
                                                <td className="py-3 px-3 text-slate-300">{alert.fisherman_name}</td>
                                                <td className="py-3 px-3 text-slate-400">{new Date(alert.captured_at).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* --- CORE PERFORMANCE METRIC TILES --- */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {/* Total Biomass */}
                        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-lg relative overflow-hidden group hover:border-cyan-500/40 transition-all duration-300">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-400">Biomass Harvested</span>
                                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:scale-105 transition-transform">
                                    <ScaleIcon className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="mt-4">
                                <h4 className="text-3xl font-black text-white tracking-tight">
                                    {Number(totalBiomass).toLocaleString()} <span className="text-sm font-mono text-cyan-400 font-bold">KG</span>
                                </h4>
                                <p className="text-xs text-slate-400 mt-1 font-mono">Aggregated municipal landings</p>
                            </div>
                        </div>

                        {/* Market Valuation Velocity */}
                        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-400">Market Escrow Volume</span>
                                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-105 transition-transform">
                                    <CircleStackIcon className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="mt-4">
                                <h4 className="text-3xl font-black text-emerald-400 tracking-tight">
                                    ₱{Number(marketVolume).toLocaleString()}
                                </h4>
                                <p className="text-xs text-slate-400 mt-1 font-mono">Total auction transaction flow</p>
                            </div>
                        </div>

                        {/* Active Harvesters */}
                        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-lg relative overflow-hidden group hover:border-indigo-500/40 transition-all duration-300">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-400">Harvester Fleet</span>
                                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover:scale-105 transition-transform">
                                    <UsersIcon className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="mt-4">
                                <h4 className="text-3xl font-black text-white tracking-tight">
                                    {fleetNodes} <span className="text-sm font-mono text-indigo-400 font-bold">Harvesters</span>
                                </h4>
                                <p className="text-xs text-slate-400 mt-1 font-mono">FishR verified vessels</p>
                            </div>
                        </div>

                        {/* Active Couriers */}
                        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-lg relative overflow-hidden group hover:border-violet-500/40 transition-all duration-300">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-400">Logistics Fleet</span>
                                <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 group-hover:scale-105 transition-transform">
                                    <ChartBarIcon className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="mt-4">
                                <h4 className="text-3xl font-black text-white tracking-tight">
                                    {couriers} <span className="text-sm font-mono text-violet-400 font-bold">Couriers</span>
                                </h4>
                                <p className="text-xs text-slate-400 mt-1 font-mono">Active cold-chain logistics</p>
                            </div>
                        </div>
                    </div>

                    {/* --- SPECIES BIOMASS QUANTIFICATION MATRIX --- */}
                    <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-lg space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
                            <div>
                                <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                                    <RadioIcon className="w-5 h-5 text-cyan-400" />
                                    Municipal Species Biomass Distribution
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">Volumetric landing proportion mapped across all registered regional ports</p>
                            </div>
                            <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                                Total Monitored: {speciesDistribution.length} Taxa
                            </span>
                        </div>

                        <div className="space-y-5">
                            {speciesDistribution.length === 0 ? (
                                <div className="text-center py-12 text-slate-500 text-sm font-mono border border-dashed border-slate-800 rounded-xl">
                                    No landed biomass records currently available for telemetry mapping.
                                </div>
                            ) : (
                                speciesDistribution.map((item) => {
                                    const percentage = totalBiomass > 0
                                        ? Math.min((item.total_weight / totalBiomass) * 100, 100)
                                        : 0;

                                    return (
                                        <div key={item.fish_name} className="space-y-2 p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/60 hover:border-slate-700 transition-colors">
                                            <div className="flex justify-between items-center text-xs font-mono">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-white text-sm">{item.fish_name}</span>
                                                    <span className="text-[10px] text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50 font-bold">
                                                        {item.catch_count} {item.catch_count === 1 ? 'batch' : 'batches'}
                                                    </span>
                                                </div>
                                                <span className="text-slate-300 font-bold">
                                                    {parseFloat(item.total_weight).toLocaleString()} KG 
                                                    <span className="text-slate-500 ml-1.5">({percentage.toFixed(1)}%)</span>
                                                </span>
                                            </div>

                                            <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden p-[1px] border border-slate-800">
                                                <div
                                                    className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 h-full rounded-full transition-all duration-700 ease-out"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}