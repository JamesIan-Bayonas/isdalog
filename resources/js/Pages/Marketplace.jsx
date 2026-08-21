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
    ShieldExclamationIcon
} from '@heroicons/react/24/outline';
import DeliveryTracker from '@/Components/DeliveryTracker';

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
        <AuthenticatedLayout user={auth.user} header={<h2 className="font-semibold text-xl text-slate-800 leading-tight">Live Trading Floor</h2>}>
            <Head title="Marketplace" />

            <div className="py-12 max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-8">

                {/* --- MARKET TREND INTELLIGENCE ALERTS --- */}
                {trends.length > 0 && (
                    <div className="relative overflow-hidden bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5">
                        <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-cyan-500 to-blue-600" />
                        <div className="p-2 rounded-lg bg-cyan-50 border border-cyan-100 ml-2">
                            <ArrowTrendingUpIcon className="w-4 h-4 text-cyan-600" />
                        </div>
                        <span className="text-sm font-semibold text-slate-700">Live market spikes detected in Dipolog trading hubs.</span>
                    </div>
                )}

                {/* --- THE REAL-TIME RECEIVING BAY WITH MAPS & OTP HANDSHAKE --- */}
                {orders.length > 0 && (
                    <div className="space-y-6">
                        {orders.map(order => (
                            <div key={order.order_id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-4 flex justify-between items-center">
                                    <h3 className="text-sm font-bold flex items-center gap-2">
                                        <TruckIcon className="w-5 h-5 text-cyan-400 animate-pulse" />
                                        Consignment Delivery Tracker: #{order.order_id}
                                    </h3>
                                    <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-xs font-mono px-3 py-1 rounded-full">
                                        {order.fish_name} ({order.weight_kg}kg)
                                    </span>
                                </div>

                                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Map Visualization Layout Section */}
                                    <div className="lg:col-span-2 space-y-4">
                                        <DeliveryTracker 
                                            orderId={order.order_id}
                                            status={order.status} 
                                            location={order.location} 
                                            onStatusUpdate={handleOrderTelemetryUpdate}
                                        />
                                    </div>

                                    {/* Escrow & Zero-Trust OTP Handshake Terminal */}
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col justify-between space-y-4">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                                                <div className="flex items-center gap-2">
                                                    <BanknotesIcon className="w-4 h-4 text-emerald-600" />
                                                    <h5 className="font-bold text-slate-800 text-sm">Escrow Custody</h5>
                                                </div>
                                                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                                                    ₱{parseFloat(order.final_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>

                                            {/* ZERO-TRUST DELIVERY HANDSHAKE BADGE */}
                                            {order.delivery_otp && (
                                                <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 shadow-md space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                                                            <KeyIcon className="w-4 h-4" />
                                                            <span>Delivery Handshake OTP</span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCopyOtp(order.order_id, order.delivery_otp)}
                                                            className="text-slate-400 hover:text-white transition-colors p-1"
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

                                                    <div className="flex items-center justify-center py-2 bg-slate-900/90 rounded-lg border border-slate-800 tracking-[0.25em] font-mono text-2xl font-black text-cyan-400">
                                                        {order.delivery_otp}
                                                    </div>

                                                    <p className="text-[10px] font-mono text-slate-400 leading-tight">
                                                        Present this 6-digit cryptographic clearance token to courier upon physical arrival.
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {order.status === 'pending_dispatch' && (
                                            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-xl text-center flex items-center justify-center gap-1.5">
                                                <ShieldExclamationIcon className="w-4 h-4 text-amber-600" />
                                                <span>Awaiting courier dispatch from port dock.</span>
                                            </div>
                                        )}

                                        {order.status === 'en_route' && (
                                            <div className="p-3 bg-cyan-50 border border-cyan-200 text-cyan-700 text-xs font-bold rounded-xl text-center animate-pulse">
                                                🛵 Courier has claimed cargo. En route to your destination...
                                            </div>
                                        )}

                                        {order.status === 'delivered' && (
                                            <DeliveryConfirmAction orderId={order.order_id} />
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* --- LIVE BIDDING GRID CARDS --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {listings.length === 0 ? (
                        <div className="text-slate-400 text-sm py-10 col-span-full text-center bg-white border border-dashed border-slate-200 rounded-2xl">
                            No active fish listings available on the trading floor right now.
                        </div>
                    ) : (
                        listings.map(listing => (
                            <LiveListingCard key={listing.id} initialListing={listing} auth={auth} />
                        ))
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function DeliveryConfirmAction({ orderId }) {
    const { data, setData, post, processing } = useForm({
        rating: 5,
    });

    const confirmDelivery = () => {
        post(route('orders.confirm', orderId), {
            preserveScroll: true,
        });
    };

    return (
        <div className="mt-2">
            <button
                onClick={confirmDelivery}
                disabled={processing}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white py-3 rounded-xl font-bold shadow-sm shadow-emerald-600/20 disabled:opacity-50 transition-all active:scale-[0.98] text-xs uppercase tracking-wider cursor-pointer"
            >
                <ShieldCheckIcon className="w-4 h-4" />
                {processing ? 'Confirming Inspection...' : 'Verify Inspection & Release Escrow'}
            </button>
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

    return (
        <div className={`bg-white rounded-2xl p-6 border transition-all duration-300 shadow-sm flex flex-col justify-between ${
            isFlashing ? 'border-cyan-500 ring-2 ring-cyan-400' : 'border-slate-200'
        }`}>

            <div className="relative h-48 w-full overflow-hidden rounded-xl bg-slate-950 border border-slate-800">
                {hasValidImage ? (
                    <img
                        src={listing.image_url}
                        alt={listing.fish_name}
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950 p-4 text-center select-none">
                        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-2 shadow-inner">
                            <svg className="w-9 h-9 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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
                <div className="absolute top-2 right-2 rounded-full bg-slate-950/80 px-2.5 py-1 text-[11px] font-bold text-cyan-400 backdrop-blur-md border border-slate-800">
                    ⚖️ {listing.weight_kg} kg
                </div>
            </div>

            <div className="space-y-3 mt-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="font-bold text-slate-900 text-lg capitalize">{listing.fish_name}</h4>
                        <p className="text-xs font-mono text-slate-500">Port: {listing.location}</p>
                    </div>
                    <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                        {listing.weight_kg} KG
                    </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl flex justify-between items-center border border-slate-100">
                    <span className="text-xs font-semibold text-slate-500">Current Highest Bid</span>
                    <span className="text-lg font-black text-slate-900 font-mono">
                        ₱{parseFloat(listing.current_bid).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                </div>
            </div>

            {auth.user && auth.user.id === listing.user_id ? (
                <AcceptBidAction listing={listing} />
            ) : (
                <form onSubmit={submitBid} className="mt-4 space-y-2">
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs font-bold">₱</span>
                        <input
                        type="number"
                        step="0.01"
                        min={parseFloat(listing.current_bid) + 1}
                        value={data.bid_amount}
                        onChange={(e) => setData("bid_amount", e.target.value)}
                        placeholder={`> ${listing.current_bid}`}
                        className="w-full pl-7 pr-3 py-2 text-sm rounded-xl border-slate-200 focus:border-cyan-500 focus:ring-cyan-500 font-mono"
                        required
                    />
                </div>
                {errors.bid_amount && <p className="text-xs text-rose-500">{errors.bid_amount}</p>}

                <button
                    type="submit"
                    disabled={processing}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                >
                    {processing ? "Transmitting Bid..." : "Place Verified Bid"}
                </button>
            </form>
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
        <div className="mt-4">
            <button
                onClick={acceptBid}
                disabled={processing}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white py-3 rounded-xl font-bold shadow-sm shadow-emerald-600/20 disabled:opacity-50 transition-all active:scale-[0.98] text-xs uppercase tracking-wider"
            >
                {processing ? "Accepting Bid..." : "Accept Highest Bid & Close Auction"}
            </button>
        </div>
    );
}
