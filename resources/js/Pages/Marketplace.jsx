import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function Marketplace({ auth, listings }) {
    // We map through the initial listings passed by Inertia from your controller
    return (
        <AuthenticatedLayout user={auth.user} header={<h2 className="font-semibold text-xl leading-tight">Marketplace</h2>}>
            <Head title="Marketplace" />
            <div className="py-12 max-w-7xl mx-auto sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                {listings.map(listing => (
                    <LiveListingCard key={listing.id} initialListing={listing} />
                ))}
            </div>
        </AuthenticatedLayout>
    );
}

// 1. Create a dedicated component for the card so it manages its own WebSocket state
function LiveListingCard({ initialListing }) {
    const [listing, setListing] = useState(initialListing);
    const [isFlashing, setIsFlashing] = useState(false);

    const { data, setData, post, processing } = useForm({
        bid_amount: '',
        listing_id: listing.id
    });

    useEffect(() => {
        // 2. Connect to Laravel Reverb for this specific listing's channel
        const channel = window.Echo.channel(`marketplace.${listing.id}`);

        channel.listen('CatchBidUpdated', (eventData) => {
            console.log('Real-time bid received via Reverb!', eventData);
            
            // 3. Update the state instantly when Reverb broadcasts
            setListing(prev => ({
                ...prev,
                current_bid: eventData.current_bid
            }));

            // 4. Trigger a UI flash to catch the user's eye
            setIsFlashing(true);
            setTimeout(() => setIsFlashing(false), 1000);
        });

        // Cleanup: Disconnect when the user leaves the page
        return () => window.Echo.leaveChannel(`marketplace.${listing.id}`);
    }, [listing.id]);

    const submitBid = (e) => {
        e.preventDefault();
        // Uses your BidController's store method
        post(route('bids.store'), {
            preserveScroll: true,
            onSuccess: () => setData('bid_amount', '') 
        });
    };

    return (
        <div className={`p-6 border rounded-lg shadow transition-colors duration-500 ${isFlashing ? 'bg-green-100 border-green-500' : 'bg-white'}`}>
            <h3 className="font-bold text-lg text-gray-800">Catch #{listing.id}</h3>
            
            <div className="mt-4 mb-4">
                <span className="text-sm text-gray-500 block">Current Market Bid: </span>
                <span className="font-extrabold text-3xl text-blue-600">
                    ₱{Number(listing.current_bid).toLocaleString()}
                </span>
            </div>

            <form onSubmit={submitBid} className="flex space-x-2">
                <input 
                    type="number" 
                    value={data.bid_amount}
                    onChange={e => setData('bid_amount', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                    placeholder={`> ₱${listing.current_bid}`}
                    required
                />
                <button 
                    type="submit" 
                    disabled={processing}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    Bid
                </button>
            </form>
        </div>
    );
}