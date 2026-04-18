import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { MapPinIcon, ScaleIcon, CurrencyBanknotesIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

export default function Dispatch({ auth, availableJobs, activeJobs }) {
    const [activeTab, setActiveTab] = useState('radar'); // 'radar' or 'active'

    const handleAcceptJob = (orderId) => {
        router.post(route('dispatch.accept', orderId), {}, { preserveScroll: true });
        setActiveTab('active'); // Switch to active tab instantly
    };

    const handleMarkDelivered = (orderId) => {
        router.post(route('dispatch.delivered', orderId), {}, { preserveScroll: true });
        setActiveTab('radar'); // Send them back to find more jobs
    };

    return (
        <AuthenticatedLayout user={auth.user} header={<h2 className="font-semibold text-xl text-slate-800 tracking-tight">Rider Terminal</h2>}>
            <Head title="Rider Dispatch" />

            <div className="py-8 bg-slate-100 min-h-screen">
                <div className="max-w-md mx-auto sm:px-6 lg:px-8 space-y-4">
                    
                    {/* Top Navigation Tabs */}
                    <div className="flex bg-white rounded-xl shadow-sm p-1 border border-slate-200">
                        <button 
                            onClick={() => setActiveTab('radar')}
                            className={`flex-1 py-2 text-center text-sm font-bold rounded-lg transition-colors ${activeTab === 'radar' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            Live Radar ({availableJobs.length})
                        </button>
                        <button 
                            onClick={() => setActiveTab('active')}
                            className={`flex-1 py-2 text-center text-sm font-bold rounded-lg transition-colors ${activeTab === 'active' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            Active Mission ({activeJobs.length})
                        </button>
                    </div>

                    {/* LIVE RADAR VIEW */}
                    {activeTab === 'radar' && (
                        <div className="space-y-4">
                            {availableJobs.length === 0 ? (
                                <div className="text-center py-10 bg-white rounded-xl border border-slate-200 shadow-sm">
                                    <p className="text-slate-500 font-medium">No active jobs right now.</p>
                                </div>
                            ) : (
                                availableJobs.map((job) => (
                                    <div key={job.order_id} className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                            <span className="font-bold text-slate-800 flex items-center gap-2">
                                                <MapPinIcon className="w-5 h-5 text-red-500" />
                                                Pickup: {job.pickup_location}
                                            </span>
                                            <span className="text-xs font-bold px-2 py-1 bg-amber-100 text-amber-700 rounded-full animate-pulse">NEW</span>
                                        </div>
                                        <div className="p-4 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-500">Cargo</span>
                                                <span className="font-bold text-lg">{job.fish_name}</span>
                                            </div>
                                            <button onClick={() => handleAcceptJob(job.order_id)} className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-md text-lg">
                                                🛵 Accept Delivery
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* ACTIVE MISSION VIEW */}
                    {activeTab === 'active' && (
                        <div className="space-y-4">
                            {activeJobs.length === 0 ? (
                                <div className="text-center py-10 bg-white rounded-xl border border-slate-200 shadow-sm">
                                    <p className="text-slate-500 font-medium">You have no active deliveries.</p>
                                </div>
                            ) : (
                                activeJobs.map((job) => (
                                    <div key={job.order_id} className="bg-white rounded-xl shadow-md border-2 border-emerald-500 overflow-hidden">
                                        <div className="p-4 bg-emerald-50 border-b border-emerald-100 text-center">
                                            <span className="font-bold text-emerald-800 uppercase tracking-wider text-sm">Currently Delivering</span>
                                        </div>
                                        <div className="p-4 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-500">Cargo</span>
                                                <span className="font-bold text-lg">{job.fish_name}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-500">Weight</span>
                                                <span className="font-medium">{job.weight_kg} kg</span>
                                            </div>
                                            <button onClick={() => handleMarkDelivered(job.order_id)} className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-md text-lg flex justify-center items-center gap-2">
                                                <CheckCircleIcon className="w-6 h-6" /> Fish Handed Over
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                </div>
            </div>
        </AuthenticatedLayout>
    );
}