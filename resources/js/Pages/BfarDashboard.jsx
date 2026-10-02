import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import {
    ChartBarIcon,
    ShieldCheckIcon,
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
                <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="isd-bfar-header-icon w-10 h-10 rounded-xl flex items-center justify-center">
                            <ShieldCheckIcon className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div>
                            <h2 className="font-black text-xl isd-text-primary leading-tight tracking-tight">
                                BFAR oversight
                            </h2>
                            <p className="text-xs font-mono isd-text-muted">
                                Regional catch, trade, and compliance activity
                            </p>
                        </div>
                    </div>
                    <div className="isd-bfar-status inline-flex w-fit items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold">
                        <span className="w-2 h-2 rounded-full bg-current" />
                        <span>Compliance overview</span>
                    </div>
                </div>
            }
        >
            <Head title="BFAR oversight — IsdaLog" />

            <div className="isd-bfar-dashboard py-8 isd-canvas min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                    
                    {/* Top Tier: Telemetry Metric Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="isd-surface p-5 rounded-2xl border isd-border shadow-sm space-y-2">
                            <div className="flex items-center justify-between isd-text-muted">
                                <span className="text-xs font-mono font-bold uppercase tracking-wider">Total Biomass</span>
                                <ChartBarIcon className="isd-bfar-icon w-5 h-5" />
                            </div>
                            <div className="text-2xl font-black isd-text-primary font-mono">
                                {Number(metrics.total_biomass_kg || 0).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} <span className="text-sm font-normal isd-text-muted">kg</span>
                            </div>
                            <p className="text-[11px] isd-text-muted">Aggregated landing volume</p>
                        </div>

                        <div className="isd-surface p-5 rounded-2xl border isd-border shadow-sm space-y-2">
                            <div className="flex items-center justify-between isd-text-muted">
                                <span className="text-xs font-mono font-bold uppercase tracking-wider">Market Turnover</span>
                                <CircleStackIcon className="isd-bfar-icon w-5 h-5" />
                            </div>
                            <div className="text-2xl font-black isd-text-primary font-mono">
                                ₱{Number(metrics.total_market_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <p className="text-[11px] isd-text-muted">Gross settled escrow trading</p>
                        </div>

                        <div className="isd-surface p-5 rounded-2xl border isd-border shadow-sm space-y-2">
                            <div className="flex items-center justify-between isd-text-muted">
                                <span className="text-xs font-mono font-bold uppercase tracking-wider">Avg Market Rate</span>
                                <ArrowTrendingUpIcon className="isd-bfar-icon w-5 h-5" />
                            </div>
                            <div className="text-2xl font-black isd-text-primary font-mono">
                                ₱{Number(metrics.avg_price_per_kg || 0).toFixed(2)} <span className="text-sm font-normal isd-text-muted">/kg</span>
                            </div>
                            <p className="text-[11px] isd-text-muted">Mean municipal valuation</p>
                        </div>

                        <div className="isd-surface p-5 rounded-2xl border isd-border shadow-sm space-y-2">
                            <div className="flex items-center justify-between isd-text-muted">
                                <span className="text-xs font-mono font-bold uppercase tracking-wider">Harvesters</span>
                                <UsersIcon className="isd-bfar-icon w-5 h-5" />
                            </div>
                            <div className="text-2xl font-black isd-text-primary font-mono">
                                {metrics.active_fishermen || 0}
                            </div>
                            <p className="text-[11px] isd-text-muted">Registered fleet operators</p>
                        </div>

                        <div className="isd-surface p-5 rounded-2xl border isd-border shadow-sm space-y-2">
                            <div className="flex items-center justify-between isd-text-muted">
                                <span className="text-xs font-mono font-bold uppercase tracking-wider">Logistics Fleet</span>
                                <TruckIcon className="isd-bfar-icon w-5 h-5" />
                            </div>
                            <div className="text-2xl font-black isd-text-primary font-mono">
                                {metrics.active_riders || 0}
                            </div>
                            <p className="text-[11px] isd-text-muted">Active cold-chain couriers</p>
                        </div>
                    </div>

                    {/* Sustainability Infractions Banner */}
                    {alerts.length > 0 && (
                        <div className="isd-bfar-alert isd-soft-danger border isd-border-danger rounded-2xl p-6 shadow-sm space-y-4">
                            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                                <div className="flex min-w-0 items-start gap-3 sm:items-center">
                                    <div className="isd-bfar-alert-icon p-2.5 isd-soft-danger isd-text-danger rounded-xl">
                                        <ShieldExclamationIcon className="w-6 h-6" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="isd-bfar-alert-heading text-base font-bold isd-text-danger">
                                            Restricted Marine Species Alert ({alerts.length} Flagged Catches)
                                        </h3>
                                        <p className="isd-bfar-alert-description text-xs isd-text-danger">
                                            Catches cross-referenced against BFAR restricted species protection registers.
                                        </p>
                                    </div>
                                </div>
                                <span className="isd-bfar-alert-badge shrink-0 text-xs font-bold font-mono px-3 py-1 isd-soft-danger isd-text-danger rounded-full">
                                    CRITICAL OVERSIGHT
                                </span>
                            </div>

                            <div className="isd-scroll-region overflow-x-auto" tabIndex={0} role="region" aria-label="Restricted species alerts">
                                <table className="min-w-full text-xs text-left isd-divide isd-divide">
                                    <thead>
                                        <tr className="isd-text-danger font-mono uppercase tracking-wider">
                                            <th className="py-2 px-3">Listing ID</th>
                                            <th className="py-2 px-3">Protected Species</th>
                                            <th className="py-2 px-3">Harvest Weight</th>
                                            <th className="py-2 px-3">Landing Port</th>
                                            <th className="py-2 px-3">Operator Name</th>
                                            <th className="py-2 px-3">Logged Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="isd-divide isd-divide">
                                        {alerts.map((alert) => (
                                            <tr key={alert.listing_id} className="isd-hover-subtle">
                                                <td className="py-2 px-3 font-mono font-bold">#{alert.listing_id}</td>
                                                <td className="py-2 px-3 font-bold isd-text-danger">{alert.fish_name}</td>
                                                <td className="py-2 px-3 font-mono">{alert.weight_kg} kg</td>
                                                <td className="py-2 px-3">{alert.location}</td>
                                                <td className="py-2 px-3 font-semibold">{alert.fisherman_name}</td>
                                                <td className="py-2 px-3 font-mono isd-text-secondary">{alert.captured_at}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Middle Tier: Time-Series Catch Trends Visualization */}
                    <div className="isd-surface p-6 rounded-2xl border isd-border shadow-sm space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-black isd-text-primary tracking-tight flex items-center gap-2">
                                    <SparklesIcon className="w-5 h-5 isd-text-brand" />
                                    Catch volume and trade value
                                </h3>
                                <p className="text-xs isd-text-muted">
                                    Daily aggregated municipal biomass yields and trading turnover
                                </p>
                            </div>
                            <div role="group" aria-label="Chart measurement" className="flex flex-wrap items-center gap-1 isd-subtle p-1 rounded-xl border isd-border text-xs font-bold">
                                <button
                                    onClick={() => setActiveTab('biomass')}
                                    aria-pressed={activeTab === 'biomass'}
                                    className={`px-3 py-1.5 rounded-lg transition-all ${
                                        activeTab === 'biomass'
                                            ? 'isd-surface isd-text-primary shadow-sm'
                                            : 'isd-text-muted isd-hover-text'
                                    }`}
                                >
                                    Biomass (kg)
                                </button>
                                <button
                                    onClick={() => setActiveTab('value')}
                                    aria-pressed={activeTab === 'value'}
                                    className={`px-3 py-1.5 rounded-lg transition-all ${
                                        activeTab === 'value'
                                            ? 'isd-surface isd-text-primary shadow-sm'
                                            : 'isd-text-muted isd-hover-text'
                                    }`}
                                >
                                    Market Value (₱)
                                </button>
                            </div>
                        </div>

                        {catchVolumeTrends.length === 0 ? (
                            <div className="isd-empty">
                                No historical landing records logged in this interval.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="h-64 flex items-end gap-2 sm:gap-4 pt-8 pb-2 border-b isd-border overflow-x-auto">
                                    {catchVolumeTrends.map((point) => {
                                        const value = activeTab === 'biomass' ? point.biomass_kg : point.traded_value;
                                        const max = activeTab === 'biomass' ? maxBiomass : maxValue;
                                        const heightPercent = Math.max(8, Math.round((value / max) * 100));

                                        return (
                                            <div
                                                key={point.date}
                                                className="flex-none w-14 h-full flex flex-col items-center gap-2 group relative"
                                            >
                                                {/* Hover Tooltip */}
                                                <div className="isd-chart-tooltip absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-mono py-1 px-2 rounded-lg pointer-events-none whitespace-nowrap z-20 shadow-lg">
                                                    {point.date}: {activeTab === 'biomass' ? `${point.biomass_kg} kg` : `₱${point.traded_value}`} ({point.total_catches} catches)
                                                </div>

                                                <div className="w-full isd-subtle rounded-t-lg flex-1 min-h-0 flex items-end overflow-hidden">
                                                    <div
                                                        style={{ height: `${heightPercent}%` }}
                                                        role="img"
                                                        aria-label={`${point.date}: ${activeTab === 'biomass' ? `${point.biomass_kg} kg` : `₱${point.traded_value}`}, ${point.total_catches} catches`}
                                                        className={`w-full rounded-t-md transition-[height] duration-300 ${
                                                            activeTab === 'biomass'
                                                                ? 'isd-bfar-chart-biomass'
                                                                : 'isd-bfar-chart-value'
                                                        }`}
                                                    />
                                                </div>
                                                <span className="text-[10px] font-mono isd-text-muted rotate-45 sm:rotate-0 mt-1">
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
                        <div className="isd-surface p-6 rounded-2xl border isd-border shadow-sm space-y-4">
                            <h3 className="text-base font-black isd-text-primary tracking-tight flex items-center gap-2">
                                <ChartBarIcon className="w-5 h-5 isd-text-brand" />
                                Catch by species
                            </h3>
                            <p className="text-xs isd-text-muted">
                                Harvest distribution by taxonomic category
                            </p>

                            <div className="space-y-3 pt-2">
                                {speciesDistribution.length === 0 && <p className="isd-empty">No species records are available for this overview.</p>}
                                {speciesDistribution.map((species) => {
                                    const percent = Math.round((species.total_weight / maxSpeciesWeight) * 100);
                                    return (
                                        <div key={species.fish_name} className="space-y-1">
                                            <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs font-semibold isd-text-primary">
                                                <span>{species.fish_name}</span>
                                                <span className="font-mono isd-text-secondary">
                                                    {species.total_weight} kg ({species.catch_count} lots · avg ₱{species.avg_price})
                                                </span>
                                            </div>
                                            <div className="h-2 w-full isd-subtle rounded-full overflow-hidden">
                                                <div
                                                    style={{ width: `${percent}%` }}
                                                    className="h-full isd-fill-brand rounded-full"
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Port Landing Volume Matrix */}
                        <div className="isd-surface p-6 rounded-2xl border isd-border shadow-sm space-y-4">
                            <h3 className="text-base font-black isd-text-primary tracking-tight flex items-center gap-2">
                                <MapPinIcon className="w-5 h-5 isd-text-success" />
                                Landings by port
                            </h3>
                            <p className="text-xs isd-text-muted">
                                Intake capacity across municipal docking facilities
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                {portDistribution.length === 0 && <p className="isd-empty col-span-full">No port landings are available for this overview.</p>}
                                {portDistribution.map((port) => (
                                    <div
                                        key={port.location}
                                        className="p-4 rounded-xl isd-subtle border isd-border space-y-2"
                                    >
                                        <div className="flex items-center gap-2 isd-text-primary font-bold text-sm">
                                            <MapPinIcon className="w-4 h-4 isd-text-success shrink-0" />
                                            <span>{port.location}</span>
                                        </div>
                                        <div className="text-xl font-black font-mono isd-text-primary">
                                            {port.total_weight.toLocaleString()} <span className="text-xs font-normal isd-text-muted">kg</span>
                                        </div>
                                        <div className="flex justify-between text-[11px] isd-text-muted font-mono">
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
