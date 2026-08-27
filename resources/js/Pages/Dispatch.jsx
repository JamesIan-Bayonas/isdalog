import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import { Head, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    TruckIcon,
    ShieldCheckIcon,
    ShieldExclamationIcon,
    KeyIcon,
    MapPinIcon,
    ClockIcon,
    CheckCircleIcon,
    CurrencyDollarIcon,
    ScaleIcon,
    ArrowRightIcon,
    PhoneIcon,
    UserIcon,
    ExclamationTriangleIcon,
    SignalIcon,
    BoltIcon
} from '@heroicons/react/24/outline';

export default function Dispatch({ auth, availableJobs: initialJobs = [], activeRuns: initialRuns = [], riderStatus = 'unverified' }) {
    const [availableJobs, setAvailableJobs] = useState(initialJobs);
    const [activeRuns, setActiveRuns] = useState(initialRuns);

    const [selectedClaimOrder, setSelectedClaimOrder] = useState(null);
    const [selectedDeliverOrder, setSelectedDeliverOrder] = useState(null);

    useEffect(() => {
        setAvailableJobs(initialJobs);
    }, [initialJobs]);

    useEffect(() => {
        setActiveRuns(initialRuns);
    }, [initialRuns]);

    // Background GPS Telemetry Daemon
    useEffect(() => {
        const enRouteRuns = activeRuns.filter(run => run.status === 'en_route');
        if (enRouteRuns.length === 0) return;

        const interval = setInterval(() => {
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;

                        // Push coordinates to the backend for WebSocket distribution
                        enRouteRuns.forEach(run => {
                            axios.post(route('dispatch.location', run.order_id), { latitude, longitude })
                                .catch(err => console.error("GPS Telemetry push failed:", err));
                        });
                    },
                    (error) => console.warn("GPS Tracking Warning:", error.message),
                    { enableHighAccuracy: true, timeout: 5000 }
                );
            }
        }, 10000); // 10-second polling interval

        return () => clearInterval(interval);
    }, [activeRuns]);

    useEffect(() => {
        if (window.Echo) {
            const channel = window.Echo.channel('logistics.dispatch');

            channel.listen('OrderDispatched', (event) => {
                setAvailableJobs((prevJobs) => {
                    if (prevJobs.some((job) => job.order_id === event.order_id)) {
                        return prevJobs;
                    }
                    const newJob = {
                        order_id: event.order_id,
                        fish_name: event.fish_name,
                        weight_kg: event.weight_kg,
                        final_price: event.final_price,
                        origin_port: event.location,
                        delivery_fee: 0.00,
                        created_at: new Date().toISOString(),
                    };
                    return [newJob, ...prevJobs];
                });
            });

            channel.listen('CargoStatusUpdated', (event) => {
                if (event.status === 'en_route') {
                    setAvailableJobs((prevJobs) => prevJobs.filter((job) => job.order_id !== event.order_id));
                }

                if (event.status === 'delivered' || event.status === 'completed') {
                    setActiveRuns((prevRuns) =>
                        prevRuns.map((run) =>
                            run.order_id === event.order_id
                                ? { ...run, status: event.status }
                                : run
                        )
                    );
                }
            });

            return () => {
                window.Echo.leaveChannel('logistics.dispatch');
            };
        }
    }, []);

    const isVerified = riderStatus === 'verified';

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-500/10">
                            <TruckIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="font-black text-xl text-white tracking-tight flex items-center gap-2">
                                Cold-Chain Logistics Dispatch
                                <span className={`text-[10px] font-mono uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full border ${
                                    isVerified 
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                }`}>
                                    {isVerified ? 'Logistics Clearance Active' : 'Pending Verification'}
                                </span>
                            </h2>
                            <p className="text-xs font-mono text-slate-400">Galas Port Command · Chain-of-Custody Routing</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 self-start sm:self-auto text-xs font-mono text-slate-400 bg-slate-900/90 px-4 py-2 rounded-2xl border border-slate-800 shadow-inner">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                            <span>Available: <strong className="text-white">{availableJobs.length}</strong></span>
                        </div>
                        <span className="text-slate-700">|</span>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            <span>Active Runs: <strong className="text-white">{activeRuns.length}</strong></span>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Logistics Dispatch Matrix — IsdaLog" />

            <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

                {/* --- RIDER VERIFICATION STATUS NOTICE --- */}
                {/* {!isVerified && (
                    <div className="rounded-3xl bg-amber-500/10 border border-amber-500/30 p-6 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
                        <div className="flex items-center gap-3.5">
                            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                                <ShieldExclamationIcon className="w-7 h-7" />
                            </div>
                            <div>
                                <h4 className="text-base font-black text-amber-200 tracking-tight">Rider Verification Required</h4>
                                <p className="text-xs font-mono text-amber-300/80 mt-0.5 leading-relaxed">
                                    Your courier credentials and license requirements are currently pending administrative review. You will be cleared to claim cold-chain cargo once certified.
                                </p>
                            </div>
                        </div>
                        <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-3.5 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl shrink-0">
                            Gate Locked
                        </span>
                    </div>
                )} */}

                {/* --- ACTIVE ASSIGNED CUSTODY RUNS --- */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                        <div className="flex items-center gap-2">
                            <BoltIcon className="w-5 h-5 text-cyan-400" />
                            <h3 className="text-base font-black text-white tracking-tight">Active Custody Runs</h3>
                        </div>
                        <span className="text-xs font-mono text-slate-400">Assigned Transit Orders</span>
                    </div>

                    {activeRuns.length === 0 ? (
                        <div className="text-center py-12 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800 text-slate-500 font-mono text-xs">
                            No active cargo assignments currently claimed. Select an available job from the dispatch floor below.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {activeRuns.map((run) => (
                                <div
                                    key={run.order_id}
                                    className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4 flex flex-col justify-between hover:border-slate-700 transition-all"
                                >
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 bg-cyan-950/70 px-2.5 py-0.5 rounded-full border border-cyan-800/60 font-bold">
                                                    Run #{run.order_id}
                                                </span>
                                                <h4 className="text-lg font-black text-white mt-1.5">{run.fish_name}</h4>
                                                <p className="text-xs font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                                                    <MapPinIcon className="w-3.5 h-3.5 text-slate-500" />
                                                    Origin: {run.origin_port || 'Galas Port'}
                                                </p>
                                            </div>

                                            <span className={`text-xs font-mono font-bold uppercase px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                                                run.status === 'en_route'
                                                    ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                                                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                            }`}>
                                                {run.status === 'en_route' && <span className="w-2 h-2 bg-cyan-400 rounded-full animate-ping" />}
                                                {run.status.replace('_', ' ')}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800/80 text-xs font-mono shadow-inner">
                                            <div>
                                                <span className="text-slate-500 text-[10px] uppercase">Cargo Mass</span>
                                                <p className="font-bold text-slate-200 mt-0.5">{run.weight_kg} KG</p>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 text-[10px] uppercase">Consignment Value</span>
                                                <p className="font-bold text-emerald-400 mt-0.5">₱{parseFloat(run.final_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                            </div>
                                        </div>

                                        {run.buyer_name && (
                                            <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800/60 space-y-1 text-xs font-mono">
                                                <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                                                    <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                    <span>Buyer: {run.buyer_name}</span>
                                                </div>
                                                {run.buyer_contact && (
                                                    <div className="flex items-center gap-1.5 text-slate-400">
                                                        <PhoneIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                                        <span>{run.buyer_contact}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {run.status === 'en_route' && (
                                        <button
                                            type="button"
                                            onClick={() => setSelectedDeliverOrder(run)}
                                            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs font-mono uppercase tracking-wider shadow-lg shadow-emerald-600/25 transition-all active:scale-[0.98] cursor-pointer"
                                        >
                                            <KeyIcon className="w-4 h-4" />
                                            <span>Complete Handshake (Input Delivery OTP)</span>
                                        </button>
                                    )}

                                    {run.status === 'delivered' && (
                                        <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-center text-xs font-mono text-emerald-300 flex items-center justify-center gap-2">
                                            <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                                            <span>Cargo Handed Over · Awaiting Escrow Release</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* --- AVAILABLE CARGO DISPATCH FLOOR --- */}
                <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                        <div className="flex items-center gap-2">
                            <ClockIcon className="w-5 h-5 text-cyan-400" />
                            <h3 className="text-base font-black text-white tracking-tight">Available Dispatch Cargo</h3>
                        </div>
                        <span className="text-xs font-mono text-slate-400">Real-Time Port Offload Floor</span>
                    </div>

                    {availableJobs.length === 0 ? (
                        <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800 text-slate-500 font-mono text-xs">
                            No pending consignments awaiting courier dispatch at this time. Telemetry listening for new port harvests...
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {availableJobs.map((job) => (
                                <div
                                    key={job.order_id}
                                    className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 backdrop-blur-xl shadow-xl space-y-4 flex flex-col justify-between transition-all group"
                                >
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-start">
                                            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 bg-cyan-950/70 px-2.5 py-0.5 rounded-full border border-cyan-800/60 font-bold">
                                                Order #{job.order_id}
                                            </span>
                                            <span className="text-xs font-mono font-bold text-slate-300 bg-slate-800/90 border border-slate-700 px-2.5 py-0.5 rounded-xl">
                                                {job.weight_kg} KG
                                            </span>
                                        </div>

                                        <div>
                                            <h4 className="text-lg font-black text-white">{job.fish_name}</h4>
                                            <p className="text-xs font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                                                <MapPinIcon className="w-3.5 h-3.5 text-slate-500" />
                                                {job.origin_port || 'Galas Port (Dockside)'}
                                            </p>
                                        </div>

                                        <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800/80 flex justify-between items-center text-xs font-mono shadow-inner">
                                            <span className="text-slate-500 uppercase text-[10px]">Escrow Value</span>
                                            <span className="font-black text-emerald-400 text-sm">₱{parseFloat(job.final_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>

                                        {job.fisherman_name && (
                                            <div className="text-[11px] font-mono text-slate-400 space-y-0.5 pt-1">
                                                <p className="truncate">Harvester: <span className="text-slate-200 font-semibold">{job.fisherman_name}</span></p>
                                                {job.buyer_name && <p className="truncate">Destination: <span className="text-slate-200 font-semibold">{job.buyer_name}</span></p>}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        // disabled={!isVerified}
                                        onClick={() => setSelectedClaimOrder(job)}
                                        className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-bold text-xs font-mono uppercase tracking-wider shadow-lg shadow-cyan-600/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] cursor-pointer"
                                    >
                                        <KeyIcon className="w-4 h-4" />
                                        <span>Claim Cargo (Verify Pickup OTP)</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>

            {/* --- CLAIM CARGO MODAL --- */}
            {selectedClaimOrder && (
                <ClaimCargoModal
                    order={selectedClaimOrder}
                    show={Boolean(selectedClaimOrder)}
                    onClose={() => setSelectedClaimOrder(null)}
                />
            )}

            {/* --- DELIVER CARGO MODAL --- */}
            {selectedDeliverOrder && (
                <DeliverCargoModal
                    order={selectedDeliverOrder}
                    show={Boolean(selectedDeliverOrder)}
                    onClose={() => setSelectedDeliverOrder(null)}
                />
            )}
        </AuthenticatedLayout>
    );
}

function ClaimCargoModal({ order, show, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        pickup_otp: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('dispatch.claim', order.order_id), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <form onSubmit={submit} className="p-6 bg-slate-950 text-slate-100 rounded-3xl border border-slate-800 space-y-5 shadow-2xl">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                    <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-inner">
                        <KeyIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-white tracking-tight">Claim Port Cargo</h3>
                        <p className="text-xs font-mono text-slate-400">Order #{order.order_id} · {order.fish_name}</p>
                    </div>
                </div>

                <p className="text-xs font-mono text-slate-300 leading-relaxed">
                    Obtain the 6-digit Port Pickup OTP from harvester <strong className="text-white">{order.fisherman_name || 'the fisherman'}</strong> at dockside to verify physical handover.
                </p>

                <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Harvester Pickup OTP
                    </label>
                    <input
                        type="text"
                        maxLength="6"
                        value={data.pickup_otp}
                        onChange={(e) => setData('pickup_otp', e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="••••••"
                        className="w-full bg-slate-900/90 border border-slate-800 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 rounded-2xl py-3.5 px-4 text-center font-mono text-2xl font-black tracking-[0.3em] text-cyan-400 placeholder:text-slate-700 shadow-inner transition-all"
                        autoFocus
                        required
                    />
                    <InputError message={errors.pickup_otp} className="mt-2 text-xs" />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <SecondaryButton type="button" onClick={onClose} disabled={processing} className="!rounded-xl !bg-slate-900 !border-slate-800 !text-slate-300 hover:!bg-slate-800 !text-xs font-mono">
                        Cancel
                    </SecondaryButton>
                    <button
                        type="submit"
                        disabled={processing || data.pickup_otp.length !== 6}
                        className="inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs font-mono uppercase tracking-wider shadow-lg shadow-cyan-600/25 disabled:opacity-50 transition-all cursor-pointer"
                    >
                        {processing ? 'Verifying Handshake...' : 'Confirm Pickup'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

function DeliverCargoModal({ order, show, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        delivery_otp: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('dispatch.deliver', order.order_id), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <form onSubmit={submit} className="p-6 bg-slate-950 text-slate-100 rounded-3xl border border-slate-800 space-y-5 shadow-2xl">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                    <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-inner">
                        <CheckCircleIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-white tracking-tight">Complete Cargo Handshake</h3>
                        <p className="text-xs font-mono text-slate-400">Order #{order.order_id} · {order.fish_name}</p>
                    </div>
                </div>

                <p className="text-xs font-mono text-slate-300 leading-relaxed">
                    Request the 6-digit Delivery Confirmation OTP displayed on buyer <strong className="text-white">{order.buyer_name || 'the merchant'}</strong>'s terminal upon physical inspection.
                </p>

                <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Buyer Delivery OTP
                    </label>
                    <input
                        type="text"
                        maxLength="6"
                        value={data.delivery_otp}
                        onChange={(e) => setData('delivery_otp', e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="••••••"
                        className="w-full bg-slate-900/90 border border-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 rounded-2xl py-3.5 px-4 text-center font-mono text-2xl font-black tracking-[0.3em] text-emerald-400 placeholder:text-slate-700 shadow-inner transition-all"
                        autoFocus
                        required
                    />
                    <InputError message={errors.delivery_otp} className="mt-2 text-xs" />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <SecondaryButton type="button" onClick={onClose} disabled={processing} className="!rounded-xl !bg-slate-900 !border-slate-800 !text-slate-300 hover:!bg-slate-800 !text-xs font-mono">
                        Cancel
                    </SecondaryButton>
                    <button
                        type="submit"
                        disabled={processing || data.delivery_otp.length !== 6}
                        className="inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs font-mono uppercase tracking-wider shadow-lg shadow-emerald-600/25 disabled:opacity-50 transition-all cursor-pointer"
                    >
                        {processing ? 'Verifying Token...' : 'Finalize Delivery'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}