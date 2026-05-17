import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function Dashboard({ auth }) {
    const [showFishermanForm, setShowFishermanForm] = useState(false);
    
    const { data, setData, post, processing } = useForm({
        requested_role: 'fisherman',
        contact_number: '',
        bfar_registration_number: '',
    });

    const submitRequest = (e) => {
        e.preventDefault();
        post(route('profile.upgrade.request'), {
            preserveScroll: true,
            onSuccess: () => setShowFishermanForm(false),
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Marketplace Dashboard</h2>}
        >
            <Head title="Dashboard" />

            <div className="py-12 max-w-7xl mx-auto sm:px-6 lg:px-8">
                
                {/* --- PROGRESSIVE ONBOARDING BANNER --- */}
                {auth.user.role === 'buyer' && !auth.user.requested_role && !showFishermanForm && (
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-6 shadow-sm sm:rounded-lg flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold text-blue-900">Work with IsdaLog</h3>
                            <p className="text-sm text-blue-700 mt-1">
                                Are you a maritime worker at Galas Port? Upgrade your account to access the Escrow Hub and Zero-Typing AI Bot.
                            </p>
                        </div>
                        <button 
                            onClick={() => setShowFishermanForm(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded transition"
                        >
                            Apply as Fisherman
                        </button>
                    </div>
                )}

                {/* --- PENDING REVIEW STATE --- */}
                {auth.user.requested_role && auth.user.role === 'buyer' && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 shadow-sm sm:rounded-lg">
                        <h3 className="font-bold text-yellow-800">Verification Pending</h3>
                        <p className="text-sm text-yellow-700">
                            Your request to become a {auth.user.requested_role} is currently being reviewed by an administrator. 
                            We are verifying your submitted IDs.
                        </p>
                    </div>
                )}

                {/* --- THE UPGRADE FORM --- */}
                {showFishermanForm && (
                    <div className="bg-white p-6 mb-6 shadow-sm sm:rounded-lg border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Fisherman Verification Form</h3>
                        <form onSubmit={submitRequest} className="space-y-4 max-w-md">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Active Contact Number</label>
                                <input 
                                    type="text" 
                                    value={data.contact_number}
                                    onChange={e => setData('contact_number', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">BFAR Registration Number (FishR)</label>
                                <input 
                                    type="text" 
                                    value={data.bfar_registration_number}
                                    onChange={e => setData('bfar_registration_number', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    placeholder="e.g. PH-1234-5678"
                                    required 
                                />
                            </div>
                            <div className="flex space-x-3">
                                <button 
                                    type="submit" 
                                    disabled={processing}
                                    className="bg-blue-600 text-white px-4 py-2 rounded shadow-sm hover:bg-blue-700 disabled:opacity-50"
                                >
                                    Submit for Review
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setShowFishermanForm(false)}
                                    className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* ... The rest of your normal Buyer Marketplace components ... */}

            </div>
        </AuthenticatedLayout>
    );
}