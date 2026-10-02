import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import { DialogTitle } from '@headlessui/react';
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
                        <div className="p-2.5 rounded-2xl isd-soft-brand border isd-border-brand isd-text-brand shadow-lg ">
                            <TruckIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="font-black text-xl isd-text-primary tracking-tight flex items-center gap-2">
                                Dispatch Board
                                <span className={`whitespace-nowrap text-[10px] font-mono uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full border ${
                                    isVerified 
                                        ? 'isd-soft-success isd-text-success isd-border-success'
                                        : 'isd-soft-warning isd-text-warning isd-border-warning'
                                }`}>
                                    {isVerified ? 'Verified' : 'Pending'}
                                </span>
                            </h2>
                            <p className="text-sm isd-text-muted">Available jobs and active deliveries at Galas Port</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 self-start sm:self-auto text-xs font-mono isd-text-muted isd-surface px-4 py-2 rounded-2xl border isd-border isd-inset">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full isd-fill-brand animate-pulse" />
                            <span>Available jobs: <strong className="isd-text-primary">{availableJobs.length}</strong></span>
                        </div>
                        <span className="isd-text-secondary">|</span>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full isd-fill-success" />
                            <span>Active deliveries: <strong className="isd-text-primary">{activeRuns.length}</strong></span>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Dispatch — IsdaLog" />

            <div className="isdalog-dispatch-dashboard py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

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
                    <div className="flex items-center justify-between pb-1 border-b isd-border">
                        <div className="flex items-center gap-2">
                            <BoltIcon className="w-5 h-5 isd-text-brand" />
                            <h3 className="text-base font-black isd-text-primary tracking-tight">Active deliveries</h3>
                        </div>
                        <span className="text-xs font-mono isd-text-muted">Jobs assigned to you</span>
                    </div>

                    {activeRuns.length === 0 ? (
                        <div className="isd-empty">
                            You have no active deliveries. Choose an available job below when you are ready.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {activeRuns.map((run) => (
                                <div
                                    key={run.order_id}
                                    className="p-6 rounded-2xl isd-surface border isd-border isd-shadow space-y-4 flex flex-col justify-between isd-hover-border transition-all"
                                >
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="text-[10px] font-mono uppercase tracking-wider isd-text-brand isd-soft-brand px-2.5 py-0.5 rounded-full border isd-border-brand font-bold">
                                                    Run #{run.order_id}
                                                </span>
                                                <h4 className="text-lg font-black isd-text-primary mt-1.5">{run.fish_name}</h4>
                                                <p className="text-xs font-mono isd-text-muted flex items-center gap-1 mt-0.5">
                                                    <MapPinIcon className="w-3.5 h-3.5 isd-text-muted" />
                                                    Pickup: {run.origin_port || 'Galas Port'}
                                                </p>
                                            </div>

                                            <span className={`text-xs font-mono font-bold uppercase px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                                                run.status === 'en_route'
                                                    ? 'isd-soft-brand isd-text-brand isd-border-brand'
                                                    : 'isd-soft-success isd-text-success isd-border-success'
                                            }`}>
                                                {run.status === 'en_route' && <span className="w-2 h-2 isd-fill-brand rounded-full animate-ping" />}
                                                {run.status.replace('_', ' ')}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 p-3.5 isd-subtle rounded-2xl border isd-border text-xs font-mono isd-inset">
                                            <div>
                                                <span className="isd-text-muted text-[10px] uppercase">Cargo weight</span>
                                                <p className="font-bold isd-text-primary mt-0.5">{run.weight_kg} KG</p>
                                            </div>
                                            <div>
                                                <span className="isd-text-muted text-[10px] uppercase">Consignment value</span>
                                                <p className="font-bold isd-text-success mt-0.5">₱{parseFloat(run.final_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                            </div>
                                        </div>

                                        {run.buyer_name && (
                                            <div className="p-3.5 rounded-2xl isd-subtle border isd-border space-y-1 text-xs font-mono">
                                                <div className="flex items-center gap-1.5 isd-text-secondary font-semibold">
                                                    <UserIcon className="w-3.5 h-3.5 isd-text-muted shrink-0" />
                                                    <span>Buyer: {run.buyer_name}</span>
                                                </div>
                                                {run.buyer_contact && (
                                                    <div className="flex items-center gap-1.5 isd-text-muted">
                                                        <PhoneIcon className="w-3.5 h-3.5 isd-text-muted shrink-0" />
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
                                            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl isd-action isd-on-action font-bold text-xs font-mono uppercase tracking-wider shadow-lg transition-all active:scale-[0.98] cursor-pointer"
                                        >
                                            <KeyIcon className="w-4 h-4" />
                                            <span>Complete delivery · Enter OTP</span>
                                        </button>
                                    )}

                                    {run.status === 'delivered' && (
                                        <div className="p-3.5 isd-soft-success border isd-border-success rounded-xl text-center text-xs font-mono isd-text-success flex items-center justify-center gap-2">
                                            <CheckCircleIcon className="w-4 h-4 isd-text-success" />
                                            <span>Delivered · Awaiting buyer confirmation</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* --- AVAILABLE CARGO DISPATCH FLOOR --- */}
                <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between pb-1 border-b isd-border">
                        <div className="flex items-center gap-2">
                            <ClockIcon className="w-5 h-5 isd-text-brand" />
                            <h3 className="text-base font-black isd-text-primary tracking-tight">Available delivery jobs</h3>
                        </div>
                        <span className="text-xs font-mono isd-text-muted">Ready for pickup</span>
                    </div>

                    {availableJobs.length === 0 ? (
                        <div className="isd-empty">
                            No delivery jobs are waiting to be claimed right now.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {availableJobs.map((job) => (
                                <div
                                    key={job.order_id}
                                    className="p-6 rounded-2xl isd-surface border isd-border isd-hover-border isd-shadow space-y-4 flex flex-col justify-between transition-all group"
                                >
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-start">
                                            <span className="text-[10px] font-mono uppercase tracking-wider isd-text-brand isd-soft-brand px-2.5 py-0.5 rounded-full border isd-border-brand font-bold">
                                                Order #{job.order_id}
                                            </span>
                                            <span className="text-xs font-mono font-bold isd-text-secondary isd-subtle border isd-border px-2.5 py-0.5 rounded-xl">
                                                {job.weight_kg} KG
                                            </span>
                                        </div>

                                        <div>
                                            <h4 className="text-lg font-black isd-text-primary">{job.fish_name}</h4>
                                            <p className="text-xs font-mono isd-text-muted flex items-center gap-1 mt-0.5">
                                                <MapPinIcon className="w-3.5 h-3.5 isd-text-muted" />
                                                {job.origin_port || 'Galas Port (Dockside)'}
                                            </p>
                                        </div>

                                        <div className="p-3.5 isd-subtle rounded-2xl border isd-border flex justify-between items-center text-xs font-mono isd-inset">
                                            <span className="isd-text-muted uppercase text-[10px]">Consignment value</span>
                                            <span className="font-black isd-text-success text-sm">₱{parseFloat(job.final_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>

                                        {job.fisherman_name && (
                                            <div className="text-[11px] font-mono isd-text-muted space-y-0.5 pt-1">
                                                <p className="truncate">Harvester: <span className="isd-text-primary font-semibold">{job.fisherman_name}</span></p>
                                                {job.buyer_name && <p className="truncate">Destination: <span className="isd-text-primary font-semibold">{job.buyer_name}</span></p>}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        // disabled={!isVerified}
                                        onClick={() => setSelectedClaimOrder(job)}
                                        className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl isd-action isd-on-action font-bold text-xs font-mono uppercase tracking-wider shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] cursor-pointer"
                                    >
                                        <KeyIcon className="w-4 h-4" />
                                        <span>Claim delivery · Enter pickup OTP</span>
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
            <form onSubmit={submit} className="isd-modal-content p-4 sm:p-6 space-y-5">
                <div className="flex items-center gap-3 border-b isd-border pb-4">
                    <div className="p-2.5 rounded-2xl isd-soft-brand border isd-border-brand isd-text-brand isd-inset">
                        <KeyIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <DialogTitle as="h3" className="text-lg font-black isd-text-primary tracking-tight">Claim delivery</DialogTitle>
                        <p className="text-xs font-mono isd-text-muted">Order #{order.order_id} · {order.fish_name}</p>
                    </div>
                </div>

                <p className="text-xs font-mono isd-text-secondary leading-relaxed">
                    Ask <strong className="isd-text-primary">{order.fisherman_name || 'the fisherman'}</strong> for the 6-digit pickup OTP to confirm the dockside handover.
                </p>

                <div>
                    <label htmlFor="pickup-otp" className="block text-xs font-mono font-bold uppercase tracking-wider isd-text-secondary mb-2">
                        Pickup OTP
                    </label>
                    <input
                        id="pickup-otp"
                        inputMode="numeric"
                        aria-invalid={Boolean(errors.pickup_otp)}
                        aria-describedby={errors.pickup_otp ? 'pickup-otp-error' : undefined}
                        type="text"
                        maxLength="6"
                        value={data.pickup_otp}
                        onChange={(e) => setData('pickup_otp', e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="••••••"
                        className="isd-otp w-full isd-subtle border isd-border-strong isd-focus-field focus:ring-2 rounded-xl py-3.5 px-4 text-center font-mono text-2xl font-black tracking-[0.3em] isd-text-primary isd-placeholder transition-all"
                        autoFocus
                        required
                    />
                    <InputError id="pickup-otp-error" message={errors.pickup_otp} className="mt-2 text-xs" />
                </div>

                <div className="flex flex-wrap justify-end gap-3 pt-2">
                    <SecondaryButton type="button" onClick={onClose} disabled={processing} className="!rounded-xl isd-surface isd-border isd-text-secondary isd-hover-subtle !text-xs font-mono">
                        Cancel
                    </SecondaryButton>
                    <button
                        type="submit"
                        disabled={processing || data.pickup_otp.length !== 6}
                        className="inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl isd-action isd-on-action font-bold text-xs font-mono uppercase tracking-wider shadow-lg disabled:opacity-50 transition-all cursor-pointer"
                    >
                        {processing ? 'Verifying pickup...' : 'Confirm pickup'}
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
            <form onSubmit={submit} className="isd-modal-content p-4 sm:p-6 space-y-5">
                <div className="flex items-center gap-3 border-b isd-border pb-4">
                    <div className="p-2.5 rounded-2xl isd-soft-success border isd-border-success isd-text-success isd-inset">
                        <CheckCircleIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <DialogTitle as="h3" className="text-lg font-black isd-text-primary tracking-tight">Complete delivery</DialogTitle>
                        <p className="text-xs font-mono isd-text-muted">Order #{order.order_id} · {order.fish_name}</p>
                    </div>
                </div>

                <p className="text-xs font-mono isd-text-secondary leading-relaxed">
                    Ask <strong className="isd-text-primary">{order.buyer_name || 'the buyer'}</strong> for the 6-digit delivery OTP after the physical inspection.
                </p>

                <div>
                    <label htmlFor="delivery-otp" className="block text-xs font-mono font-bold uppercase tracking-wider isd-text-secondary mb-2">
                        Delivery OTP
                    </label>
                    <input
                        id="delivery-otp"
                        inputMode="numeric"
                        aria-invalid={Boolean(errors.delivery_otp)}
                        aria-describedby={errors.delivery_otp ? 'delivery-otp-error' : undefined}
                        type="text"
                        maxLength="6"
                        value={data.delivery_otp}
                        onChange={(e) => setData('delivery_otp', e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="••••••"
                        className="isd-otp w-full isd-subtle border isd-border-strong isd-focus-field focus:ring-2 rounded-xl py-3.5 px-4 text-center font-mono text-2xl font-black tracking-[0.3em] isd-text-primary isd-placeholder transition-all"
                        autoFocus
                        required
                    />
                    <InputError id="delivery-otp-error" message={errors.delivery_otp} className="mt-2 text-xs" />
                </div>

                <div className="flex flex-wrap justify-end gap-3 pt-2">
                    <SecondaryButton type="button" onClick={onClose} disabled={processing} className="!rounded-xl isd-surface isd-border isd-text-secondary isd-hover-subtle !text-xs font-mono">
                        Cancel
                    </SecondaryButton>
                    <button
                        type="submit"
                        disabled={processing || data.delivery_otp.length !== 6}
                        className="inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl isd-action isd-on-action font-bold text-xs font-mono uppercase tracking-wider shadow-lg disabled:opacity-50 transition-all cursor-pointer"
                    >
                        {processing ? 'Verifying delivery...' : 'Confirm delivery'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
