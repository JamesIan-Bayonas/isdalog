import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { MapPinIcon, ScaleIcon, CurrencyBanknotesIcon, CheckCircleIcon, TruckIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';

export default function Dispatch({ auth, openJobs: initialJobs = [] }) {
    const [jobs, setJobs] = useState(initialJobs);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        // 1. Connect to the local Laravel Reverb broadcast pipeline
        if (window.Echo) {
            const channel = window.Echo.channel('logistics.dispatch');
            
            channel.listen('OrderDispatched', (e) => {
                console.log('New delivery job broadcasted live from Reverb!', e);
                
                // 2. Append the new job to the rider's queue state array instantly
                setJobs((currentJobs) => [e, ...currentJobs]);
            });

            return () => {
                window.Echo.leaveChannel('logistics.dispatch');
            };
        }
    }, []);

    const handleClaimJob = (orderId) => {
        setIsProcessing(true);
        
        // Triggers the claim routing mechanism in DispatchController
        router.post(`/dispatch/${orderId}/claim`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                setIsProcessing(false);
                // Filter out the claimed job from the available board view pool
                setJobs((currentJobs) => currentJobs.filter(job => job.order_id !== orderId));
            },
            onError: () => {
                setIsProcessing(false);
                console.error("Failed to claim route.");
            }
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-2xl text-slate-800 tracking-tight">Rider Dispatch Hub</h2>}
        >
            <Head title="Rider Dispatch" />

            <div className="py-12 bg-slate-50 min-h-screen">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Available Cargo Delivery Routes</h3>
                            <p className="text-sm text-slate-500 mt-1">
                                Secure fish consignments ready for transport from Galas Port docks. Claim routes to begin delivery.
                            </p>
                        </div>
                        <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                            <TruckIcon className="w-4 h-4" /> Live Board
                        </span>
                    </div>

                    {/* --- OPEN JOBS LOOP MATRIX --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {jobs.length === 0 ? (
                            <div className="col-span-full bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-400 font-medium">
                                No shipments are currently awaiting dispatch. Standby for incoming port allocations.
                            </div>
                        ) : (
                            jobs.map((job) => (
                                <div key={job.order_id} className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden hover:shadow-lg transition-all flex flex-col justify-between">
                                    <div className="p-4 bg-slate-800 text-white flex justify-between items-center">
                                        <span className="text-xs font-mono tracking-widest bg-slate-700 px-2 py-1 rounded">ROUTE #{job.order_id}</span>
                                        <span className="text-xs bg-amber-400 text-slate-900 font-extrabold px-2 py-1 rounded-full uppercase">Ready</span>
                                    </div>

                                    <div className="p-6 space-y-4 flex-grow">
                                        <h4 className="text-2xl font-extrabold text-slate-900">{job.fish_name}</h4>
                                        
                                        <div className="space-y-2.5 pt-2">
                                            <div className="flex items-center text-slate-600 gap-2.5 text-md">
                                                <ScaleIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                                                <span>Cargo Weight: <strong className="text-slate-800">{job.weight_kg} kg</strong></span>
                                            </div>
                                            <div className="flex items-center text-slate-600 gap-2.5 text-md">
                                                <MapPinIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                                                <span>Origin Pickup: <strong className="text-slate-800">{job.location || 'Galas Port'}</strong></span>
                                            </div>
                                            <div className="flex items-center text-slate-600 gap-2.5 text-md">
                                                <CurrencyBanknotesIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                                                <span>Delivery Payout: <strong className="text-emerald-600">₱{parseFloat(job.final_price).toLocaleString()}</strong></span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-slate-50 border-t border-slate-100">
                                        <button 
                                            onClick={() => handleClaimJob(job.order_id)}
                                            disabled={isProcessing}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            <CheckCircleIcon className="w-5 h-5" />
                                            {isProcessing ? 'Claiming Route...' : 'Claim Route & Accept Delivery'}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}