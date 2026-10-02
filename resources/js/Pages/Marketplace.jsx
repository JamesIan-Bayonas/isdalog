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
    const isFisherman = auth?.user?.role === 'fisherman';
    const isRider = auth?.user?.role === 'rider';
    const isBuyer = auth?.user?.role === 'buyer';

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
                        <div className="p-2.5 rounded-2xl isd-soft-brand border isd-border-brand isd-text-brand shadow-lg ">
                            <ArrowTrendingUpIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="font-black text-xl isd-text-primary tracking-tight flex items-center gap-2">
                                Marketplace
                                <span className="whitespace-nowrap text-[10px] font-mono uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full isd-soft-brand isd-text-brand border isd-border-brand">
                                    {isRider ? 'Live' : isFisherman || isBuyer ? 'Live offers' : 'Active deliveries'}
                                </span>
                            </h2>
                            <p className="text-xs font-mono isd-text-muted">
                                {isFisherman
                                    ? 'Review your active catch auctions and current buyer offers'
                                    : isRider
                                        ? 'View active catch listings across participating ports'
                                        : isBuyer
                                            ? 'Browse live catch listings and place offers securely'
                                        : 'Dipolog Municipal Ports · Auction & Escrow Bidding'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl isd-surface border isd-border text-xs font-mono">
                            <span className="w-2 h-2 rounded-full isd-fill-success animate-pulse" />
                            <span className="isd-text-muted">Active listings:</span>
                            <span className="font-bold isd-text-primary">{listings.length}</span>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Marketplace — IsdaLog" />

            <div className="isdalog-marketplace-dashboard py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

                {/* --- MARKET TREND INTELLIGENCE ALERTS --- */}
                {trends.length > 0 && (
                    <div className="relative overflow-hidden isd-surface p-4 rounded-2xl border isd-border isd-shadow flex items-center gap-3.5">
                        <div className="absolute inset-y-0 left-0 w-1.5 isd-fill-brand " />
                        <div className="p-2 rounded-xl isd-soft-brand border isd-border-brand isd-text-brand ml-1">
                            <SparklesIcon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-mono font-bold isd-text-primary">
                            Live market price spikes detected in regional landing hubs.
                        </span>
                    </div>
                )}

                {/* --- THE REAL-TIME RECEIVING BAY WITH MAPS & OTP HANDSHAKE --- */}
                {orders.length > 0 && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between pb-1 border-b isd-border">
                            <div className="flex items-center gap-2">
                                <TruckIcon className="w-5 h-5 isd-text-brand" />
                                <h3 className="font-black text-base isd-text-primary tracking-tight">Active deliveries</h3>
                            </div>
                            <span className="text-[10px] font-mono font-bold uppercase isd-text-brand isd-soft-brand px-2.5 py-0.5 rounded-full border isd-border-brand">
                                {orders.length} In Transit
                            </span>
                        </div>

                        {orders.map(order => (
                            <div key={order.order_id} className="isd-surface rounded-2xl isd-shadow border isd-border overflow-hidden">
                                <div className="isd-subtle border-b isd-border p-4 sm:px-6 flex justify-between items-center isd-text-primary">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-2.5 h-2.5 rounded-full isd-fill-brand animate-ping" />
                                        <h3 className="text-sm font-black font-mono tracking-tight flex items-center gap-2">
                                            <span>Delivery tracking: #{order.order_id}</span>
                                        </h3>
                                    </div>
                                    <span className="isd-soft-brand isd-text-brand border isd-border-brand text-xs font-mono font-bold px-3 py-1 rounded-full">
                                        {order.fish_name} ({order.weight_kg} kg)
                                    </span>
                                </div>

                                <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Map Visualization Layout Section */}
                                    <div className="lg:col-span-2 space-y-4">
                                        <div className="rounded-2xl overflow-hidden border isd-border isd-inset isd-subtle">
                                            <DeliveryTracker 
                                                orderId={order.order_id}
                                                status={order.status} 
                                                location={order.location} 
                                                onStatusUpdate={handleOrderTelemetryUpdate}
                                            />
                                        </div>
                                    </div>

                                    {/* Escrow & Zero-Trust OTP Handshake Terminal */}
                                    <div className="isd-subtle p-6 rounded-2xl border isd-border flex flex-col justify-between space-y-4 isd-shadow">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between border-b isd-border pb-3">
                                                <div className="flex items-center gap-2">
                                                    <BanknotesIcon className="w-4 h-4 isd-text-success" />
                                                    <h5 className="font-bold isd-text-primary text-sm">Escrow Custody</h5>
                                                </div>
                                                <span className="text-xs font-mono font-black isd-text-success isd-soft-success border isd-border-success px-2.5 py-0.5 rounded-lg">
                                                    ₱{parseFloat(order.final_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>

                                            {/* ZERO-TRUST DELIVERY HANDSHAKE BADGE */}
                                            {order.delivery_otp && (
                                                <div className="p-4 rounded-xl isd-surface border isd-border isd-inset space-y-2.5">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1.5 text-xs font-mono isd-text-brand font-bold uppercase tracking-wider">
                                                            <KeyIcon className="w-4 h-4" />
                                                            <span>Delivery verification code</span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCopyOtp(order.order_id, order.delivery_otp)}
                                                            aria-label={copiedOtpId === order.order_id ? 'Delivery code copied' : 'Copy delivery verification code'}
                                                            className="isd-icon-button isd-text-muted isd-hover-text transition-colors rounded-lg isd-hover-subtle cursor-pointer"
                                                            title="Copy OTP to Clipboard"
                                                        >
                                                            {copiedOtpId === order.order_id ? (
                                                                <ClipboardDocumentCheckIcon className="w-4 h-4 isd-text-success" />
                                                            ) : (
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                                </svg>
                                                            )}
                                                        </button>
                                                    </div>

                                                    <div className="flex items-center justify-center py-2.5 isd-subtle rounded-xl border isd-border tracking-[0.3em] font-mono text-2xl font-black isd-text-brand isd-inset">
                                                        {order.delivery_otp}
                                                    </div>

                                                    <p className="text-[10px] font-mono isd-text-muted leading-tight">
                                                        Present this 6-digit cryptographic clearance token to courier upon physical arrival.
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-2">
                                            {order.status === 'pending_dispatch' && (
                                                <div className="p-3 isd-soft-warning border isd-border-warning isd-text-warning text-xs font-mono font-bold rounded-xl text-center flex items-center justify-center gap-1.5 shadow-sm">
                                                    <ShieldExclamationIcon className="w-4 h-4 isd-text-warning shrink-0" />
                                                    <span>Awaiting courier dispatch from port dock.</span>
                                                </div>
                                            )}

                                            {order.status === 'en_route' && (
                                                <div className="p-3 isd-soft-brand border isd-border-brand isd-text-brand text-xs font-mono font-bold rounded-xl text-center animate-pulse shadow-sm">
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
                    <div className="flex items-center justify-between pb-1 border-b isd-border">
                        <h3 className="font-black text-base isd-text-primary tracking-tight flex items-center gap-2">
                            <BoltIcon className="w-5 h-5 isd-text-warning" />
                            Marketplace listings
                        </h3>
                        <span className="text-xs font-mono isd-text-muted">
                            {isFisherman ? 'Buyer offers update automatically' : isRider ? 'Live listing updates' : 'Sub-second Reverb WebSocket Updates'}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {listings.length === 0 ? (
                            <div className="isd-empty col-span-full">
                                No active listings are available right now.
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
                className="w-full inline-flex items-center justify-center gap-2 isd-action isd-on-action py-3 rounded-xl font-bold shadow-lg transition-all active:scale-[0.98] text-xs font-mono uppercase tracking-wider cursor-pointer"
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
        <div className={`isd-surface rounded-2xl p-5 border transition-all duration-300 isd-shadow flex flex-col justify-between space-y-4 isd-hover-border ${
            isFlashing ? 'isd-border-brand ring-2 isd-ring-brand ' : 'isd-border'
        }`}>

            <div className="relative h-48 w-full overflow-hidden rounded-2xl isd-subtle border isd-border">
                {hasValidImage ? (
                    <img
                        src={listing.image_url}
                        alt={listing.fish_name}
                        className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center isd-subtle p-4 text-center select-none">
                        <div className="w-14 h-14 rounded-2xl isd-soft-brand border isd-border-brand flex items-center justify-center mb-2 isd-inset">
                            <svg className="w-8 h-8 isd-text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                            </svg>
                        </div>
                        <span className="text-xs font-mono font-bold isd-text-secondary tracking-wider uppercase">
                            {listing.fish_name}
                        </span>
                        <span className="text-[10px] font-mono isd-text-brand mt-0.5">
                            Landing: {listing.location}
                        </span>
                    </div>
                )}
                <div className="absolute top-2.5 right-2.5 rounded-xl isd-subtle px-2.5 py-1 text-[11px] font-mono font-bold isd-text-brand border isd-border shadow-md">
                    ⚖️ {listing.weight_kg} kg
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="font-black isd-text-primary text-lg capitalize tracking-tight">{listing.fish_name}</h4>
                        <div className="flex items-center gap-1 text-xs font-mono isd-text-muted mt-0.5">
                            <MapPinIcon className="w-3.5 h-3.5 isd-text-muted shrink-0" />
                            <span>{listing.location}</span>
                        </div>
                    </div>
                    <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-xl isd-subtle isd-text-secondary border isd-border">
                        {listing.weight_kg} KG
                    </span>
                </div>

                <div className="p-3.5 isd-subtle rounded-2xl flex justify-between items-center border isd-border isd-inset">
                    <span className="text-xs font-mono font-semibold isd-text-muted">Current Highest Bid</span>
                    <span className="text-lg font-black isd-text-success font-mono">
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
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none isd-text-muted text-xs font-mono font-bold">₱</span>
                        <input
                            id={`bid-amount-${listing.id}`}
                            aria-label={`Bid amount for ${listing.fish_name}`}
                            aria-invalid={Boolean(errors.bid_amount)}
                            aria-describedby={errors.bid_amount ? `bid-error-${listing.id}` : undefined}
                            type="number"
                            step="0.01"
                            min={parseFloat(listing.current_bid) + 1}
                            value={data.bid_amount}
                            onChange={(e) => setData("bid_amount", e.target.value)}
                            placeholder={`> ${listing.current_bid}`}
                            className="w-full pl-8 pr-3 py-2.5 text-sm rounded-xl isd-subtle border isd-border isd-focus-field focus:ring-1 isd-focus-field font-mono isd-text-primary isd-placeholder transition-all"
                            required
                        />
                    </div>
                    {errors.bid_amount && <p id={`bid-error-${listing.id}`} role="alert" className="text-xs isd-text-danger font-mono">{errors.bid_amount}</p>}

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full isd-action isd-on-action font-bold py-3 rounded-xl text-xs font-mono uppercase tracking-wider shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                    >
                        {processing ? "Transmitting Bid..." : "Place Verified Bid"}
                    </button>
                </form>
            ) : (
                <div className="p-3 isd-subtle border isd-border rounded-xl text-center">
                    <p className="text-xs font-mono isd-text-muted">
                        {auth.user?.role === 'fisherman'
                            ? 'Another fisherman’s auction is live'
                            : auth.user?.role === 'rider'
                                ? 'Buyer bidding only · View listing details'
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
                className="w-full inline-flex items-center justify-center gap-2 isd-action isd-on-action py-3 rounded-xl font-bold font-mono shadow-sm disabled:opacity-50 transition-all active:scale-[0.98] text-xs uppercase tracking-wider cursor-pointer"
            >
                {processing ? "Accepting offer..." : "Accept highest offer"}
            </button>
        </div>
    );
}
