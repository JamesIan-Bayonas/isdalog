import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function Dispatch({ auth, riderStatus, jobs }) {
    const [activeCargo, setActiveCargo] = useState(null);

    // Inertia programmatic form handling pipeline
    const { data, setData, post, processing } = useForm({
        license_number: '',
        vehicle_plate: '',
    });

    const handleFormSubmit = (e) => {
        e.preventDefault();
        post(route('dispatch.verify.submit'), {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">🚚 Regional Cargo Dispatch Desk</h2>}
        >
            <Head title="Logistics Dispatch" />

            <div className="py-12 max-w-7xl mx-auto sm:px-6 lg:px-8">

                {/* ========================================================================= */}
                {/* CONFIGURATION A: UNVERIFIED RIDER PORTAL                                  */}
                {/* ========================================================================= */}
                {riderStatus === 'unverified' && (
                    <div className="bg-white p-8 shadow-sm sm:rounded-lg border border-gray-200 max-w-xl mx-auto">
                        <div className="text-center mb-6">
                            <span className="text-4xl">🪪</span>
                            <h3 className="text-xl font-bold text-gray-900 mt-2">Rider Identity Vetting</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Secure your account to handle logistics contracts at local harbors. Upload your legal license keys below.
                            </p>
                        </div>

                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700">Driver's License ID Code</label>
                                <input 
                                    type="text"
                                    placeholder="e.g., L03-45-123456"
                                    value={data.license_number}
                                    onChange={e => setData('license_number', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700">Vehicle LGU Registered Plate Number</label>
                                <input 
                                    type="text"
                                    placeholder="e.g., 123-XYZ"
                                    value={data.vehicle_plate}
                                    onChange={e => setData('vehicle_plate', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 mt-4"
                            >
                                {processing ? 'Uploading Matrix...' : 'Submit Credentials for Vetting'}
                            </button>
                        </form>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* CONFIGURATION B: PENDING AUDIT REVIEW CONTAINER                           */}
                {/* ========================================================================= */}
                {riderStatus === 'pending_review' && (
                    <div className="bg-white p-8 text-center shadow-sm sm:rounded-lg border border-yellow-200 max-w-md mx-auto">
                        <div className="text-4xl animate-pulse">⏳</div>
                        <h3 className="text-lg font-bold text-yellow-800 mt-4">Verification Pending Administrative Approval</h3>
                        <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                            Your identity signatures have been written to our secure database tables. An administrator or BFAR official is currently cross-matching your credentials.
                        </p>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* CONFIGURATION C: FULLY VERIFIED LOGISTICS GRID VIEW                        */}
                {/* ========================================================================= */}
                {riderStatus === 'verified' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white p-6 shadow-sm sm:rounded-lg border border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Open Harbor Supply Job Contracts</h3>
                            <div className="space-y-4">
                                {jobs.map((job) => (
                                    <div key={job.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex justify-between items-center">
                                        <div>
                                            <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-bold">{job.weight}</span>
                                            <h4 className="text-sm font-bold text-gray-800 mt-1">{job.species}</h4>
                                            <p className="text-xs text-gray-500 mt-1">📍 <strong>Pickup:</strong> {job.origin}</p>
                                            <p className="text-xs text-gray-500">🏁 <strong>Dropoff:</strong> {job.destination}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black text-green-600">{job.payout}</p>
                                            <button 
                                                onClick={() => setActiveCargo(job)}
                                                className="mt-2 bg-gray-900 text-white text-xs font-bold py-1.5 px-4 rounded hover:bg-gray-800 transition"
                                            >
                                                Lock Assignment
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* RIGHT HAND COLUMN: CUSTODY CONTROL BLOCK */}
                        <div className="bg-white p-6 shadow-sm sm:rounded-lg border border-gray-200 h-fit">
                            <h3 className="text-md font-bold text-gray-900 mb-3">🔏 Chain-of-Custody Lock</h3>
                            {activeCargo ? (
                                <div className="space-y-3">
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900 font-bold">
                                        Active: {activeCargo.species}
                                    </div>
                                    <button 
                                        onClick={() => alert("Cryptographic verification handshake executed complete.")}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 rounded-lg transition"
                                    >
                                        Simulate Port QR Handshake
                                    </button>
                                </div>
                            ) : (
                                <p className="text-xs text-gray-400 italic">Select an available job to activate your tracking ledger.</p>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </AuthenticatedLayout>
    );
}