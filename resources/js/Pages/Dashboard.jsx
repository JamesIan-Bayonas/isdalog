import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import {
    ScaleIcon,
    ArchiveBoxIcon,
    BoltIcon,
    RadioIcon,
    ShieldCheckIcon,
    ClockIcon,
    XMarkIcon,
    PhoneIcon,
    IdentificationIcon,
} from '@heroicons/react/24/outline';

export default function Dashboard({ auth, totalWeight, totalCatches, recentCatches, chartData }) {
    const [showFishermanForm, setShowFishermanForm] = useState(false);

    const { data, setData, post, processing } = useForm({
        requested_role: 'fisherman',
        contact_number: '',
        bfar_registration_number: '',
    });

    const submitRequest = (e) => {
        e.preventDefault();
        post(route('profile.upgrade.request'), {
            preserveScroll: true,
            onSuccess: () => setShowFishermanForm(false),
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-slate-800 leading-tight">Marketplace Dashboard</h2>}
        >
            <Head title="Dashboard" />

            <div className="py-12 max-w-7xl mx-auto sm:px-6 lg:px-8">

                {/* --- PROGRESSIVE ONBOARDING BANNER --- */}
                {auth.user.role === 'buyer' && !auth.user.requested_role && !showFishermanForm && (
                    <div className="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-sm">
                        <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-cyan-500 to-blue-600" />
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pl-2">
                            <div className="flex items-start gap-3.5">
                                <div className="p-2.5 rounded-xl bg-cyan-50 border border-cyan-100 shrink-0">
                                    <BoltIcon className="w-5 h-5 text-cyan-600" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Work with IsdaLog</h3>
                                    <p className="text-sm text-slate-500 mt-1 max-w-md">
                                        Are you a maritime worker at Galas Port? Upgrade your account to access the Escrow Hub and Zero-Typing AI Bot.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowFishermanForm(true)}
                                className="shrink-0 inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-bold py-2.5 px-5 rounded-xl shadow-sm shadow-cyan-600/20 transition-all active:scale-[0.98]"
                            >
                                Apply as Fisherman
                            </button>
                        </div>
                    </div>
                )}

                {/* --- PENDING REVIEW STATE --- */}
                {auth.user.requested_role && auth.user.role === 'buyer' && (
                    <div className="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-5 mb-6 shadow-sm">
                        <div className="absolute inset-y-0 left-0 w-1.5 bg-amber-500" />
                        <div className="flex items-start gap-3.5 pl-2">
                            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 shrink-0">
                                <ClockIcon className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-slate-900">Verification Pending</h3>
                                <p className="text-sm text-slate-500 mt-0.5">
                                    Your request to become a <span className="font-semibold text-slate-700">{auth.user.requested_role}</span> is currently being reviewed by an administrator. We are verifying your submitted IDs.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- THE UPGRADE FORM --- */}
                {showFishermanForm && (
                    <div className="bg-white p-6 mb-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-base font-bold text-slate-900">Fisherman Verification Form</h3>
                            <button
                                type="button"
                                onClick={() => setShowFishermanForm(false)}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                                aria-label="Close form"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={submitRequest} className="space-y-4 max-w-md">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Active Contact Number</label>
                                <div className="mt-1.5 relative rounded-xl group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-500 transition-colors">
                                        <PhoneIcon className="h-5 w-5" />
                                    </div>
                                    <input
                                        type="text"
                                        value={data.contact_number}
                                        onChange={e => setData('contact_number', e.target.value)}
                                        className="block w-full rounded-xl border-slate-300 bg-slate-50 pl-11 py-3 text-sm shadow-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 focus:bg-white transition-all"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">BFAR Registration Number (FishR)</label>
                                <div className="mt-1.5 relative rounded-xl group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-500 transition-colors">
                                        <IdentificationIcon className="h-5 w-5" />
                                    </div>
                                    <input
                                        type="text"
                                        value={data.bfar_registration_number}
                                        onChange={e => setData('bfar_registration_number', e.target.value)}
                                        className="block w-full rounded-xl border-slate-300 bg-slate-50 pl-11 py-3 text-sm shadow-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 focus:bg-white transition-all placeholder:text-slate-400"
                                        placeholder="e.g. PH-1234-5678"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-3 pt-1">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-sm shadow-cyan-600/20 disabled:opacity-50 transition-all active:scale-[0.98]"
                                >
                                    {processing ? 'Submitting...' : 'Submit for Review'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowFishermanForm(false)}
                                    className="text-sm font-semibold text-slate-500 hover:text-slate-700 px-4 py-2.5 rounded-xl hover:bg-slate-100 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* LIVE ECOSYSTEM METRICS                                                     */}
                {/* ========================================================================= */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Total Volume Logged</p>
                            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                                <ScaleIcon className="w-4 h-4 text-emerald-600" />
                            </div>
                        </div>
                        <p className="text-3xl font-black text-slate-900 mt-3">
                            {totalWeight ?? 0} <span className="text-lg font-bold text-slate-400">KG</span>
                        </p>
                        <p className="text-xs text-slate-400 mt-1">Aggregated across active harbor pools</p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Total Recorded Catches</p>
                            <div className="p-2 rounded-lg bg-cyan-50 border border-cyan-100">
                                <ArchiveBoxIcon className="w-4 h-4 text-cyan-600" />
                            </div>
                        </div>
                        <p className="text-3xl font-black text-slate-900 mt-3">{totalCatches ?? 0}</p>
                        <p className="text-xs text-slate-400 mt-1">Verified via local Edge AI pipelines</p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">System Operational Mode</p>
                            <div className="p-2 rounded-lg bg-violet-50 border border-violet-100">
                                <RadioIcon className="w-4 h-4 text-violet-600" />
                            </div>
                        </div>
                        <p className="text-lg font-bold text-violet-600 mt-3 flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
                            Defense-Ready
                        </p>
                        <p className="text-xs text-slate-400 mt-1">RTX 4060 local acceleration active</p>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* LIVE ECOSYSTEM AUDIT LOG                                                   */}
                {/* ========================================================================= */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <RadioIcon className="w-4 h-4 text-cyan-500" />
                            Live Real-Time Activity Ledger
                        </h2>
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                            <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-500" />
                            BFAR Compliant
                        </span>
                    </div>
                    <div className="space-y-2.5">
                        {recentCatches && recentCatches.length > 0 ? (
                            recentCatches.map((catchItem, index) => (
                                <div key={catchItem.id ?? index} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100/80 transition-colors">
                                    <div>
                                        <p className="text-sm text-slate-800 font-semibold">
                                            Automated ingestion loop detected: <span className="text-cyan-600">{catchItem.species ?? 'Unknown Species'}</span>
                                        </p>
                                        <span className="text-xs text-slate-400 font-normal">
                                            Mass parameters committed: <strong className="text-slate-500">{catchItem.weight} KG</strong> · Port Context: Galas Port
                                        </span>
                                    </div>
                                    <span className="text-xs text-slate-500 font-mono bg-white px-2.5 py-1 rounded-lg border border-slate-200 shrink-0 ml-4">
                                        {catchItem.created_at ? catchItem.created_at.split(' ')[1] ?? 'Recent' : 'Just Now'}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
                                No recent entries detected. Fire catch data from your Telegram Bot node to see this view update in real-time.
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </AuthenticatedLayout>
    );
}