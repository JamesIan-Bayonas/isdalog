// resources/js/Pages/Marketplace.jsx
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { 
    TruckIcon, 
    ArrowTrendingUpIcon, 
    ShieldCheckIcon, 
    BanknotesIcon, 
    KeyIcon, 
    ClipboardDocumentCheckIcon,
    ShieldExclamationIcon,
    MapPinIcon,
    ScaleIcon,
    SparklesIcon,
    BoltIcon
} from '@heroicons/react/24/outline';
import DeliveryTracker from '@/Components/DeliveryTracker';
import OrderRatingModal from '@/Components/OrderRatingModal';

export default function Marketplace({ auth, activeListings = [], activeOrders: initialActiveOrders = [], trends = [] }) {
    const [listings, setListings] = useState(activeListings);
    const [orders, setOrders] = useState(initialActiveOrders);
    const [copiedOtpId, setCopiedOtpId] = useState(null);

    useEffect(() => {
        setListings(activeListings);
    }, [activeListings]);

    useEffect(() => {
        setOrders(initialActiveOrders);
    }, [initialActiveOrders]);

    // Global Marketplace Echo Subscription
    useEffect(() => {
        if (window.Echo) {
            const channel = window.Echo.channel('marketplace');

            channel.listen('CatchBidUpdated', (e) => {
                setListings(currentListings =>
                    currentListings.map(listing =>
                        listing.id === e.listing_id
                            ? { ...listing, current_bid: e.current_bid }
                            : listing
                    )
                );
            });

            return () => {
                window.Echo.leaveChannel('marketplace');
            };
        }
    }, []);

    const handleCopyOtp = (orderId, otp) => {
        navigator.clipboard.writeText(otp);
        setCopiedOtpId(orderId);
        setTimeout(() => setCopiedOtpId(null), 2000);
    };

    const handleOrderTelemetryUpdate = (event) => {
        setOrders(currentOrders =>
            currentOrders.map(order =>
                order.order_id === event.order_id
                    ? { ...order, status: event.status }
                    : order
            )
        );
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-500/10">
                            <ArrowTrendingUpIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="font-black text-xl text-white tracking-tight flex items-center gap-2">
                                Live Trading Floor
                                <span className="text-[10px] font-mono uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-500/30">
                                    Real-Time Consignments
                                </span>
                            </h2>
                            <p className="text-xs font-mono text-slate-400">Dipolog Municipal Ports · Auction & Escrow Bidding</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-slate-400">Live Pool:</span>
                            <span className="font-bold text-white">{listings.length} Batches</span>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Live Marketplace Floor — IsdaLog" />

            <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

                {/* --- MARKET TREND INTELLIGENCE ALERTS --- */}
                {trends.length > 0 && (
                    <div className="relative overflow-hidden bg-slate-900/70 p-4 rounded-2xl border border-slate-800 backdrop-blur-xl shadow-xl flex items-center gap-3.5">
                        <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-cyan-500 to-blue-600" />
                        <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 ml-1">
                            <SparklesIcon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-200">
                            Live market price spikes detected in regional landing hubs.
                        </span>
                    </div>
                )}

                {/* --- THE REAL-TIME RECEIVING BAY WITH MAPS & OTP HANDSHAKE --- */}
                {orders.length > 0 && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                            <div className="flex items-center gap-2">
                                <TruckIcon className="w-5 h-5 text-cyan-400" />
                                <h3 className="font-black text-base text-white tracking-tight">Active Consignments Receiving Bay</h3>
                            </div>
                            <span className="text-[10px] font-mono font-bold uppercase text-cyan-400 bg-cyan-950/70 px-2.5 py-0.5 rounded-full border border-cyan-800/60">
                                {orders.length} In Transit
                            </span>
                        </div>

                        {orders.map(order => (
                            <div key={order.order_id} className="bg-slate-900/70 rounded-3xl shadow-2xl border border-slate-800/80 backdrop-blur-xl overflow-hidden">
                                <div className="bg-slate-950/90 border-b border-slate-800 p-4 sm:px-6 flex justify-between items-center text-white">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                                        <h3 className="text-sm font-black font-mono tracking-tight flex items-center gap-2">
                                            <span>Consignment Delivery Tracker: #{order.order_id}</span>
                                        </h3>
                                    </div>
                                    <span className="bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold px-3 py-1 rounded-full">
                                        {order.fish_name} ({order.weight_kg} kg)
                                    </span>
                                </div>

                                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Map Visualization Layout Section */}
                                    <div className="lg:col-span-2 space-y-4">
                                        <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-inner bg-slate-950">
                                            <DeliveryTracker 
                                                orderId={order.order_id}
                                                status={order.status} 
                                                location={order.location} 
                                                onStatusUpdate={handleOrderTelemetryUpdate}
                                            />
                                        </div>
                                    </div>

                                    {/* Escrow & Zero-Trust OTP Handshake Terminal */}
                                    <div className="bg-slate-950/80 p-6 rounded-2xl border border-slate-800/90 flex flex-col justify-between space-y-4 shadow-xl">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                                <div className="flex items-center gap-2">
                                                    <BanknotesIcon className="w-4 h-4 text-emerald-400" />
                                                    <h5 className="font-bold text-slate-200 text-sm">Escrow Custody</h5>
                                                </div>
                                                <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg">
                                                    ₱{parseFloat(order.final_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>

                                            {/* ZERO-TRUST DELIVERY HANDSHAKE BADGE */}
                                            {order.delivery_otp && (
                                                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-inner space-y-2.5">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                                                            <KeyIcon className="w-4 h-4" />
                                                            <span>Delivery Handshake OTP</span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCopyOtp(order.order_id, order.delivery_otp)}
                                                            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
                                                            title="Copy OTP to Clipboard"
                                                        >
                                                            {copiedOtpId === order.order_id ? (
                                                                <ClipboardDocumentCheckIcon className="w-4 h-4 text-emerald-400" />
                                                            ) : (
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                                </svg>
                                                            )}
                                                        </button>
                                                    </div>

                                                    <div className="flex items-center justify-center py-2.5 bg-slate-950 rounded-xl border border-slate-800 tracking-[0.3em] font-mono text-2xl font-black text-cyan-400 shadow-inner">
                                                        {order.delivery_otp}
                                                    </div>

                                                    <p className="text-[10px] font-mono text-slate-400 leading-tight">
                                                        Present this 6-digit cryptographic clearance token to courier upon physical arrival.
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-2">
                                            {order.status === 'pending_dispatch' && (
                                                <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold rounded-xl text-center flex items-center justify-center gap-1.5 shadow-sm">
                                                    <ShieldExclamationIcon className="w-4 h-4 text-amber-400 shrink-0" />
                                                    <span>Awaiting courier dispatch from port dock.</span>
                                                </div>
                                            )}

                                            {order.status === 'en_route' && (
                                                <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold rounded-xl text-center animate-pulse shadow-sm">
                                                    🛵 Courier has claimed cargo. En route to your destination...
                                                </div>
                                            )}

                                            {order.status === 'delivered' && (
                                                <DeliveryConfirmAction order={order} />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* --- LIVE BIDDING GRID CARDS --- */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                        <h3 className="font-black text-base text-white tracking-tight flex items-center gap-2">
                            <BoltIcon className="w-5 h-5 text-amber-400" />
                            Live Consignment Batches
                        </h3>
                        <span className="text-xs font-mono text-slate-400">
                            Sub-second Reverb WebSocket Updates
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {listings.length === 0 ? (
                            <div className="text-slate-500 text-xs font-mono py-16 col-span-full text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl">
                                No active fish listings available on the trading floor right now.
                            </div>
                        ) : (
                            listings.map(listing => (
                                <LiveListingCard key={listing.id} initialListing={listing} auth={auth} />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function DeliveryConfirmAction({ order }) {
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

    return (
        <div className="mt-2">
            <button
                type="button"
                onClick={() => setIsRatingModalOpen(true)}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-600/25 transition-all active:scale-[0.98] text-xs font-mono uppercase tracking-wider cursor-pointer"
            >
                <ShieldCheckIcon className="w-4 h-4" />
                <span>Verify Inspection & Release Escrow</span>
            </button>

            <OrderRatingModal
                order={order}
                isOpen={isRatingModalOpen}
                onClose={() => setIsRatingModalOpen(false)}
            />
        </div>
    );
}

function LiveListingCard({ initialListing, auth }) {
    const [listing, setListing] = useState(initialListing);
    const [isFlashing, setIsFlashing] = useState(false);
    const [imageError, setImageError] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        bid_amount: '',
    });

    useEffect(() => {
        if (window.Echo) {
            const channel = window.Echo.channel(`marketplace.${listing.id}`);

            channel.listen('CatchBidUpdated', (eventData) => {
                setListing(prev => ({
                    ...prev,
                    current_bid: eventData.current_bid
                }));
                setIsFlashing(true);
                setTimeout(() => setIsFlashing(false), 1000);
            });

            return () => window.Echo.leaveChannel(`marketplace.${listing.id}`);
        }
    }, [listing.id]);

    const submitBid = (e) => {
        e.preventDefault();
        post(route('bids.store', listing.id), {
            preserveScroll: true,
            onSuccess: () => setData('bid_amount', ''),
        });
    };

    const hasValidImage = Boolean(listing.image_url) && !imageError;
    const isOwner = auth.user && auth.user.id === listing.user_id;
    const isBuyer = auth.user && auth.user.role === 'buyer';

    return (
        <div className={`bg-slate-900/70 rounded-3xl p-5 border backdrop-blur-xl transition-all duration-300 shadow-xl flex flex-col justify-between space-y-4 hover:border-slate-700 ${
            isFlashing ? 'border-cyan-400 ring-2 ring-cyan-500/40 shadow-cyan-500/20' : 'border-slate-800/80'
        }`}>

            <div className="relative h-48 w-full overflow-hidden rounded-2xl bg-slate-950 border border-slate-800/80">
                {hasValidImage ? (
                    <img
                        src={listing.image_url}
                        alt={listing.fish_name}
                        className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950 p-4 text-center select-none">
                        <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-2 shadow-inner">
                            <svg className="w-8 h-8 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                            </svg>
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-300 tracking-wider uppercase">
                            {listing.fish_name}
                        </span>
                        <span className="text-[10px] font-mono text-cyan-400/80 mt-0.5">
                            Landing: {listing.location}
                        </span>
                    </div>
                )}
                <div className="absolute top-2.5 right-2.5 rounded-xl bg-slate-950/80 px-2.5 py-1 text-[11px] font-mono font-bold text-cyan-400 backdrop-blur-md border border-slate-800 shadow-md">
                    ⚖️ {listing.weight_kg} kg
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="font-black text-white text-lg capitalize tracking-tight">{listing.fish_name}</h4>
                        <div className="flex items-center gap-1 text-xs font-mono text-slate-400 mt-0.5">
                            <MapPinIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{listing.location}</span>
                        </div>
                    </div>
                    <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-xl bg-slate-800/80 text-slate-300 border border-slate-700">
                        {listing.weight_kg} KG
                    </span>
                </div>

                <div className="p-3.5 bg-slate-950/80 rounded-2xl flex justify-between items-center border border-slate-800/80 shadow-inner">
                    <span className="text-xs font-mono font-semibold text-slate-400">Current Highest Bid</span>
                    <span className="text-lg font-black text-emerald-400 font-mono">
                        ₱{parseFloat(listing.current_bid).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                </div>
            </div>

            {/* Role-Gated Action Area */}
            {isOwner ? (
                <AcceptBidAction listing={listing} />
            ) : isBuyer ? (
                <form onSubmit={submitBid} className="space-y-2 pt-1">
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 text-xs font-mono font-bold">₱</span>
                        <input
                            type="number"
                            step="0.01"
                            min={parseFloat(listing.current_bid) + 1}
                            value={data.bid_amount}
                            onChange={(e) => setData("bid_amount", e.target.value)}
                            placeholder={`> ${listing.current_bid}`}
                            className="w-full pl-8 pr-3 py-2.5 text-sm rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono text-white placeholder:text-slate-600 transition-all"
                            required
                        />
                    </div>
                    {errors.bid_amount && <p className="text-xs text-rose-400 font-mono">{errors.bid_amount}</p>}

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl text-xs font-mono uppercase tracking-wider shadow-lg shadow-cyan-600/25 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                    >
                        {processing ? "Transmitting Bid..." : "Place Verified Bid"}
                    </button>
                </form>
            ) : (
                <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-center">
                    <p className="text-xs font-mono text-slate-400">
                        {auth.user?.role === 'fisherman'
                            ? '🐟 Harvest Auction Live · Fellow Harvester View'
                            : '🔒 Bidding open to registered buyers only'}
                    </p>
                </div>
            )}
        </div>
    );
}

function AcceptBidAction({ listing }) {
    const { post, processing } = useForm();

    const acceptBid = () => {
        post(route("listings.accept-bid", listing.id), { preserveScroll: true });
    };

    return (
        <div className="pt-1">
            <button
                onClick={acceptBid}
                disabled={processing}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white py-3 rounded-xl font-bold font-mono shadow-sm shadow-emerald-600/20 disabled:opacity-50 transition-all active:scale-[0.98] text-xs uppercase tracking-wider cursor-pointer"
            >
                {processing ? "Accepting Bid..." : "Accept Highest Bid & Close Auction"}
            </button>
        </div>
    );
}