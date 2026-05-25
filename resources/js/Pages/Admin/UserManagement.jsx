import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

export default function UserManagement({ auth, users }) {
    const [processingId, setProcessingId] = useState(null);

    // Fallback role selection mechanic handler
    const handleRoleChange = (userId, newRole) => {
        setProcessingId(userId);
        
        router.patch(`/admin/users/${userId}/role`, { role: newRole }, {
            preserveScroll: true,
            onFinish: () => setProcessingId(null),
        });
    };

    // Handler for official programmatic rider verification approval
    const handleApproveRider = (userId) => {
        setProcessingId(userId);
        router.patch(route('admin.users.approve-rider', userId), {}, {
            preserveScroll: true,
            onFinish: () => setProcessingId(null),
        });
    };

    // Handler for rejecting or resetting compliance document applications
    const handleRejectUser = (userId) => {
        setProcessingId(userId);
        router.patch(route('admin.users.reject', userId), {}, {
            preserveScroll: true,
            onFinish: () => setProcessingId(null),
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">🛡️ Command Center: Ecosystem Compliance Desk</h2>}
        >
            <Head title="Manage Users" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Operator</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email Address</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current System Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compliance Vetting Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Administrative Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition">
                                        
                                        {/* 1. NAME & REQUEST SPECIFICATION */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            <div className="font-semibold text-gray-900">{user.name}</div>
                                            {user.requested_role && (
                                                <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 animate-pulse">
                                                    Wants to be: {user.requested_role}
                                                </span>
                                            )}
                                        </td>
                                        
                                        {/* 2. EMAIL */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {user.email}
                                        </td>
                                        
                                        {/* 3. CURRENT ROLE BADGE */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-bold rounded-full uppercase tracking-wider
                                                ${user.role === 'admin' ? 'bg-red-100 text-red-800' : 
                                                  user.role === 'rider' ? 'bg-purple-100 text-purple-800' : 
                                                  user.role === 'fisherman' ? 'bg-green-100 text-green-800' : 
                                                  'bg-blue-100 text-blue-800'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        
                                        {/* 4. 📑 ROBUST VETTING INTERFACE INSIGHT PANEL */}
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {user.status === 'pending_review' ? (
                                                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-xs text-yellow-900 space-y-1">
                                                    <p className="font-bold flex items-center gap-1 text-yellow-800">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-ping"></span>
                                                        Vetting Verification Requested:
                                                    </p>
                                                    <p><strong>License ID:</strong> <span className="font-mono text-gray-700">{user.license_number || 'Not Provided'}</span></p>
                                                    <p><strong>Plate Reg:</strong> <span className="font-mono text-gray-700">{user.vehicle_plate || 'Not Provided'}</span></p>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-xs text-green-600 font-semibold bg-green-50 w-fit px-2 py-1 rounded border border-green-200">
                                                    ✓ Compliant ({user.status ?? 'active'})
                                                </div>
                                            )}
                                        </td>

                                        {/* 5. 📥 DYNAMIC APPROVAL ACTION TRIGGERS */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            {user.status === 'pending_review' ? (
                                                <div className="flex items-center gap-2">
                                                    <button 
                                                        disabled={processingId === user.id}
                                                        onClick={() => handleApproveRider(user.id)}
                                                        className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition shadow-sm disabled:opacity-50"
                                                    >
                                                        Accept Document
                                                    </button>
                                                    <button 
                                                        disabled={processingId === user.id}
                                                        onClick={() => handleRejectUser(user.id)}
                                                        className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold px-3 py-2 rounded-lg transition border border-red-200 disabled:opacity-50"
                                                    >
                                                        Decline
                                                    </button>
                                                </div>
                                            ) : (
                                                /* Fallback Manual Role Override Dropdown */
                                                <select
                                                    disabled={processingId === user.id || user.id === auth.user.id}
                                                    value={user.role}
                                                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                    className="block w-32 py-1.5 px-2 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs disabled:opacity-50"
                                                >
                                                    <option value="buyer">Buyer</option>
                                                    <option value="fisherman">Fisherman</option>
                                                    <option value="rider">Rider</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            )}
                                        </td>

                                    </tr>
                                ))}
                            </tbody>
                        </table>

                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}