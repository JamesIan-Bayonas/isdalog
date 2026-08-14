// resources/js/Pages/Dashboard.jsx
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { useState } from 'react';
import { 
    ScaleIcon, 
    CircleStackIcon, 
    SparklesIcon, 
    ShoppingBagIcon, 
    TruckIcon, 
    ArrowTrendingUpIcon, 
    ClockIcon,
    ShieldCheckIcon,
    PlusCircleIcon
} from '@heroicons/react/24/outline';

export default function Dashboard({ auth, role_context = 'buyer', metrics = {}, recentActivity = [] }) {
    const userRole = role_context || auth.user.role || 'buyer';
    const [showFishermanForm, setShowFishermanForm] = useState(false);
    
    // Form for buyers requesting an upgrade
    const { data, setData, post, processing } = useForm({
        requested_role: 'fisherman',
        contact_number: auth.user.contact_number || '',
        bfar_registration_number: '',
    });

    const submitUpgrade = (e) => {
        e.preventDefault();
        post(route('profile.upgrade.request'), {
            preserveScroll: true,
            onSuccess: () => setShowFishermanForm(false),
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <h2 className="font-black text-2xl text-slate-900 tracking-tight">
                            {userRole === 'fisherman' && '🎣 Fisherman Harbor Terminal'}
                            {userRole === 'buyer' && '🛍️ Consignment Trading Desk'}
                            {userRole === 'rider' && '🚚 Fleet Logistics Station'}
                        </h2>
                        <p className="text-xs text-slate-500 font-medium">
                            Node Identity: <span className="font-mono text-slate-700 font-bold">{auth.user.name}</span> • Terminal Context: <span className="text-cyan-700 font-bold capitalize">{userRole}</span>
                        </p>
                    </div>

                    {userRole === 'fisherman' && (
                        <Link
                            href={route('marketplace.index')}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-[0.98]"
                        >
                            <PlusCircleIcon className="w-4 h-4" />
                            <span>View Live Auctions</span>
                        </Link>
                    )}
                </div>
            }
        >
            <Head title={`${userRole.toUpperCase()} Terminal — IsdaLog`} />

            <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                
                {/* ========================================================================= */}
                {/* 1. BUYER ROLE BANNER & UPGRADE WORKFLOW                                   */}
                {/* ========================================================================= */}
                {userRole === 'buyer' && !auth.user.requested_role && !showFishermanForm && (
                    <div className="bg-gradient-to-r from-cyan-950 to-slate-900 border border-cyan-500/30 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-white">
                        <div className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[11px] font-bold">
                                <SparklesIcon className="w-3.5 h-3.5" />
                                <span>Harbor Maritime Access</span>
                            </div>
                            <h3 className="text-lg font-black text-white">Harvesting Catch at Galas Port?</h3>
                            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                                Upgrade your account to a certified Fisherman profile to access Telegram Zero-Typing AI Logging and direct catch auctioning.
                            </p>
                        </div>
                        <button 
                            onClick={() => setShowFishermanForm(true)}
                            className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-all shrink-0"
                        >
                            Apply as Fisherman
                        </button>
                    </div>
                )}

                {/* UPGRADE SUBMISSION MODAL / FORM */}
                {showFishermanForm && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-base font-bold text-slate-900">Fisherman BFAR Verification Form</h3>
                            <button onClick={() => setShowFishermanForm(false)} className="text-xs text-slate-400 hover:text-slate-600">Cancel</button>
                        </div>
                        <form onSubmit={submitUpgrade} className="space-y-4 max-w-md">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Active Mobile Number</label>
                                <input 
                                    type="text" 
                                    value={data.contact_number}
                                    onChange={e => setData('contact_number', e.target.value)}
                                    placeholder="09123456789"
                                    className="mt-1 block w-full rounded-xl border-slate-300 text-sm focus:border-cyan-500 focus:ring-cyan-500"
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">BFAR FishR Registration Number</label>
                                <input 
                                    type="text" 
                                    value={data.bfar_registration_number}
                                    onChange={e => setData('bfar_registration_number', e.target.value)}
                                    placeholder="e.g. PH-ZN-2026-0041"
                                    className="mt-1 block w-full rounded-xl border-slate-300 text-sm focus:border-cyan-500 focus:ring-cyan-500"
                                    required 
                                />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button 
                                    type="submit" 
                                    disabled={processing}
                                    className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs py-2.5 px-5 rounded-xl transition"
                                >
                                    Submit Credentials
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setShowFishermanForm(false)}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* 2. DYNAMIC ROLE TELEMETRY METRIC CARDS                                     */}
                {/* ========================================================================= */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    {/* --- FISHERMAN METRICS --- */}
                    {userRole === 'fisherman' && (
                        <>
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                                <div>
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Harvest Volume</span>
                                    <h4 className="text-2xl font-black text-slate-900 mt-1">{Number(metrics.totalWeight ?? 0).toLocaleString()} <span className="text-sm font-semibold text-slate-400">KG</span></h4>
                                    <span className="text-[11px] text-cyan-600 font-semibold">Port Ingestion Ledger</span>
                                </div>
                                <div className="p-3 bg-cyan-50 rounded-xl text-cyan-600">
                                    <ScaleIcon className="w-6 h-6" />
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                                <div>
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Verified Catches</span>
                                    <h4 className="text-2xl font-black text-slate-900 mt-1">{metrics.totalCatches ?? 0} <span className="text-sm font-semibold text-slate-400">Batches</span></h4>
                                    <span className="text-[11px] text-emerald-600 font-semibold">AI Vision Validated</span>
                                </div>
                                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                                    <ShieldCheckIcon className="w-6 h-6" />
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                                <div>
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Auctions</span>
                                    <h4 className="text-2xl font-black text-slate-900 mt-1">{metrics.activeAuctions ?? 0} <span className="text-sm font-semibold text-slate-400">Crates</span></h4>
                                    <span className="text-[11px] text-blue-600 font-semibold">On Live Floor</span>
                                </div>
                                <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                                    <ArrowTrendingUpIcon className="w-6 h-6" />
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                                <div>
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">AI Bot Gateway</span>
                                    <h4 className="text-base font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        Connected
                                    </h4>
                                    <span className="text-[10px] text-slate-400 font-mono">Telegram @IsdaLogBot</span>
                                </div>
                                <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                                    <SparklesIcon className="w-6 h-6" />
                                </div>
                            </div>
                        </>
                    )}

                    {/* --- BUYER METRICS --- */}
                    {userRole === 'buyer' && (
                        <>
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                                <div>
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Bids Placed</span>
                                    <h4 className="text-2xl font-black text-slate-900 mt-1">{metrics.activeBids ?? 0}</h4>
                                    <span className="text-[11px] text-cyan-600 font-semibold">Trading Floor</span>
                                </div>
                                <div className="p-3 bg-cyan-50 rounded-xl text-cyan-600">
                                    <ArrowTrendingUpIcon className="w-6 h-6" />
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                                <div>
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Won Consignments</span>
                                    <h4 className="text-2xl font-black text-slate-900 mt-1">{metrics.wonAuctions ?? 0}</h4>
                                    <span className="text-[11px] text-emerald-600 font-semibold">Ready for Dispatch</span>
                                </div>
                                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                                    <ShoppingBagIcon className="w-6 h-6" />
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                                <div>
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Secured Escrow Wallet</span>
                                    <h4 className="text-2xl font-black text-emerald-600 mt-1">₱{Number(metrics.walletBalance ?? auth.user.wallet_balance ?? 0).toLocaleString()}</h4>
                                    <span className="text-[11px] text-slate-400 font-semibold">Guaranteed Balance</span>
                                </div>
                                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                                    <CircleStackIcon className="w-6 h-6" />
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                                <div>
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Marketplace Access</span>
                                    <h4 className="text-base font-bold text-slate-900 mt-1">Live Trading</h4>
                                    <Link href={route('marketplace.index')} className="text-[11px] text-cyan-600 font-bold hover:underline">Open Trading Floor →</Link>
                                </div>
                                <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                                    <ShoppingBagIcon className="w-6 h-6" />
                                </div>
                            </div>
                        </>
                    )}

                    {/* --- RIDER METRICS --- */}
                    {userRole === 'rider' && (
                        <>
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                                <div>
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Completed Runs</span>
                                    <h4 className="text-2xl font-black text-slate-900 mt-1">{metrics.completedDeliveries ?? 0}</h4>
                                    <span className="text-[11px] text-emerald-600 font-semibold">Verified Chain-of-Custody</span>
                                </div>
                                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                                    <ShieldCheckIcon className="w-6 h-6" />
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                                <div>
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Harbor Jobs Ready</span>
                                    <h4 className="text-2xl font-black text-purple-600 mt-1">{metrics.pendingDispatch ?? 0}</h4>
                                    <span className="text-[11px] text-slate-400 font-semibold">Awaiting Courier Claim</span>
                                </div>
                                <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                                    <TruckIcon className="w-6 h-6" />
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between col-span-1 sm:col-span-2">
                                <div>
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Logistics Station</span>
                                    <h4 className="text-base font-bold text-slate-900 mt-1">Galas Port Dispatch Desk</h4>
                                    <Link href={route('dispatch.index')} className="text-[11px] text-cyan-600 font-bold hover:underline">Open Cargo Board →</Link>
                                </div>
                                <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                                    <TruckIcon className="w-6 h-6" />
                                </div>
                            </div>
                        </>
                    )}

                </div>

                {/* ========================================================================= */}
                {/* 3. LIVE ACTIVITY LEDGER                                                   */}
                {/* ========================================================================= */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                            <ClockIcon className="w-5 h-5 text-slate-500" />
                            <h3 className="font-bold text-sm text-slate-900">
                                {userRole === 'fisherman' ? 'Recent Catch Telemetry Logs' : 'Recent Consignment Activity'}
                            </h3>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            BFAR COMPLIANT
                        </span>
                    </div>

                    <div className="space-y-2.5">
                        {recentActivity && recentActivity.length > 0 ? (
                            recentActivity.map((item, idx) => (
                                <div key={item.id ?? idx} className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-100 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-cyan-500" />
                                        <div>
                                            <p className="text-xs font-bold text-slate-800">
                                                {item.species || item.fish_name || 'Catch Batch Logged'}
                                            </p>
                                            <p className="text-[11px] text-slate-400">
                                                {item.weight ? `${item.weight} KG recorded` : ''}
                                                {item.amount ? `Bid Placed: ₱${parseFloat(item.amount).toLocaleString()}` : ''}
                                                {' '}• Location: Galas Port
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-[11px] font-mono text-slate-400 bg-white px-2 py-1 rounded border border-slate-200">
                                        {item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="py-12 text-center text-slate-400 text-xs">
                                <p>No recent activity entries recorded for this account.</p>
                                {userRole === 'fisherman' && (
                                    <p className="mt-1 text-cyan-600 font-semibold">
                                        Send a catch photo via Telegram bot to view instant live telemetry here.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </AuthenticatedLayout>
    );
}