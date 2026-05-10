import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';

export default function Dashboard() {
    const { auth } = usePage().props;
    const user = auth.user;

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">My Dashboard</h2>}
        >
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Welcome Banner */}
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900 border-l-4 border-blue-500">
                            Welcome back, <strong>{user.name}</strong>! Your maritime ecosystem is active.
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* THE ESCROW WALLET UI (Business Model Proof) */}
                        <div className="md:col-span-2 overflow-hidden bg-gradient-to-br from-blue-900 to-indigo-900 shadow-xl sm:rounded-lg relative">
                            {/* Decorative Background */}
                            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10"></div>
                            <div className="absolute bottom-0 right-10 w-24 h-24 rounded-full bg-white opacity-5"></div>
                            
                            <div className="p-8 text-white relative z-10">
                                <p className="text-blue-200 text-sm font-semibold tracking-wider uppercase mb-1">Available Escrow Balance</p>
                                <h3 className="text-5xl font-bold mb-6 tracking-tight">
                                    <span className="text-3xl text-blue-300 mr-1">₱</span>
                                    {parseFloat(user.wallet_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </h3>
                                
                                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                                    <button 
                                        className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition transform hover:-translate-y-1 flex items-center justify-center"
                                        onClick={() => alert("Simulated: Initiating transfer to GCash account...")}
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                                        Withdraw to GCash
                                    </button>
                                    <button className="bg-transparent border border-blue-400 hover:bg-blue-800 text-blue-100 font-bold py-3 px-6 rounded-lg transition flex items-center justify-center">
                                        View Ledger History
                                    </button>
                                </div>
                                <p className="text-xs text-blue-300 mt-4 opacity-75">
                                    * IsdaLog automatically deducts a 3% platform fee before releasing funds to Escrow.
                                </p>
                            </div>
                        </div>

                        {/* Quick Stats Panel */}
                        <div className="bg-white shadow-sm sm:rounded-lg p-6 border-t-4 border-emerald-500">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Account Status</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b pb-2">
                                    <span className="text-gray-600 text-sm">Role</span>
                                    <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-md uppercase tracking-wide">
                                        {user.role}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center border-b pb-2">
                                    <span className="text-gray-600 text-sm">Trust Rating</span>
                                    <span className="text-yellow-500 font-bold flex items-center">
                                        5.0 <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                                    </span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}