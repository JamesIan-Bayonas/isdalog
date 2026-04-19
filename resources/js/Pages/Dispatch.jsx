import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { MapPinIcon, ScaleIcon, CurrencyBanknotesIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function Dispatch({ auth, availableJobs }) {
    
    // Separate the jobs: Which ones are finding a rider, and which one is CURRENTLY assigned to this rider?
    // (For this prototype, we assume any 'en_route' job is the active one)
    const activeJob = availableJobs.find(job => job.status === 'en_route');
    const radarJobs = availableJobs.filter(job => job.status === 'finding_rider');

    const handleAcceptJob = (orderId) => {
        router.post(route('dispatch.accept', orderId), {}, { preserveScroll: true });
    };

    const handleHandover = (orderId) => {
        router.post(route('dispatch.delivered', orderId), {}, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout user={auth.user} header={<h2 className="font-semibold text-xl text-slate-800">Rider Dispatch</h2>}>
            <Head title="Rider Dispatch" />

            <div className="py-8 bg-slate-100 min-h-screen">
                <div className="max-w-md mx-auto sm:px-6 lg:px-8 space-y-4">
                    
                    {/* --- VIEW 1: ACTIVE MISSION SCREEN --- */}
                    {activeJob ? (
                        <div className="bg-white rounded-xl shadow-2xl border-4 border-emerald-500 overflow-hidden">
                            <div className="bg-emerald-500 text-white p-4 text-center animate-pulse">
                                <h3 className="text-xl font-bold">🚀 Active Delivery</h3>
                                <p className="text-sm">Proceed to Drop-off Location</p>
                            </div>
                            
                            <div className="p-6 space-y-4">
                                <div className="text-center space-y-1">
                                    <p className="text-slate-500 text-sm">Cargo Manifest</p>
                                    <p className="text-2xl font-bold">{activeJob.weight_kg}kg of {activeJob.fish_name}</p>
                                </div>
                                
                                <button 
                                    onClick={() => handleHandover(activeJob.order_id)}
                                    className="w-full mt-4 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-5 rounded-xl shadow-lg transition-transform active:scale-95 text-xl"
                                >
                                    <CheckCircleIcon className="w-8 h-8" />
                                    Fish Handed Over
                                </button>
                            </div>
                        </div>
                    ) : (
                        
                    /* --- VIEW 2: LIVE RADAR (What you built previously) --- */
                        <>
                            <div className="bg-blue-600 text-white p-4 rounded-xl shadow-md text-center">
                                <h3 className="text-lg font-bold">Live Radar</h3>
                                <p className="text-blue-100 text-sm">Searching for delivery requests...</p>
                            </div>

                            {radarJobs.length === 0 ? (
                                <div className="text-center py-10 bg-white rounded-xl border shadow-sm">
                                    <p className="text-slate-500 font-medium">No active jobs right now.</p>
                                </div>
                            ) : (
                                radarJobs.map((job) => (
                                    <div key={job.order_id} className="bg-white rounded-xl shadow-md border overflow-hidden">
                                        <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                                            <span className="font-bold flex items-center gap-2">
                                                <MapPinIcon className="w-5 h-5 text-red-500" />
                                                Pickup: {job.pickup_location}
                                            </span>
                                        </div>
                                        <div className="p-4">
                                            <button 
                                                onClick={() => handleAcceptJob(job.order_id)}
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-md transition-transform active:scale-95 text-lg"
                                            >
                                                🛵 Accept Delivery
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}