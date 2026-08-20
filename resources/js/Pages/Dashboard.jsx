// resources/js/Pages/Dashboard.jsx
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { Head, useForm, Link, router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { 
    ScaleIcon, 
    CircleStackIcon, 
    SparklesIcon, 
    ShoppingBagIcon, 
    TruckIcon, 
    ArrowTrendingUpIcon, 
    ClockIcon, 
    ShieldCheckIcon, 
    PlusCircleIcon, 
    BanknotesIcon, 
    LockClosedIcon, 
    ArrowUpCircleIcon, 
    ArrowDownCircleIcon,
    XMarkIcon, 
    MapPinIcon, 
    StarIcon, 
    CheckBadgeIcon, 
    UserIcon, 
    BoltIcon,
    FireIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    KeyIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

// ---------------------------------------------------------------------------
// 1. SUB-COMPONENT: Active Catch Auction Card (Private Helper)
// ---------------------------------------------------------------------------
function ActiveCatchAuctionCard({ listing, onAccept, isProcessing, errorMessage }) {
    const startingPrice = Number(listing.starting_price || 0);
    const topOffer = Number(listing.current_bid || listing.highest_bid || startingPrice);
    const bidderName = listing.highest_bidder_name || listing.top_bidder_name || 'fishersn';
    const bidsCount = listing.bids_count ?? (listing.bids ? listing.bids.length : (listing.has_bids ? 1 : 0));
    const hasBids = listing.has_bids || bidsCount > 0;

    return (
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all shadow-sm">
            <div className="space-y-3">
                {/* Crate Metadata Header */}
                <div className="flex justify-between items-center">
                    <span className="font-mono text-xs font-bold text-slate-500">Crate #{listing.id}</span>
                    <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                        hasBids ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                    }`}>
                        {bidsCount} {bidsCount === 1 ? 'Bid' : 'Bids'} Placed
                    </span>
                </div>

                {/* Fish Identity */}
                <h4 className="text-base font-black text-slate-900 tracking-tight">
                    {listing.fish_name} ({listing.weight_kg} KG)
                </h4>

                {/* Valuation Breakdown */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200/60 space-y-2 text-xs font-mono">
                    <div className="flex justify-between text-slate-500">
                        <span>Starting Floor:</span>
                        <span className="font-semibold text-slate-700">₱{startingPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-100 pt-1.5">
                        <span className="text-slate-600 font-bold">Current Top Offer:</span>
                        <span className="font-black text-emerald-600 text-sm">₱{topOffer.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-1">
                        <span>Leading Bidder:</span>
                        <span className="font-bold text-cyan-700">{bidderName}</span>
                    </div>
                </div>

                {/* Contextual Rejection Error Feedback */}
                {errorMessage && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono flex items-start gap-2">
                        <ExclamationTriangleIcon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                            <p className="font-bold">Cannot Award Crate</p>
                            <p className="text-[11px] text-rose-700 leading-snug">{errorMessage}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Trigger */}
            {hasBids ? (
                <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => onAccept(listing.id)}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs font-mono uppercase tracking-wider rounded-xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                    {isProcessing ? (
                        <>
                            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            <span>Locking Escrow...</span>
                        </>
                    ) : (
                        <>
                            <CheckBadgeIcon className="w-4 h-4" />
                            <span>Accept ₱{topOffer.toFixed(2)} & Award Winner</span>
                        </>
                    )}
                </button>
            ) : (
                <div className="text-center py-2.5 text-[11px] font-mono text-slate-400 bg-slate-100 rounded-xl">
                    Waiting for buyers to place bids...
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// 2. MAIN DASHBOARD COMPONENT (Sole Default Export)
// ---------------------------------------------------------------------------
export default function Dashboard({ 
    auth, 
    role_context = null, 
    metrics = {}, 
    activeListings = null,
    recentActivity = null, 
    salesHistory = null,
    activeShipments = null, 
    biddingWatchlist = null 
}) {
    const userRole = auth?.user?.role || role_context || 'buyer';
    const pageProps = usePage().props;
    const pageErrors = pageProps.errors || {};
    const flashSuccess = pageProps.flash?.success;

    // UI & Action States
    const [showFishermanForm, setShowFishermanForm] = useState(false);
    const [showWalletModal, setShowWalletModal] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [selectedOrderToConfirm, setSelectedOrderToConfirm] = useState(null);
    const [counterBidItem, setCounterBidItem] = useState(null);
    const [watchlist, setWatchlist] = useState(biddingWatchlist || []);
    const [acceptingListingId, setAcceptingListingId] = useState(null);

    // Watchlist Synchronization
    useEffect(() => {
        if (Array.isArray(biddingWatchlist)) {
            setWatchlist(biddingWatchlist);
        }
    }, [biddingWatchlist]);

    useEffect(() => {
        if (window.Echo && userRole === 'buyer') {
            const channel = window.Echo.channel('marketplace');

            channel.listen('CatchBidUpdated', (eventData) => {
                setWatchlist((prevWatchlist) =>
                    prevWatchlist.map((item) => {
                        if (item.listing_id === eventData.listing_id || item.listing_id === eventData.id) {
                            const newCurrentBid = parseFloat(eventData.current_bid);
                            const myBid = parseFloat(item.my_highest_bid);
                            const updatedStatus = myBid >= newCurrentBid ? 'WINNING' : 'OUTBID';

                            return {
                                ...item,
                                current_bid: newCurrentBid,
                                bid_status: item.listing_status === 'active' ? updatedStatus : item.bid_status,
                            };
                        }
                        return item;
                    })
                );
            });

            return () => {
                window.Echo.leaveChannel('marketplace');
            };
        }
    }, [userRole]);

    // Modal Forms
    const { 
        data: upgradeData, 
        setData: setUpgradeData, 
        post: postUpgrade, 
        processing: upgradeProcessing,
        errors: upgradeErrors 
    } = useForm({
        requested_role: 'fisherman',
        contact_number: auth?.user?.contact_number || '',
        bfar_registration_number: '',
    });

    const { 
        data: walletData, 
        setData: setWalletData, 
        post: postWallet, 
        processing: walletProcessing, 
        reset: resetWallet,
        errors: walletErrors 
    } = useForm({
        amount: '',
        payment_method: 'gcash',
    });

    const {
        data: withdrawData,
        setData: setWithdrawData,
        post: postWithdraw,
        processing: withdrawProcessing,
        reset: resetWithdraw,
        errors: withdrawErrors
    } = useForm({
        amount: '',
        payout_method: 'gcash',
        account_number: '',
        account_name: auth?.user?.name || '',
    });

    const {
        data: confirmData,
        setData: setConfirmData,
        post: postConfirm,
        processing: confirmProcessing,
        reset: resetConfirm,
        errors: confirmErrors
    } = useForm({
        rating: 5,
    });

    const {
        data: bidData,
        setData: setBidData,
        post: postBid,
        processing: bidProcessing,
        reset: resetBid,
        errors: bidErrors
    } = useForm({
        bid_amount: '',
    });

    // Award Bid Handler with Active ID Tracking
    const handleAcceptBid = (listingId) => {
        setAcceptingListingId(listingId);
        router.post(route('listings.accept-bid', listingId), {}, {
            preserveScroll: true,
            onFinish: () => setAcceptingListingId(null),
        });
    };

    const submitUpgrade = (e) => {
        e.preventDefault();
        postUpgrade(route('profile.update'), {
            preserveScroll: true,
            onSuccess: () => setShowFishermanForm(false),
        });
    };

    const submitDeposit = (e) => {
        e.preventDefault();
        postWallet(route('wallet.deposit'), {
            preserveScroll: true,
            onSuccess: () => {
                setShowWalletModal(false);
                resetWallet();
            },
        });
    };

    const submitWithdraw = (e) => {
        e.preventDefault();
        postWithdraw(route('wallet.withdraw'), {
            preserveScroll: true,
            onSuccess: () => {
                setShowWithdrawModal(false);
                resetWithdraw();
            },
        });
    };

    const submitDeliveryConfirmation = (e) => {
        e.preventDefault();
        if (!selectedOrderToConfirm) return;

        postConfirm(route('orders.confirm', selectedOrderToConfirm.order_id), {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedOrderToConfirm(null);
                resetConfirm();
            },
        });
    };

    const openCounterBidModal = (item) => {
        setCounterBidItem(item);
        setBidData('bid_amount', String(parseFloat(item.current_bid) + 100));
    };

    const submitCounterBid = (e) => {
        e.preventDefault();
        if (!counterBidItem) return;

        postBid(route('bids.store', counterBidItem.listing_id), {
            preserveScroll: true,
            onSuccess: () => {
                setCounterBidItem(null);
                resetBid();
            },
        });
    };

    const presetAmounts = [500, 1000, 2500, 5000, 10000];

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending_dispatch':
                return {
                    label: 'Awaiting Courier',
                    bg: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
                    dot: 'bg-amber-500'
                };
            case 'en_route':
                return {
                    label: 'Cargo In Transit',
                    bg: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30',
                    dot: 'bg-cyan-500 animate-pulse'
                };
            case 'delivered':
                return {
                    label: 'Arrived at Destination',
                    bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
                    dot: 'bg-emerald-500'
                };
            default:
                return {
                    label: status,
                    bg: 'bg-slate-100 text-slate-600 border-slate-200',
                    dot: 'bg-slate-400'
                };
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <h2 className="font-black text-2xl text-slate-900 tracking-tight">
                            {userRole === 'fisherman' && '⚓ Harvester Consignment Terminal'}
                            {userRole === 'buyer' && '🛍️ Consignment Trading Desk'}
                            {userRole === 'rider' && '🚚 Fleet Logistics Station'}
                        </h2>
                        <p className="text-xs text-slate-500 font-medium">
                            Node Identity: <span className="font-mono text-slate-700 font-bold">{auth.user.name}</span> • Terminal Context: <span className="text-cyan-700 font-bold capitalize">{userRole}</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {userRole === 'fisherman' && (
                            <>
                                <button
                                    onClick={() => setShowWithdrawModal(true)}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-[0.98]"
                                >
                                    <ArrowDownCircleIcon className="w-4 h-4" />
                                    <span>Cash Out Earnings</span>
                                </button>
                                <Link
                                    href={route('marketplace.index')}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-[0.98]"
                                >
                                    <PlusCircleIcon className="w-4 h-4" />
                                    <span>View Live Auctions</span>
                                </Link>
                            </>
                        )}

                        {userRole === 'buyer' && (
                            <button
                                onClick={() => setShowWalletModal(true)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-[0.98]"
                            >
                                <ArrowUpCircleIcon className="w-4 h-4" />
                                <span>Top Up Wallet</span>
                            </button>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={`${userRole.toUpperCase()} Terminal — IsdaLog`} />

            <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                
                {/* Global Status & Feedback Banners */}
                {flashSuccess && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-semibold flex items-center gap-2">
                        <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span>{flashSuccess}</span>
                    </div>
                )}

                {pageErrors.error && (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono font-semibold flex items-center gap-2">
                        <ExclamationTriangleIcon className="w-5 h-5 text-rose-600 shrink-0" />
                        <span>{pageErrors.error}</span>
                    </div>
                )}

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

                {/* UPGRADE SUBMISSION FORM */}
                {showFishermanForm && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-base font-bold text-slate-900">Fisherman BFAR Verification Form</h3>
                            <button onClick={() => setShowFishermanForm(false)} className="text-xs text-slate-400 hover:text-slate-600">Cancel</button>
                        </div>
                        <form onSubmit={submitUpgrade} className="space-y-4 max-w-md">
                            <div>
                                <InputLabel htmlFor="contact_number" value="Active Mobile Number" className="!text-xs !font-bold !uppercase !tracking-wider" />
                                <TextInput 
                                    id="contact_number"
                                    type="text" 
                                    value={upgradeData.contact_number}
                                    onChange={e => setUpgradeData('contact_number', e.target.value)}
                                    placeholder="09123456789"
                                    className="mt-1 block w-full"
                                    required 
                                />
                                <InputError message={upgradeErrors.contact_number} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel htmlFor="bfar_registration_number" value="BFAR FishR Registration Number" className="!text-xs !font-bold !uppercase !tracking-wider" />
                                <TextInput 
                                    id="bfar_registration_number"
                                    type="text" 
                                    value={upgradeData.bfar_registration_number}
                                    onChange={e => setUpgradeData('bfar_registration_number', e.target.value)}
                                    placeholder="e.g. PH-ZN-2026-0041"
                                    className="mt-1 block w-full"
                                    required 
                                />
                                <InputError message={upgradeErrors.bfar_registration_number} className="mt-1" />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button 
                                    type="submit" 
                                    disabled={upgradeProcessing}
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
                {/* 2. DYNAMIC ROLE KPI METRIC CARDS (4 COLUMNS)                              */}
                {/* ========================================================================= */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    {/* --- FISHERMAN 4 KPI METRIC CARDS --- */}
                    {userRole === 'fisherman' && (
                        <>
                            {/* 1. Withdrawable Balance */}
                            <div className="p-6 rounded-2xl bg-white border border-emerald-200 shadow-sm flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">Withdrawable Balance</span>
                                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                                        <BanknotesIcon className="w-5 h-5" />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <h3 className="text-3xl font-black text-emerald-600 tracking-tight font-mono">
                                        ₱{parseFloat(metrics.walletBalance || auth?.user?.wallet_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-1">Available for GCash / Maya payout</p>
                                </div>
                            </div>

                            {/* 2. Lifetime Net Earnings */}
                            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">Lifetime Net Earnings</span>
                                    <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600">
                                        <ArrowTrendingUpIcon className="w-5 h-5" />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                                        ₱{parseFloat(metrics.netEarnings || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-1">97% net proceeds from closed sales</p>
                                </div>
                            </div>

                            {/* 3. Escrow In Transit */}
                            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">Escrow In Transit</span>
                                    <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                                        <LockClosedIcon className="w-5 h-5" />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <h3 className="text-2xl font-black text-amber-600 tracking-tight font-mono">
                                        ₱{parseFloat(metrics.pendingEscrow || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-1">Pending buyer delivery confirmation</p>
                                </div>
                            </div>

                            {/* 4. Total Biomass Harvested */}
                            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">Logged Biomass</span>
                                    <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                                        <ScaleIcon className="w-5 h-5" />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                                        {parseFloat(metrics.totalWeight || 0).toLocaleString()} <span className="text-sm text-purple-600 font-bold">KG</span>
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-1">{metrics.totalCatches || 0} batches recorded via Edge AI</p>
                                </div>
                            </div>
                        </>
                    )}

                    {/* --- BUYER 4 KPI METRIC CARDS --- */}
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
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Available Liquid Funds</span>
                                    <h4 className="text-2xl font-black text-emerald-600 mt-1">
                                        ₱{Number(metrics.walletBalance ?? auth?.user?.wallet_balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </h4>
                                    <button onClick={() => setShowWalletModal(true)} className="text-[11px] text-emerald-700 font-bold hover:underline flex items-center gap-1 mt-0.5">
                                        <span>+ Add Balance</span>
                                    </button>
                                </div>
                                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                                    <CircleStackIcon className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                                <div>
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Locked in Transit Escrow</span>
                                    <h4 className="text-2xl font-black text-amber-600 mt-1">
                                        ₱{Number(metrics.escrowLocked ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </h4>
                                    <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                                        <LockClosedIcon className="w-3 h-3 text-amber-500" />
                                        Protected Cargo Settlement
                                    </span>
                                </div>
                                <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                                    <BanknotesIcon className="w-6 h-6" />
                                </div>
                            </div>
                        </>
                    )}

                    {/* --- RIDER METRIC CARDS --- */}
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
                {/* 3. ACTIVE CATCH AUCTIONS & BID ACCEPTANCE DESK (FISHERMAN)                */}
                {/* ========================================================================= */}
                {userRole === 'fisherman' && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-200">
                                    <SparklesIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Active Catch Auctions & Bid Acceptance</h3>
                                    <p className="text-xs text-slate-500">Review incoming marketplace offers and award winning bids</p>
                                </div>
                            </div>
                            <span className="text-xs font-mono font-bold bg-cyan-50 text-cyan-700 px-3 py-1 rounded-lg border border-cyan-200">
                                {activeListings ? activeListings.length : 0} Live On Trading Floor
                            </span>
                        </div>

                        {(!activeListings || activeListings.length === 0) ? (
                            <div className="text-center py-8 text-slate-400 text-xs font-mono">
                                No active auctions currently on the floor. Log a catch via Telegram to start an auction.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {activeListings.map((listing) => (
                                    <ActiveCatchAuctionCard
                                        key={listing.id}
                                        listing={listing}
                                        onAccept={handleAcceptBid}
                                        isProcessing={acceptingListingId === listing.id}
                                        errorMessage={acceptingListingId === listing.id ? pageErrors.error : pageErrors.error}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

               {/* ========================================================================= */}
                {/* 4. CONSIGNMENT SALES & ESCROW LEDGER (FISHERMAN)                          */}
                {/* ========================================================================= */}
                {userRole === 'fisherman' && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Consignment Sales & Escrow Ledger</h3>
                                <p className="text-xs text-slate-500">Completed catch purchases and active dispatch handshakes</p>
                            </div>
                            <span className="text-xs font-mono bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-semibold">
                                Platform Fee: 3.0%
                            </span>
                        </div>

                        {(!salesHistory || salesHistory.length === 0) ? (
                            <div className="text-center py-8 text-slate-400 text-xs font-mono">
                                No completed consignment transactions recorded yet.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                                    <thead>
                                        <tr className="text-slate-400 font-mono uppercase tracking-wider">
                                            <th className="py-3 px-3">Order ID</th>
                                            <th className="py-3 px-3">Species</th>
                                            <th className="py-3 px-3">Weight</th>
                                            <th className="py-3 px-3">Gross Sale</th>
                                            <th className="py-3 px-3">Fee (3%)</th>
                                            <th className="py-3 px-3">Net Payout (97%)</th>
                                            <th className="py-3 px-3">Buyer</th>
                                            <th className="py-3 px-3">Status / Handshake</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-mono">
                                        {salesHistory.map((order) => (
                                            <tr key={order.order_id} className="hover:bg-slate-50 transition-colors">
                                                <td className="py-3 px-3 font-bold text-slate-900">#{order.order_id}</td>
                                                <td className="py-3 px-3 font-sans font-bold text-slate-800">{order.fish_name}</td>
                                                <td className="py-3 px-3 text-slate-600">{order.weight_kg} kg</td>
                                                <td className="py-3 px-3 text-slate-500">₱{Number(order.gross_price || order.final_price).toFixed(2)}</td>
                                                <td className="py-3 px-3 text-rose-500">-₱{Number(order.platform_fee).toFixed(2)}</td>
                                                <td className="py-3 px-3 font-bold text-emerald-600">₱{Number(order.net_payout || order.seller_earnings).toFixed(2)}</td>
                                                <td className="py-3 px-3 font-sans text-slate-600">{order.buyer_name}</td>
                                                <td className="py-3 px-3 font-sans">
                                                    {order.status === 'pending_dispatch' ? (
                                                        <div className="flex flex-col gap-1 items-start">
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-700 border border-amber-200">
                                                                PENDING_DISPATCH
                                                            </span>
                                                            {order.pickup_otp && (
                                                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/40">
                                                                    <KeyIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                                                    <span className="text-[10px] font-mono font-semibold uppercase text-slate-300">OTP:</span>
                                                                    <span className="text-xs font-mono font-black tracking-widest text-cyan-300">{order.pickup_otp}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                            order.status === 'completed'
                                                                ? 'bg-emerald-100 text-emerald-700'
                                                                : 'bg-indigo-100 text-indigo-700'
                                                        }`}>
                                                            {order.status.replace('_', ' ')}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
                {/* ========================================================================= */}
                {/* 5. ACTIVE CARGO SHIPMENTS & ESCROW CLEARANCE (BUYER)                      */}
                {/* ========================================================================= */}
                {userRole === 'buyer' && activeShipments && activeShipments.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <TruckIcon className="w-5 h-5 text-cyan-600" />
                                <h3 className="font-bold text-sm text-slate-900">
                                    Active Consignments & Escrow Clearance Console ({activeShipments.length})
                                </h3>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                                ESCROW PROTECTED
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {activeShipments.map((order) => {
                                const badge = getStatusBadge(order.status);
                                return (
                                    <div key={order.order_id} className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-4 flex flex-col justify-between hover:border-slate-300 transition-colors">
                                        <div className="space-y-2.5">
                                            <div className="flex items-center justify-between">
                                                <span className="font-mono text-xs font-bold text-slate-800">
                                                    Order #{order.order_id}
                                                </span>
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                                                    {badge.label}
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-baseline">
                                                <h4 className="text-base font-black text-slate-900">
                                                    {order.fish_name} ({order.weight_kg} KG)
                                                </h4>
                                                <span className="text-sm font-black text-emerald-600 font-mono">
                                                    ₱{Number(order.final_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                                                <div className="flex items-center gap-1">
                                                    <MapPinIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                    <span className="truncate">{order.location || 'Galas Port'}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                    <span className="truncate">{order.fisherman_name || 'Harbor Fisherman'}</span>
                                                </div>
                                                {order.rider_name && (
                                                    <div className="col-span-2 flex items-center gap-1.5 text-purple-700 bg-purple-50/70 p-1.5 rounded-lg border border-purple-100">
                                                        <TruckIcon className="w-3.5 h-3.5 shrink-0" />
                                                        <span className="font-semibold">Courier: {order.rider_name}</span>
                                                        {order.rider_contact && (
                                                            <span className="text-[10px] text-purple-500 font-mono">({order.rider_contact})</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setSelectedOrderToConfirm(order)}
                                            className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all active:scale-[0.98]"
                                        >
                                            <CheckBadgeIcon className="w-4 h-4" />
                                            <span>Confirm Delivery & Release Payout</span>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* 6. LIVE BIDDING WATCHLIST (BUYER) OR ACTIVITY LOG (FISHERMAN/RIDER)       */}
                {/* ========================================================================= */}
                {userRole === 'buyer' ? (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <FireIcon className="w-5 h-5 text-cyan-600" />
                                <h3 className="font-bold text-sm text-slate-900">
                                    Live Auction Bidding Watchlist & Counter-Bid Console
                                </h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    WEBSOCKETS SYNCED
                                </span>
                            </div>
                        </div>

                        {watchlist.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {watchlist.map((item) => {
                                    const isWinning = item.bid_status === 'WINNING';
                                    const isOutbid = item.bid_status === 'OUTBID';
                                    const isWon = item.bid_status === 'WON';

                                    return (
                                        <div
                                            key={item.listing_id}
                                            className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                                                isWinning ? 'bg-emerald-50/40 border-emerald-300 shadow-sm' :
                                                isOutbid ? 'bg-rose-50/40 border-rose-300 shadow-sm ring-2 ring-rose-100' :
                                                isWon ? 'bg-indigo-50/40 border-indigo-200 shadow-sm' :
                                                'bg-slate-50 border-slate-200'
                                            }`}
                                        >
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-mono text-xs font-bold text-slate-700">
                                                        Crate #{item.listing_id}
                                                    </span>
                                                    
                                                    {isWinning && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white shadow-sm">
                                                            <BoltIcon className="w-3 h-3" />
                                                            Winning Top Bid
                                                        </span>
                                                    )}

                                                    {isOutbid && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white animate-pulse shadow-sm">
                                                            <ExclamationTriangleIcon className="w-3 h-3" />
                                                            Outbid
                                                        </span>
                                                    )}

                                                    {isWon && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-white">
                                                            <CheckBadgeIcon className="w-3 h-3" />
                                                            Won
                                                        </span>
                                                    )}

                                                    {item.bid_status === 'CLOSED' && (
                                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-200 text-slate-600">
                                                            Closed
                                                        </span>
                                                    )}
                                                </div>

                                                <h4 className="text-base font-black text-slate-900">
                                                    {item.fish_name} ({item.weight_kg} KG)
                                                </h4>

                                                <div className="bg-white/80 p-3 rounded-xl border border-slate-200/60 space-y-1 text-xs font-mono">
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400">Current Market Bid:</span>
                                                        <span className={`font-black ${isOutbid ? 'text-rose-600' : 'text-slate-900'}`}>
                                                            ₱{Number(item.current_bid).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400">Your Highest Offer:</span>
                                                        <span className="font-bold text-slate-700">
                                                            ₱{Number(item.my_highest_bid).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-400">
                                                        <span>Location:</span>
                                                        <span>{item.location || 'Galas Port'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {item.listing_status === 'active' && (
                                                <button
                                                    onClick={() => openCounterBidModal(item)}
                                                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-[0.98] ${
                                                        isOutbid
                                                            ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                                                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                                                    }`}
                                                >
                                                    <BoltIcon className="w-4 h-4" />
                                                    <span>{isOutbid ? 'Raise Counter-Bid Now' : 'Increase Maximum Bid'}</span>
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                                <p>You haven't placed bids on any active fish crates yet.</p>
                                <Link
                                    href={route('marketplace.index')}
                                    className="inline-flex items-center gap-1.5 text-cyan-600 font-bold hover:underline"
                                >
                                    <span>Browse Live Trading Floor →</span>
                                </Link>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <ClockIcon className="w-5 h-5 text-slate-500" />
                                <h3 className="font-bold text-sm text-slate-900">
                                    {userRole === 'fisherman' ? 'Recent Catch Telemetry Logs' : 'Recent Logistics Dispatch Log'}
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
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>

            {/* ========================================================================= */}
            {/* 7. VIRTUAL WALLET TOP-UP MODAL (BUYER)                                    */}
            {/* ========================================================================= */}
            <Modal show={showWalletModal} onClose={() => setShowWalletModal(false)} maxWidth="md">
                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                                <BanknotesIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-900">Virtual Wallet Deposit</h3>
                                <p className="text-xs text-slate-400">Instant Maritime Escrow Settlement</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setShowWalletModal(false)}
                            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={submitDeposit} className="space-y-5">
                        <div>
                            <InputLabel value="Deposit Channel" className="!text-xs !font-bold !uppercase !tracking-wider" />
                            <div className="grid grid-cols-3 gap-2 mt-1.5">
                                {[
                                    { id: 'gcash', label: 'GCash', color: 'border-blue-500 bg-blue-50/50 text-blue-700' },
                                    { id: 'maya', label: 'Maya', color: 'border-emerald-500 bg-emerald-50/50 text-emerald-700' },
                                    { id: 'bank_transfer', label: 'Bank', color: 'border-slate-500 bg-slate-50 text-slate-700' },
                                ].map((method) => (
                                    <button
                                        key={method.id}
                                        type="button"
                                        onClick={() => setWalletData('payment_method', method.id)}
                                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                                            walletData.payment_method === method.id 
                                                ? `${method.color} ring-2 ring-emerald-500/20 shadow-sm` 
                                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        {method.label}
                                    </button>
                                ))}
                            </div>
                            <InputError message={walletErrors.payment_method} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel value="Quick Select Amount (₱)" className="!text-xs !font-bold !uppercase !tracking-wider" />
                            <div className="grid grid-cols-5 gap-1.5 mt-1.5">
                                {presetAmounts.map((preset) => (
                                    <button
                                        key={preset}
                                        type="button"
                                        onClick={() => setWalletData('amount', String(preset))}
                                        className={`py-2 px-1 text-center rounded-lg text-xs font-bold border transition-all ${
                                            Number(walletData.amount) === preset
                                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                        }`}
                                    >
                                        ₱{preset.toLocaleString()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="deposit_amount" value="Custom Amount (₱)" className="!text-xs !font-bold !uppercase !tracking-wider" />
                            <div className="mt-1.5 relative rounded-xl shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold">
                                    ₱
                                </div>
                                <TextInput
                                    id="deposit_amount"
                                    type="number"
                                    name="amount"
                                    min="50"
                                    max="500000"
                                    step="0.01"
                                    value={walletData.amount}
                                    onChange={(e) => setWalletData('amount', e.target.value)}
                                    className="!pl-8 block w-full !text-slate-900 font-bold"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                            <InputError message={walletErrors.amount} className="mt-1" />
                        </div>

                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-2 text-xs text-emerald-800">
                            <ShieldCheckIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Funds are credited instantly to your secured escrow balance ledger.</span>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                type="submit"
                                disabled={walletProcessing}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm py-3 px-4 rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                                {walletProcessing ? 'Authorizing Payment...' : `Confirm Deposit of ₱${Number(walletData.amount || 0).toLocaleString()}`}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* ========================================================================= */}
            {/* 8. DELIVERY CONFIRMATION & ESCROW RELEASE MODAL (BUYER)                   */}
            {/* ========================================================================= */}
            <Modal show={Boolean(selectedOrderToConfirm)} onClose={() => setSelectedOrderToConfirm(null)} maxWidth="md">
                {selectedOrderToConfirm && (
                    <div className="p-6 space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                                    <CheckBadgeIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900">Confirm Consignment & Release</h3>
                                    <p className="text-xs text-slate-400">Order #{selectedOrderToConfirm.order_id} • {selectedOrderToConfirm.fish_name}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedOrderToConfirm(null)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={submitDeliveryConfirmation} className="space-y-5">
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Gross Escrow Value:</span>
                                    <span className="font-bold text-slate-900 font-mono">₱{Number(selectedOrderToConfirm.final_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Platform Governance Fee (3%):</span>
                                    <span className="text-slate-600 font-semibold font-mono">- ₱{Number(selectedOrderToConfirm.final_price * 0.03).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-black">
                                    <span className="text-emerald-700">Fisherman Net Payout:</span>
                                    <span className="text-emerald-600 font-mono">₱{Number(selectedOrderToConfirm.final_price * 0.97).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>

                            <div>
                                <InputLabel value="Rate Catch Freshness & Delivery Quality" className="!text-xs !font-bold !uppercase !tracking-wider text-center block mb-2" />
                                <div className="flex items-center justify-center gap-2 py-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setConfirmData('rating', star)}
                                            className="p-1 hover:scale-110 transition-transform focus:outline-none"
                                        >
                                            {star <= confirmData.rating ? (
                                                <StarSolid className="w-8 h-8 text-amber-400" />
                                            ) : (
                                                <StarIcon className="w-8 h-8 text-slate-300 hover:text-amber-300" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-center text-xs font-bold text-slate-500 mt-1">
                                    {confirmData.rating === 5 && '🌟 Exceptional Freshness & Handling'}
                                    {confirmData.rating === 4 && '👍 Great Condition'}
                                    {confirmData.rating === 3 && '👌 Acceptable Catch Quality'}
                                    {confirmData.rating === 2 && '⚠️ Minor Handling Discrepancy'}
                                    {confirmData.rating === 1 && '❌ Substandard Harvest Delivery'}
                                </p>
                                <InputError message={confirmErrors.rating} className="mt-1 text-center" />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="submit"
                                    disabled={confirmProcessing}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm py-3 px-4 rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
                                >
                                    {confirmProcessing ? 'Releasing Escrow Payout...' : 'Confirm Received & Release Payout'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </Modal>

            {/* ========================================================================= */}
            {/* 9. LIVE COUNTER-BIDDING MODAL (BUYER)                                     */}
            {/* ========================================================================= */}
            <Modal show={Boolean(counterBidItem)} onClose={() => setCounterBidItem(null)} maxWidth="md">
                {counterBidItem && (
                    <div className="p-6 space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-200">
                                    <BoltIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900">Place Counter-Bid</h3>
                                    <p className="text-xs text-slate-400">Crate #{counterBidItem.listing_id} • {counterBidItem.fish_name}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setCounterBidItem(null)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={submitCounterBid} className="space-y-5">
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-xs font-mono">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Current Top Bid:</span>
                                    <span className="font-bold text-slate-900">₱{Number(counterBidItem.current_bid).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Your Last Offer:</span>
                                    <span className="font-semibold text-slate-700">₱{Number(counterBidItem.my_highest_bid).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>

                            <div>
                                <InputLabel htmlFor="bid_amount" value="Your New Offer (₱)" className="!text-xs !font-bold !uppercase !tracking-wider" />
                                <div className="mt-1.5 relative rounded-xl shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold">
                                        ₱
                                    </div>
                                    <TextInput
                                        id="bid_amount"
                                        type="number"
                                        name="bid_amount"
                                        min={parseFloat(counterBidItem.current_bid) + 1}
                                        step="1"
                                        value={bidData.bid_amount}
                                        onChange={(e) => setBidData('bid_amount', e.target.value)}
                                        className="!pl-8 block w-full !text-slate-900 font-black text-lg"
                                        required
                                        isFocused
                                    />
                                </div>
                                <InputError message={bidErrors.bid_amount} className="mt-1" />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="submit"
                                    disabled={bidProcessing}
                                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm py-3 px-4 rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
                                >
                                    {bidProcessing ? 'Submitting Offer...' : `Submit Counter-Bid of ₱${Number(bidData.bid_amount || 0).toLocaleString()}`}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </Modal>
            
            {/* ========================================================================= */}
            {/* 10. WITHDRAWAL CASHOUT MODAL (FISHERMAN)                                  */}
            {/* ========================================================================= */}
            <Modal show={showWithdrawModal} onClose={() => setShowWithdrawModal(false)} maxWidth="md">
                <form onSubmit={submitWithdraw} className="p-6 space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                                <ArrowDownCircleIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Cash Out Fisherman Earnings</h3>
                                <p className="text-xs text-slate-500">Withdraw available sales balance</p>
                            </div>
                        </div>
                        <button type="button" onClick={() => setShowWithdrawModal(false)} className="text-slate-400 hover:text-slate-600">
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">Available Balance:</span>
                        <span className="font-mono font-black text-emerald-600 text-sm">
                            ₱{parseFloat(metrics.walletBalance || auth?.user?.wallet_balance || 0).toFixed(2)}
                        </span>
                    </div>

                    <div>
                        <InputLabel htmlFor="withdraw_amount" value="Withdrawal Amount (₱)" className="!text-xs !font-bold !uppercase !tracking-wider" />
                        <TextInput
                            id="withdraw_amount"
                            type="number"
                            step="0.01"
                            min="100"
                            max={String(metrics.walletBalance || auth?.user?.wallet_balance || 500000)}
                            value={withdrawData.amount}
                            onChange={e => setWithdrawData('amount', e.target.value)}
                            placeholder="Min. ₱100.00"
                            className="mt-1 block w-full text-sm font-mono"
                            required
                        />
                        <InputError message={withdrawErrors.amount} className="mt-1" />
                    </div>

                    <div>
                        <InputLabel htmlFor="payout_method" value="Payout Destination" className="!text-xs !font-bold !uppercase !tracking-wider" />
                        <select
                            id="payout_method"
                            value={withdrawData.payout_method}
                            onChange={e => setWithdrawData('payout_method', e.target.value)}
                            className="mt-1 block w-full rounded-xl border-slate-300 shadow-sm text-sm focus:border-emerald-500 focus:ring-emerald-500"
                        >
                            <option value="gcash">GCash E-Wallet</option>
                            <option value="maya">Maya Digital Wallet</option>
                            <option value="bank_transfer">Direct Bank Transfer (PESONet)</option>
                        </select>
                        <InputError message={withdrawErrors.payout_method} className="mt-1" />
                    </div>

                    <div>
                        <InputLabel htmlFor="account_number" value="Account / Mobile Number" className="!text-xs !font-bold !uppercase !tracking-wider" />
                        <TextInput
                            id="account_number"
                            type="text"
                            value={withdrawData.account_number}
                            onChange={e => setWithdrawData('account_number', e.target.value)}
                            placeholder="09171234567"
                            className="mt-1 block w-full text-sm font-mono"
                            required
                        />
                        <InputError message={withdrawErrors.account_number} className="mt-1" />
                    </div>

                    <div>
                        <InputLabel htmlFor="account_name" value="Account Holder Name" className="!text-xs !font-bold !uppercase !tracking-wider" />
                        <TextInput
                            id="account_name"
                            type="text"
                            value={withdrawData.account_name}
                            onChange={e => setWithdrawData('account_name', e.target.value)}
                            placeholder="Full Legal Name"
                            className="mt-1 block w-full text-sm"
                            required
                        />
                        <InputError message={withdrawErrors.account_name} className="mt-1" />
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={() => setShowWithdrawModal(false)}
                            className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={withdrawProcessing}
                            className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
                        >
                            {withdrawProcessing ? 'Authorizing Payout...' : 'Confirm Cash Out'}
                        </button>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}