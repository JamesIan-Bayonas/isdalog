import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';
import Modal from '@/Components/Modal'; // Bringing in the built-in Modal
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

export default function Marketplace({ auth, initialListings }) {
    const [listings, setListings] = useState(initialListings);
    const [now, setNow] = useState(new Date().getTime());
    
    // NEW: State to control the Logistics Modal
    const [fulfillListing, setFulfillListing] = useState(null);

    // --- THE HEARTBEAT & WEBSOCKETS ---
    useEffect(() => {
        const timer = setInterval(() => {
            setNow(new Date().getTime());
        }, 1000);

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

    // NEW: Function to send the logistics choice to our OrderController
    const handleLogistics = (type) => {
        if (!fulfillListing) return;

        router.post(route('orders.store', fulfillListing.id), {
            logistics_type: type
        }, {
            onSuccess: () => {
                setFulfillListing(null); // Close modal on success
                // Remove the fulfilled listing from the active board
                setListings(listings.filter(l => l.id !== fulfillListing.id));
            },
            preserveScroll: true
        });
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

                                        {/* THE SMART BUTTON */}
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
                        })}
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