import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { ClockIcon, CheckBadgeIcon, TruckIcon } from '@heroicons/react/24/outline';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

export default function Marketplace({ auth, initialListings, activeOrders = [] }) {
    const [listings, setListings] = useState(initialListings);
    const [now, setNow] = useState(new Date().getTime());
    const [fulfillListing, setFulfillListing] = useState(null);
    const [rating, setRating] = useState(5);

    // --- THE HEARTBEAT & WEBSOCKETS ---
    useEffect(() => {
        const timer = setInterval(() => {
            setNow(new Date().getTime());
        }, 1000);

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
                clearInterval(timer);
                window.Echo.leaveChannel('marketplace');
            };
        } else {
            return () => clearInterval(timer);
        }
    }, []);

    const formatTimeLeft = (endTimeString) => {
        const endTime = new Date(endTimeString).getTime();
        const distance = endTime - now;

        if (distance < 0) return "AUCTION CLOSED";

        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
    };

    const placeBid = (listingId, currentBid) => {
        const newBid = parseFloat(currentBid) + 50; 
        router.post(route('bids.store', listingId), { bid_amount: newBid }, { preserveScroll: true });
    };

    const handleLogistics = (type) => {
        if (!fulfillListing) return;

        router.post(route('orders.store', fulfillListing.id), {
            logistics_type: type
        }, {
            onSuccess: () => {
                setFulfillListing(null);
                setListings(listings.filter(l => l.id !== fulfillListing.id));
            },
            preserveScroll: true
        });
    };

    const submitRating = (orderId) => {
        router.post(route('orders.confirm', orderId), { rating: rating }, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-2xl text-slate-800 tracking-tight">Live Trading Floor</h2>}
        >
            <Head title="Marketplace" />

            <div className="py-12 bg-slate-100 min-h-screen">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-8">
                    
                    {/* --- THE RECEIVING BAY (Phase 5 Handover) --- */}
                    {activeOrders.length > 0 && (
                        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                            <div className="bg-slate-800 text-white p-4">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <TruckIcon className="w-6 h-6" />
                                    Receiving Bay: Your Incoming Logistics
                                </h3>
                            </div>
                            <div className="p-4 space-y-4">
                                {activeOrders.map(order => (
                                    <div key={order.order_id} className={`p-5 rounded-lg border ${order.status === 'delivered' ? 'bg-emerald-50 border-emerald-200' : 'bg-blue-50 border-blue-200'}`}>
                                        
                                        {order.status === 'en_route' ? (
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-bold text-blue-800 text-lg">🛵 Rider is En Route</p>
                                                    <p className="text-blue-600">Carrying {order.weight_kg}kg of {order.fish_name} (₱{parseFloat(order.final_price).toLocaleString()})</p>
                                                </div>
                                                <span className="animate-pulse bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">In Transit</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                                <div>
                                                    <p className="font-bold text-emerald-800 text-lg flex items-center gap-2">
                                                        <CheckBadgeIcon className="w-6 h-6" />
                                                        Rider has Arrived!
                                                    </p>
                                                    <p className="text-emerald-600">Please confirm receipt of your {order.fish_name} to release funds.</p>
                                                </div>
                                                
                                                <div className="flex items-center gap-3 bg-white p-2 rounded-lg shadow-sm border border-emerald-100">
                                                    <select 
                                                        value={rating} 
                                                        onChange={(e) => setRating(e.target.value)}
                                                        className="rounded-lg border-slate-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                                                    >
                                                        <option value="5">⭐⭐⭐⭐⭐ (Perfect)</option>
                                                        <option value="4">⭐⭐⭐⭐ (Good)</option>
                                                        <option value="3">⭐⭐⭐ (Average)</option>
                                                        <option value="2">⭐⭐ (Poor)</option>
                                                        <option value="1">⭐ (Unacceptable)</option>
                                                    </select>
                                                    <button 
                                                        onClick={() => submitRating(order.order_id)}
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold shadow transition-transform active:scale-95"
                                                    >
                                                        Confirm & Rate
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* --- THE LIVE LISTINGS --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {listings.length === 0 ? (
                            <div className="col-span-full bg-white p-10 text-center rounded-xl shadow-sm border text-slate-500">
                                No active fish listings at the port right now.
                            </div>
                        ) : (
                            listings.map((listing) => {
                                const isClosed = new Date(listing.ends_at).getTime() - now < 0;

                                return (
                                    <div key={listing.id} className={`rounded-xl shadow-md overflow-hidden border transition-all ${isClosed ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200 hover:shadow-lg'}`}>
                                        
                                        <div className={`p-4 text-white flex justify-between items-center ${isClosed ? 'bg-amber-600' : 'bg-blue-600'}`}>
                                            <h3 className="text-xl font-bold">{listing.fish_name}</h3>
                                            {!isClosed && <span className="bg-blue-800 text-xs px-2 py-1 rounded-full animate-pulse">Live</span>}
                                        </div>
                                        
                                        <div className="p-6 space-y-4">
                                            <div className="flex justify-between border-b pb-2">
                                                <span className="text-slate-500">Weight</span>
                                                <span className="font-bold">{listing.weight_kg} kg</span>
                                            </div>
                                            <div className="flex justify-between border-b pb-2">
                                                <span className="text-slate-500">Location</span>
                                                <span className="font-medium">{listing.location}</span>
                                            </div>
                                            
                                            <div className={`flex items-center justify-center space-x-2 py-2 rounded-lg font-mono font-bold text-lg ${isClosed ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
                                                <ClockIcon className="w-6 h-6" />
                                                <span>{formatTimeLeft(listing.ends_at)}</span>
                                            </div>
                                            
                                            <div className="pt-2 text-center">
                                                <span className="text-sm text-slate-500 uppercase tracking-widest font-bold">Winning Bid</span>
                                                <div className={`text-4xl font-extrabold transition-colors duration-300 ${isClosed ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                    ₱{parseFloat(listing.current_bid).toLocaleString()}
                                                </div>
                                            </div>

                                            {isClosed ? (
                                                <button 
                                                    onClick={() => setFulfillListing(listing)}
                                                    className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-lg shadow-sm transition-transform active:scale-95"
                                                >
                                                    📦 Arrange Logistics
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => placeBid(listing.id, listing.current_bid)}
                                                    className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-lg shadow-sm transition-transform active:scale-95"
                                                >
                                                    Bid +₱50
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* THE LOGISTICS MODAL */}
            <Modal show={fulfillListing !== null} onClose={() => setFulfillListing(null)}>
                <div className="p-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                        🎉 Auction Won!
                    </h2>
                    <p className="text-md text-slate-600 mb-6">
                        Congratulations! You secured the <strong>{fulfillListing?.weight_kg}kg {fulfillListing?.fish_name}</strong> for <strong>₱{parseFloat(fulfillListing?.current_bid).toLocaleString()}</strong>. 
                        How would you like to receive this order from {fulfillListing?.location}?
                    </p>
                    
                    <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
                        <SecondaryButton onClick={() => handleLogistics('self_pickup')} className="justify-center py-3">
                            🚙 Self Pick-Up
                        </SecondaryButton>
                        <PrimaryButton onClick={() => handleLogistics('request_rider')} className="justify-center py-3 bg-emerald-600 hover:bg-emerald-700">
                            🛵 Request Delivery Rider
                        </PrimaryButton>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}