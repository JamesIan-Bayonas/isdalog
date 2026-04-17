import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { MapPinIcon, ScaleIcon, CurrencyBanknotesIcon } from '@heroicons/react/24/outline';

export default function Dispatch({ auth, availableJobs }) {
    
    // Function to handle the "Accept Job" button
    const handleAcceptJob = (orderId) => {
        router.post(route('dispatch.accept', orderId), {}, {
            preserveScroll: true
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-slate-800 tracking-tight">Rider Dispatch</h2>}
        >
            <Head title="Rider Dispatch" />

            <div className="py-8 bg-slate-100 min-h-screen">
                {/* Notice the max-w-md: This forces the UI to look like a mobile phone screen even on desktop! */}
                <div className="max-w-md mx-auto sm:px-6 lg:px-8 space-y-4">
                    
                    <div className="bg-blue-600 text-white p-4 rounded-xl shadow-md text-center">
                        <h3 className="text-lg font-bold">Live Radar</h3>
                        <p className="text-blue-100 text-sm">Searching for delivery requests...</p>
                    </div>

                    {availableJobs.length === 0 ? (
                        <div className="text-center py-10 bg-white rounded-xl border border-slate-200 shadow-sm">
                            <p className="text-slate-500 font-medium">No active jobs right now.</p>
                            <p className="text-sm text-slate-400 mt-1">Grab a coffee and stand by.</p>
                        </div>
                    ) : (
                        availableJobs.map((job) => (
                            <div key={job.order_id} className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                    <span className="font-bold text-slate-800 flex items-center gap-2">
                                        <MapPinIcon className="w-5 h-5 text-red-500" />
                                        Pickup: {job.pickup_location}
                                    </span>
                                    <span className="text-xs font-bold px-2 py-1 bg-amber-100 text-amber-700 rounded-full animate-pulse">
                                        NEW JOB
                                    </span>
                                </div>
                                
                                <div className="p-4 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500 flex items-center gap-2">
                                            🐟 Cargo
                                        </span>
                                        <span className="font-bold text-lg">{job.fish_name}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500 flex items-center gap-2">
                                            <ScaleIcon className="w-5 h-5" /> Weight
                                        </span>
                                        <span className="font-medium">{job.weight_kg} kg</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500 flex items-center gap-2">
                                            <CurrencyBanknotesIcon className="w-5 h-5" /> Market Value
                                        </span>
                                        <span className="font-medium text-emerald-600 font-mono">₱{parseFloat(job.final_price).toLocaleString()}</span>
                                    </div>
                                    
                                    <button 
                                        onClick={() => handleAcceptJob(job.order_id)}
                                        className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-md transition-transform active:scale-95 text-lg"
                                    >
                                        🛵 Accept Delivery
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}