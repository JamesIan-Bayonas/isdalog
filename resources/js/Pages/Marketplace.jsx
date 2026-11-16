// File: isdalog/resources/js/Pages/Marketplace.jsx
// resources/js/Pages/Marketplace.jsx
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
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
import FavoriteButton from '@/Components/FavoriteButton';
import MarketBenchmark from '@/Components/MarketBenchmark';
import DeliveryTracker from '@/Components/DeliveryTracker';
import OrderRatingModal from '@/Components/OrderRatingModal';

export default function Marketplace({ auth, activeListings = [], activeOrders: initialActiveOrders = [], trends = [], serverNow = null, filters = {}, ports = [], pagination = null }) {
    const [listings, setListings] = useState(activeListings);
    const refreshMarket = useRef(null);
    const [marketRefreshing, setMarketRefreshing] = useState(false);
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

    // Requery the current URL after changes: price changes can alter membership, order and page totals.
    useEffect(() => {
        let timer = null, busy = false, dirty = false, stopped = false;
        const schedule = () => {
            if (stopped) return;
            dirty = true;
            setMarketRefreshing(true);
            if (timer || busy) return;
            timer = setTimeout(() => {
                timer = null; busy = true; dirty = false;
                router.reload({ only: ['activeListings', 'pagination', 'serverNow'], preserveScroll: true,
                    onFinish: () => { busy = false; if (!stopped) { setMarketRefreshing(false); if (dirty) schedule(); } } });
            }, 750);
        };
        refreshMarket.current = schedule;
        if (window.Echo) {
            const channel = window.Echo.channel('marketplace');
            channel.listen('ListingAvailabilityUpdated', schedule);
            channel.listen('CatchBidUpdated', schedule);
        }
        return () => { stopped = true; clearTimeout(timer); refreshMarket.current = null; window.Echo?.leaveChannel('marketplace'); };
    }, []);

    useEffect(() => {
        if (!serverNow) return;
        const deadlines = activeListings.map(listing => Date.parse(listing.ends_at)).filter(Number.isFinite);
        if (!deadlines.length) return;
        const delay = Math.max(0, Math.min(...deadlines) - Date.parse(serverNow));
        const timer = setTimeout(() => refreshMarket.current?.(), Math.min(delay + 50, 2147483647));
        return () => clearTimeout(timer);
    }, [activeListings, serverNow]);

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
                                    Offers
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
                            <span className="isd-text-muted">Matching listings:</span>
                            <span className="font-bold isd-text-primary">{pagination?.total ?? listings.length}</span>
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
                                                logisticsType={order.logistics_type}
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

                                            {(order.status === 'delivered' || (order.logistics_type === 'self_pickup' && order.status === 'pending_dispatch')) && (
                                                <DeliveryConfirmAction order={order} />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <MarketFilters filters={filters} ports={ports} />
                {/* --- LIVE BIDDING GRID CARDS --- */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between pb-1 border-b isd-border">
                        <h3 className="font-black text-base isd-text-primary tracking-tight flex items-center gap-2">
                            <BoltIcon className="w-5 h-5 isd-text-warning" />
                            Marketplace listings
                        </h3>
                        <span className="text-xs font-mono isd-text-muted">
                            {marketRefreshing ? 'Market changed — refreshing results…' : pagination ? (pagination.total ? 'Showing ' + pagination.from + '–' + pagination.to + ' of ' + pagination.total : '0 matching listings') : listings.length + ' listings'}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {listings.length === 0 ? (
                            <div className="isd-empty col-span-full">
                                No catches match these selections. Try another fish name, widen the ranges, or clear the filters.
                            </div>
                        ) : (
                            listings.map(listing => (
                                <LiveListingCard key={listing.id} initialListing={listing} auth={auth} />
                            ))
                        )}
                    </div>
                    {pagination && <nav aria-label="Marketplace pages" className="flex flex-wrap justify-between items-center gap-3 border-t isd-border pt-5">
                        {pagination.prev_url ? <Link href={pagination.prev_url} preserveScroll className="rounded-xl border isd-border px-4 py-3 isd-text-brand">Previous</Link> : <span className="px-4 py-3 isd-text-muted" aria-disabled="true">Previous</span>}
                        <span className="text-sm isd-text-secondary">Page {pagination.current_page} of {pagination.last_page}</span>
                        {pagination.next_url ? <Link href={pagination.next_url} preserveScroll className="rounded-xl border isd-border px-4 py-3 isd-text-brand">Next</Link> : <span className="px-4 py-3 isd-text-muted" aria-disabled="true">Next</span>}
                    </nav>}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function SaveSearch({ filters }) {
    const form = useForm({ name: '' });
    function save(event) {
        event.preventDefault();
        form.transform(data => ({ ...filters, name: data.name }));
        form.post(route('saved.search.store'), { preserveScroll: true, onSuccess: () => form.reset() });
    }

    return <form onSubmit={save} className="mt-4 border-t isd-border pt-4 space-y-2">
        <label className="block text-sm isd-text-primary">Name this search
            <input className="isd-ui-input block w-full max-w-sm mt-1" required maxLength={80}
                value={form.data.name} onChange={event => form.setData('name', event.target.value)} />
        </label>
        <p className="text-xs isd-text-muted">Saves the applied filters. Using the same name updates that search.</p>
        {Object.entries(form.errors).map(([key, error]) => <p key={key} role="alert">{error}</p>)}
        <div className="flex flex-wrap items-center gap-3">
            <button className="isd-ui-button" disabled={form.processing}>Save applied search</button>
            <Link className="underline isd-text-brand" href={route('saved.index')}>Saved discovery</Link>
            {form.recentlySuccessful && <span role="status">Search saved.</span>}
        </div>
    </form>;
}

function MarketFilters({ filters, ports }) {
    const defaults = { q: '', port: '', min_price: '', max_price: '', min_weight: '', max_weight: '', sort: 'newest' };
    const { data, setData, get, processing, errors } = useForm({ ...defaults, ...filters });
    useEffect(() => { setData({ ...defaults, ...filters }); }, [JSON.stringify(filters)]);
    const control = 'mt-1 block w-full rounded-lg border isd-border isd-surface isd-text-primary p-2.5 text-sm focus:ring-2 isd-focus-field';
    const range = (name, label) => <label className="block text-sm isd-text-secondary" htmlFor={`market-${name}`} key={name}>
        {label}<input id={`market-${name}`} type="number" min="0" step="0.01" value={data[name] ?? ''} onChange={event => setData(name, event.target.value)} className={control} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `market-error-${name}` : undefined} />
        {errors[name] && <span id={`market-error-${name}`} role="alert" className="block mt-1 isd-text-danger">{errors[name]}</span>}
    </label>;
    return <section className="rounded-2xl isd-surface border isd-border p-4 sm:p-6" aria-labelledby="market-filter-title">
        <h3 id="market-filter-title" className="font-bold isd-text-primary">Find your next catch</h3>
        <p className="text-sm isd-text-muted mt-1 mb-4">Search all available batches. Price filters compare pesos per kilogram, not whole-batch totals.</p>
        <form onSubmit={event => { event.preventDefault(); get(route('marketplace.index'), { preserveState: true, preserveScroll: true }); }} className="space-y-4" aria-busy={processing}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <label className="text-sm isd-text-secondary" htmlFor="market-search">Fish name
                    <input id="market-search" type="search" maxLength={100} value={data.q ?? ''} onChange={event => setData('q', event.target.value)} placeholder="e.g. Bangus" className={control} />
                    {errors.q && <span role="alert" className="isd-text-danger">{errors.q}</span>}
                </label>
                <label className="text-sm isd-text-secondary" htmlFor="market-port">Landing port
                    <select id="market-port" value={data.port ?? ''} onChange={event => setData('port', event.target.value)} className={control}>
                        <option value="">All ports</option>{ports.map(port => <option key={port} value={port}>{port}</option>)}
                    </select>
                    {errors.port && <span role="alert" className="isd-text-danger">{errors.port}</span>}
                </label>
                <label className="text-sm isd-text-secondary" htmlFor="market-sort">Sort by
                    <select id="market-sort" value={data.sort} onChange={event => setData('sort', event.target.value)} className={control}>
                        <option value="newest">Newest first</option><option value="price_asc">Lowest ₱/kg</option><option value="price_desc">Highest ₱/kg</option><option value="weight_asc">Lightest batch</option><option value="closing">Closing soon</option>
                    </select>
                </label>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {range('min_price', 'Minimum price (₱/kg)')}{range('max_price', 'Maximum price (₱/kg)')}
                {range('min_weight', 'Minimum weight (kg)')}{range('max_weight', 'Maximum weight (kg)')}
            </div>
            <div className="flex flex-wrap gap-3">
                <button type="submit" disabled={processing} className="rounded-xl isd-action isd-on-action px-5 py-3 font-semibold disabled:opacity-50">{processing ? 'Searching…' : 'Apply filters'}</button>
                <Link href={route('marketplace.index')} preserveScroll className="rounded-xl border isd-border isd-text-brand px-5 py-3">Clear filters</Link>
            </div>
        </form>
        <SaveSearch filters={filters} />
    </section>;
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

    useEffect(() => { setListing(initialListing); }, [initialListing]);

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
                <p className="text-sm font-semibold isd-text-brand">₱{Number(listing.unit_price).toLocaleString('en-PH', {minimumFractionDigits:2, maximumFractionDigits:2})} / kg <span className="text-xs font-normal isd-text-muted">current batch offer ÷ weight</span></p>
                <MarketBenchmark benchmark={listing.benchmark} compact />
                <FavoriteButton listingId={listing.id} saved={initialListing.is_favorite} />
                <p className="text-xs isd-text-muted">
                    {listing.ends_at
                        ? `Offers close ${new Date(listing.ends_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila', timeZoneName: 'short' })}`
                        : 'No deadline recorded for this older listing.'}
                </p>
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="font-black isd-text-primary text-lg capitalize tracking-tight"><Link href={route('catches.show', listing.id)} className="underline">{listing.fish_name}</Link></h4>
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
                    <p className="text-xs isd-text-muted">Minimum increase: ₱0.01. Offers are funded only when accepted.</p>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none isd-text-muted text-xs font-mono font-bold">₱</span>
                        <input
                            id={`bid-amount-${listing.id}`}
                            aria-label={`Bid amount for ${listing.fish_name}`}
                            aria-invalid={Boolean(errors.bid_amount)}
                            aria-describedby={errors.bid_amount ? `bid-error-${listing.id}` : undefined}
                            type="number"
                            step="0.01"
                            min={((Math.round(Number(listing.current_bid) * 100) + 1) / 100).toFixed(2)}
                            max="99999999.99"
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
