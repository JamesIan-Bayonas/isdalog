import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { ShieldExclamationIcon, CircleStackIcon, ChartBarIcon, UsersIcon, ScaleIcon } from '@heroicons/react/24/outline';

export default function BfarDashboard({ auth, metrics = {}, speciesDistribution = [], alerts = [] }) {
    // 1. Establish defensive fallback values to ensure rendering never stalls
    const totalBiomass = metrics?.total_biomass_kg ?? 0;
    const marketVolume = metrics?.total_market_value ?? 0;
    const fleetNodes = metrics?.active_fishermen ?? 0;
    const couriers = metrics?.active_riders ?? 0;

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-2xl text-slate-800 tracking-tight">BFAR Municipal Supervision Gateway</h2>}
        >
            <Head title="BFAR Analytics Monitor" />

            <div className="py-12 bg-slate-50 min-h-screen">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-8">
                    
                    {/* --- SYSTEM CRITICAL SUSTAINABILITY ALERTS (REGULATORY GUARDRAIL) --- */}
                    {alerts.length > 0 && (
                        <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded-r-xl shadow-sm space-y-3">
                            <div className="flex items-center gap-2 text-red-800 font-extrabold text-lg">
                                <ShieldExclamationIcon className="w-6 h-6 animate-bounce text-red-600" />
                                <span>Critical Enforcement Warning: Protected Marine Wildlife Logged</span>
                            </div>
                            <p className="text-sm text-red-700">
                                The system has detected landing events matching species regulated under conservation acts within the Dipolog jurisdiction. Immediate environmental review is recommended.
                            </p>
                            <div className="overflow-x-auto mt-2">
                                <table className="min-w-full divide-y divide-red-200">
                                    <thead>
                                        <tr className="text-left text-xs font-bold text-red-600 uppercase tracking-wider">
                                            <th className="py-2 px-3">Crate ID</th>
                                            <th className="py-2 px-3">Species</th>
                                            <th className="py-2 px-3">Mass (KG)</th>
                                            <th className="py-2 px-3">Operator Source</th>
                                            <th className="py-2 px-3">Timestamp</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-red-100 text-xs font-medium text-red-900">
                                        {alerts.map((alert) => (
                                            <tr key={alert.listing_id} className="hover:bg-red-100/50 transition-colors">
                                                <td className="py-2 px-3 font-mono">#CRATE-{alert.listing_id}</td>
                                                <td className="py-2 px-3 font-bold text-red-700">{alert.fish_name}</td>
                                                <td className="py-2 px-3">{alert.weight_kg} kg</td>
                                                <td className="py-2 px-3">{alert.fisherman_name}</td>
                                                <td className="py-2 px-3">{new Date(alert.captured_at).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* --- TOP-TIER PERFORMANCE AGGREGATION METRICS --- */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                            <div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Biomass Extracted</span>
                                <h4 className="text-3xl font-black text-slate-900 mt-2">
                                    {Number(totalBiomass).toLocaleString()} kg
                                </h4>
                            </div>
                            <ScaleIcon className="w-12 h-12 text-blue-500 bg-blue-50 p-2 rounded-lg" />
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                            <div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Market Value Velocity</span>
                                <h4 className="text-3xl font-black text-emerald-600 mt-2">
                                    ₱{Number(marketVolume).toLocaleString()}
                                </h4>
                            </div>
                            <CircleStackIcon className="w-12 h-12 text-emerald-500 bg-emerald-50 p-2 rounded-lg" />
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                            <div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Registered Harvesters</span>
                                <h4 className="text-3xl font-black text-slate-900 mt-2">
                                    {fleetNodes} Fleet Nodes
                                </h4>
                            </div>
                            <UsersIcon className="w-12 h-12 text-indigo-500 bg-indigo-50 p-2 rounded-lg" />
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                            <div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Logistics Drivers</span>
                                <h4 className="text-3xl font-black text-slate-900 mt-2">
                                    {couriers} Couriers
                                </h4>
                            </div>
                            <ChartBarIcon className="w-12 h-12 text-purple-500 bg-purple-50 p-2 rounded-lg" />
                        </div>
                    </div>

                    {/* --- SPECIES VOLUME QUANTIFICATION LAYER --- */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <div className="mb-4">
                            <h3 className="text-lg font-bold text-slate-900">Municipal Species Biomass Profiling</h3>
                            <p className="text-xs text-slate-500">Volumetric inventory mapping distribution of port landing weights</p>
                        </div>
                        <div className="space-y-4">
                            {speciesDistribution.length === 0 ? (
                                <p className="text-center text-slate-400 text-sm py-6">No historical biomass records cataloged.</p>
                            ) : (
                                speciesDistribution.map((item) => {
                                    // Protect against division-by-zero runtime exceptions
                                    const percentage = totalBiomass > 0 
                                        ? Math.min((item.total_weight / totalBiomass) * 100, 100) 
                                        : 0;
                                    
                                    return (
                                        <div key={item.fish_name} className="space-y-1.5">
                                            <div className="flex justify-between text-sm font-semibold text-slate-700">
                                                <span>{item.fish_name} <span className="text-xs text-slate-400 font-normal">({item.catch_count} batches)</span></span>
                                                <span>{parseFloat(item.total_weight).toLocaleString()} kg ({percentage.toFixed(1)}%)</span>
                                            </div>
                                            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                                                <div 
                                                    className="bg-blue-600 h-full transition-all duration-500"
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