import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { TruckIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import DeliveryTracker from '@/Components/DeliveryTracker'; // Import Leaflet map tracker

export default function Marketplace({ auth, activeListings = [], activeOrders = [], trends = [] }) {
    // FIXED: Changed from initialListings to activeListings to capture incoming controller data payload
    const [listings, setListings] = useState(activeListings);

    // Synchronize local state automatically if Inertia refreshes the backend data properties
    useEffect(() => {
        setListings(activeListings);
    }, [activeListings]);

    useEffect(() => {
        // Connect to the global real-time bidding updates pipeline
        if (window.Echo) {
            const channel = window.Echo.channel('marketplace');
            
            channel.listen('CatchBidUpdated', (e) => {
                console.log('Real-time bid received via Reverb global channel!', e);
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

    return (
        <AuthenticatedLayout user={auth.user} header={<h2 className="font-semibold text-xl leading-tight">Live Trading Floor</h2>}>
            <Head title="Marketplace" />
            
            <div className="py-12 max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-8">
                
                {/* --- MARKET TREND INTELLIGENCE ALERTS (Clears unused 'trends' warning) --- */}
                {trends.length > 0 && (
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                        <ArrowTrendingUpIcon className="w-5 h-5 text-blue-500" />
                        <span className="text-sm font-medium text-slate-700">Live Market Spikes Detected in Dipolog Trading Hubs.</span>
                    </div>
                )}

                {/* --- THE REAL-TIME RECEIVING BAY WITH MAPS --- */}
                {activeOrders.length > 0 && (
                    <div className="space-y-6">
                        {activeOrders.map(order => (
                            <div key={order.order_id} className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                                <div className="bg-slate-800 text-white p-4 flex justify-between items-center">
                                    <h3 className="text-md font-bold flex items-center gap-2">
                                        <TruckIcon className="w-5 h-5 animate-pulse" />
                                        Consignment Delivery Tracker: #{order.order_id}
                                    </h3>
                                    <span className="bg-blue-600 text-white text-xs font-mono px-3 py-1 rounded">
                                        {order.fish_name} ({order.weight_kg}kg)
                                    </span>
                                </div>

                                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Map Visualization Layout Section */}
                                    <div className="lg:col-span-2">
                                        <DeliveryTracker status={order.status} location={order.location} />
                                    </div>

                                    {/* Escrow Information & Confirmation Controls */}
                                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 flex flex-col justify-between">
                                        <div>
                                            <h5 className="font-bold text-slate-800 text-md">Consignment Ledger</h5>
                                            <p className="text-sm text-slate-600 mt-2">
                                                Total Value: <strong className="text-emerald-600">₱{parseFloat(order.final_price).toLocaleString()}</strong>
                                            </p>
                                            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                                                Funds are held securely within system escrow balances. Confirm delivery destination arrivals to release capital to workers.
                                            </p>
                                        </div>

                                        {order.status === 'en_route' ? (
                                            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold rounded-lg text-center animate-pulse">
                                                🛵 Courier has collected cargo. En route from Galas Port...
                                            </div>
                                        ) : (
                                            <div className="mt-4">
                                                <button 
                                                    onClick={() => useForm().post(route('orders.confirm', order.order_id), { preserveScroll: true })}
                                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-bold shadow transition-all active:scale-[0.97]"
                                                >
                                                    Confirm Delivery & Pay
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* --- LIVE BIDDING GRID CARD CARDS --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {listings.length === 0 ? (
                        <p className="text-slate-400 text-sm py-6 col-span-full text-center bg-white border rounded-xl">
                            No active fish listings available on the trading floor right now.
                        </p>
                    ) : (
                        listings.map(listing => (
                            <LiveListingCard key={listing.id} initialListing={listing} />
                        ))
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

// Dedicated child component for handling individual WebSocket connection states cleanly
function LiveListingCard({ initialListing }) {
    const [listing, setListing] = useState(initialListing);
    const [isFlashing, setIsFlashing] = useState(false);

    const { data, setData, post, processing } = useForm({
        bid_amount: '',
        listing_id: listing.id
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
            onSuccess: () => setData('bid_amount', '') 
        });
    };

    return (
        <div className={`p-6 border rounded-xl shadow transition-all duration-500 ${isFlashing ? 'bg-green-50 border-green-500 ring-4 ring-green-100' : 'bg-white border-slate-200 hover:shadow-md'}`}>
            <h3 className="font-bold text-lg text-slate-800">Catch Crate #{listing.id}</h3>
            
            <div className="mt-4 mb-4">
                <span className="text-sm text-slate-500 block">Current Market Bid: </span>
                <span className="font-black text-3xl text-blue-600">
                    ₱{Number(listing.current_bid).toLocaleString()}
                </span>
            </div>

            <form onSubmit={submitBid} className="flex space-x-2">
                <input 
                    type="number" 
                    value={data.bid_amount}
                    onChange={e => setData('bid_amount', e.target.value)}
                    className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder={`> ₱${listing.current_bid}`}
                    required
                />
                <button 
                    type="submit" 
                    disabled={processing}
                    className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                    Bid
                </button>
            </form>
        </div>
    );
}