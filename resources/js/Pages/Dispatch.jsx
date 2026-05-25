import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function Dispatch({ auth, riderStatus, riderMetadata, jobs }) {
    const [activeDelivery, setActiveDelivery] = useState(null);

    // Inertia form state tracker for capturing driver credentials
    const { data, setData, post, processing, errorsResult } = useForm({
        license_number: '',
        vehicle_plate: '',
        vehicle_type: 'Motorcycle',
    });

    const handleUploadSubmit = (e) => {
        e.preventDefault();
        post(route('dispatch.verify.submit'), {
            preserveScroll: true,
        });
    };

    const claimJobAction = (job) => {
        setActiveDelivery(job);
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">🚚 Regional Cargo Dispatch Desk</h2>}
        >
            <Head title="Logistics Dispatch" />

            <div className="py-12 max-w-7xl mx-auto sm:px-6 lg:px-8">

                {/* ========================================================================= */}
                {/* STATE A: UNVERIFIED RIDER - THE CREDENTIAL UPLOAD PORTAL                  */}
                {/* ========================================================================= */}
                {riderStatus === 'unverified' && (
                    <div className="bg-white p-8 shadow-sm sm:rounded-lg border border-gray-200 max-w-2xl mx-auto">
                        <div className="text-center mb-6">
                            <span className="text-4xl">🪪</span>
                            <h3 className="text-xl font-bold text-gray-900 mt-2">Rider Identity Verification</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                To protect local maritime asset allocations, you must link your professional driver credentials before claiming cargo crates at Galas Port.
                            </p>
                        </div>

                        <form onSubmit={handleUploadSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700">Driver's License Number</label>
                                <input 
                                    type="text"
                                    placeholder="e.g., L03-45-123456"
                                    value={data.license_number}
                                    onChange={e => setData('license_number', e.target.value)}
                                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700">Vehicle Plate Number / MV File</label>
                                    <input 
                                        type="text"
                                        placeholder="e.g., 123-ABC or J7-8910"
                                        value={data.vehicle_plate}
                                        onChange={e => setData('vehicle_plate', e.target.value)}
                                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700">Transport Vehicle Classification</label>
                                    <select 
                                        value={data.vehicle_type}
                                        onChange={e => setData('vehicle_type', e.target.value)}
                                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    >
                                        <option value="Motorcycle">Motorcycle (Insulated Box Container)</option>
                                        <option value="Trisikad">Cargo Tricycle (LGU Registered)</option>
                                        <option value="Utility Truck">Multi-cab / Pickup Bed Truck</option>
                                    </select>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4">
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    ⚠️ <strong>Chain-of-Custody Accountability Clause:</strong> By submitting these credentials, you acknowledge that accepting a dispatch listing binds your profile to the physical financial value of the cargo. Theft or unlogged inventory loss results in instant suspension and administrative escalation.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition shadow-md disabled:opacity-50"
                            >
                                {processing ? 'Encrypting & Uploading Matrix...' : 'Securely Submit Rider Credentials'}
                            </button>
                        </form>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* STATE B: PENDING REVIEW STATE                                             */}
                {/* ========================================================================= */}
                {riderStatus === 'pending_review' && (
                    <div className="bg-white p-8 text-center shadow-sm sm:rounded-lg border border-yellow-200 max-w-md mx-auto">
                        <div className="animate-bounce text-4xl">⏳</div>
                        <h3 className="text-lg font-bold text-yellow-800 mt-4">Logistics Verification Pending</h3>
                        <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                            Your Driver's License and vehicle plate signatures have been safely logged into the database. Administrative officials are vetting your profile against local port records.
                        </p>
                        <div className="mt-4 p-3 bg-yellow-50 text-xs text-yellow-700 font-mono rounded border border-yellow-100">
                            Current Node Code Security Check: Status: LOCK_PENDING_APPROVAL
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* STATE C: VERIFIED OPERATIONAL RIDER HUB                                    */}
                {/* ========================================================================= */}
                {riderStatus === 'verified' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* LEFT COLUMN: ACTIVE ROUTE LOGS */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white p-6 shadow-sm sm:rounded-lg border border-gray-200">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    🌐 Available Supply Open Contracts Pool
                                </h3>

                                <div className="space-y-4">
                                    {jobs.map((job) => (
                                        <div key={job.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex justify-between items-center hover:shadow-sm transition">
                                            <div>
                                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-bold">
                                                    📦 {job.weight}
                                                </span>
                                                <h4 className="text-sm font-bold text-gray-800 mt-1">{job.species}</h4>
                                                <p className="text-xs text-gray-500 mt-1">📍 <strong>From:</strong> {job.origin}</p>
                                                <p className="text-xs text-gray-500">🏁 <strong>To:</strong> {job.destination}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-black text-green-600">{job.payout}</p>
                                                <button
                                                    onClick={() => claimJobAction(job)}
                                                    className="mt-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold py-1.5 px-4 rounded transition shadow"
                                                >
                                                    Claim Contract
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: ACTIVE TRANSFER CHAIN-OF-CUSTODY HANDSHAKE */}
                        <div className="space-y-6">
                            <div className="bg-white p-6 shadow-sm sm:rounded-lg border border-gray-200">
                                <h3 className="text-md font-bold text-gray-900 mb-3">🔏 Active Chain-of-Custody</h3>
                                
                                {activeDelivery ? (
                                    <div className="space-y-4">
                                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                            <p className="text-xs text-blue-800 font-bold uppercase tracking-wide">Current Assignment</p>
                                            <p className="text-sm font-black text-blue-900 mt-1">{activeDelivery.species}</p>
                                        </div>

                                        {/* DIGITAL HANDSHAKE SCANNER MODULE SIMULATOR */}
                                        <div className="p-4 bg-gray-900 rounded-xl text-center text-white">
                                            <p className="text-xs font-semibold uppercase text-gray-400">Handshake Gateway</p>
                                            <div className="my-3 flex justify-center">
                                                {/* Simulated QR Verification Matrix */}
                                                <div className="bg-white p-2 rounded-lg inline-block">
                                                    <div className="w-32 h-32 bg-gray-200 border-4 border-dashed border-gray-400 flex items-center justify-center text-black text-xs font-mono">
                                                        [QR Matrix Scan]
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-300 px-2">
                                                Scan the Fisherman's screen at checkout port to unlock transit token validation parameters.
                                            </p>
                                            <button 
                                                onClick={() => alert("Cryptographic Transfer Verification Cleared. Database updated to: IN_TRANSIT.")}
                                                className="mt-3 w-full bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-2 rounded-lg transition"
                                            >
                                                Simulate Port Pickup Complete
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-400 text-sm italic">
                                        No active cargo contracts running. Select an open supply allocation from the pool to generate your transport tracking keys.
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                )}

            </div>
        </AuthenticatedLayout>
    );
}