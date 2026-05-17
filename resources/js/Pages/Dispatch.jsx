import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { MapPinIcon, ScaleIcon, CurrencyBanknotesIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';
import { useState } from 'react';

export default function Dispatch({ activeDeliveries }) {
    const [isProcessing, setIsProcessing] = useState(false);

    const handleDeliveryComplete = (listingId) => {
        setIsProcessing(true);
        
        router.post(`/dispatch/${listingId}/complete`, {}, {
            preserveScroll: true,
            onSuccess: (page) => {
                setIsProcessing(false);
                // Optional: Trigger a toast notification here
                console.log("Escrow Released:", page.props.flash.success);
            },
            onError: () => {
                setIsProcessing(false);
                console.error("Failed to release escrow.");
            }
        });
    };

    return (
        <div className="p-6">
            {/* Map over deliveries... */}
            <button 
                onClick={() => handleDeliveryComplete(delivery.listing_id)}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
                {isProcessing ? 'Processing Escrow...' : 'Confirm Delivery & Pay Fisherman'}
            </button>
        </div>
    );
}