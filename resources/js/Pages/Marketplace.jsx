import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline'; // Let's add a nice icon!

export default function Marketplace({ auth, initialListings }) {
    const [listings, setListings] = useState(initialListings);
    const [now, setNow] = useState(new Date().getTime());

    // --- THE HEARTBEAT & WEBSOCKETS ---
    useEffect(() => {
        // 1. Start the Ticking Clock (Updates the 'now' state every 1 second)
        const timer = setInterval(() => {
            setNow(new Date().getTime());
        }, 1000);

        // 2. Tune into the Reverb Radio Station
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

        // Cleanup when leaving the page
        return () => {
            clearInterval(timer);
            window.Echo.leaveChannel('marketplace');
        };
    }, []);

    // --- HELPER: FORMAT THE COUNTDOWN ---
    const formatTimeLeft = (endTimeString) => {
        const endTime = new Date(endTimeString).getTime();
        const distance = endTime - now;

        if (distance < 0) {
            return "AUCTION CLOSED";
        }

        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Pad with zeros (e.g., 05m 09s)
        return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
    };

    // --- BIDDING LOGIC ---
    const placeBid = (listingId, currentBid) => {
        const newBid = parseFloat(currentBid) + 50; 
        router.post(route('bids.store', listingId), { bid_amount: newBid }, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-2xl text-slate-800 tracking-tight">Live Trading Floor</h2>}
        >
            <Head title="Marketplace" />

            <div className="py-12 bg-slate-100 min-h-screen">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {listings.map((listing) => {
                            // Calculate if the auction is over for this specific card
                            const isClosed = new Date(listing.ends_at).getTime() - now < 0;

                            return (
                                <div key={listing.id} className={`rounded-xl shadow-md overflow-hidden border transition-all ${isClosed ? 'bg-slate-50 border-slate-300 opacity-75' : 'bg-white border-slate-200 hover:shadow-lg'}`}>
                                    
                                    {/* Header */}
                                    <div className={`p-4 text-white flex justify-between items-center ${isClosed ? 'bg-slate-500' : 'bg-blue-600'}`}>
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
                                        
                                        {/* THE TICKING CLOCK */}
                                        <div className={`flex items-center justify-center space-x-2 py-2 rounded-lg font-mono font-bold text-lg ${isClosed ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
                                            <ClockIcon className="w-6 h-6" />
                                            <span>{formatTimeLeft(listing.ends_at)}</span>
                                        </div>
                                        
                                        {/* THE LIVE PRICE */}
                                        <div className="pt-2 text-center">
                                            <span className="text-sm text-slate-500 uppercase tracking-widest font-bold">Current Bid</span>
                                            <div className={`text-4xl font-extrabold transition-colors duration-300 ${isClosed ? 'text-slate-500' : 'text-emerald-600'}`}>
                                                ₱{parseFloat(listing.current_bid).toLocaleString()}
                                            </div>
                                        </div>

                                        {/* The Bid Button (Disables if closed!) */}
                                        <button 
                                            onClick={() => placeBid(listing.id, listing.current_bid)}
                                            disabled={isClosed}
                                            className={`w-full mt-4 font-bold py-3 rounded-lg shadow-sm transition-all active:scale-95 ${isClosed ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}
                                        >
                                            {isClosed ? 'Auction Ended' : 'Bid +₱50'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                        
                        {listings.length === 0 && (
                            <div className="col-span-full text-center py-20 text-slate-500">
                                No active auctions right now. Waiting for the fleet...
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}