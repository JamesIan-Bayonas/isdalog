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

    const renderStatus = (user) => user.status === 'pending_review' ? (
        <div className="isd-admin-warning p-3 rounded-lg border text-xs space-y-1">
            <p className="font-bold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full isd-fill-warning" aria-hidden="true" />
                Vetting verification requested
            </p>
            <p><strong>License ID:</strong> <span className="font-mono isd-text-secondary">{user.license_number || 'Not provided'}</span></p>
            <p><strong>Plate registration:</strong> <span className="font-mono isd-text-secondary">{user.vehicle_plate || 'Not provided'}</span></p>
        </div>
    ) : (
        <div className="isd-admin-success flex items-center gap-1 text-xs font-semibold w-fit px-2 py-1 rounded border">
            ✓ Compliant ({user.status ?? 'active'})
        </div>
    );

    const renderActions = (user) => user.status === 'pending_review' ? (
        <div className="flex flex-wrap items-center gap-2">
            <button
                type="button"
                disabled={processingId === user.id}
                onClick={() => handleApproveRider(user.id)}
                className="isd-ui-button isd-ui-button-primary text-xs disabled:opacity-50"
            >
                Accept document
            </button>
            <button
                type="button"
                disabled={processingId === user.id}
                onClick={() => handleRejectUser(user.id)}
                className="isd-ui-button isd-ui-button-danger text-xs disabled:opacity-50"
            >
                Decline
            </button>
        </div>
    ) : (
        <select
            aria-label={`Change role for ${user.name}`}
            disabled={processingId === user.id || user.id === auth.user.id}
            value={user.role}
            onChange={(e) => handleRoleChange(user.id, e.target.value)}
            className="isd-ui-input block w-36 py-1.5 px-2 text-xs disabled:opacity-50"
        >
            <option value="buyer">Buyer</option>
            <option value="fisherman">Fisherman</option>
            <option value="rider">Rider</option>
            <option value="admin">Admin</option>
        </select>
    );

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl isd-text-primary leading-tight">User management</h2>}
        >
            <Head title="Manage Users" />

            <div className="isd-admin-users py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="isd-surface border isd-border overflow-hidden shadow-sm rounded-xl p-4 sm:p-6">
                        {users.length === 0 && <p className="isd-empty">No user accounts are available to review.</p>}
                        
                        <div className="grid gap-3 md:hidden">
                            {users.map((user) => (
                                <article key={user.id} className="isd-admin-mobile-card rounded-xl border p-4">
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <h3 className="font-semibold break-words">{user.name}</h3>
                                            <p className="text-sm break-all">{user.email}</p>
                                        </div>
                                        <span className="isd-app-role-badge px-2 inline-flex text-xs leading-5 font-bold rounded-full uppercase tracking-wider border">
                                            {user.role}
                                        </span>
                                    </div>
                                    {user.requested_role && (
                                        <p className="isd-admin-warning mt-3 rounded-lg border px-2 py-1 text-xs font-semibold">
                                            Requested role: {user.requested_role}
                                        </p>
                                    )}
                                    <div className="mt-4 space-y-1">
                                        <p className="text-xs font-semibold uppercase tracking-wide">Verification status</p>
                                        {renderStatus(user)}
                                    </div>
                                    <div className="mt-4 space-y-1">
                                        <p className="text-xs font-semibold uppercase tracking-wide">Actions</p>
                                        {renderActions(user)}
                                    </div>
                                </article>
                            ))}
                        </div>

                        <div className="isd-scroll-region hidden overflow-x-auto md:block" tabIndex={0} role="region" aria-label="User accounts and administrative actions">
                        <table className="min-w-[860px] w-full isd-divide isd-divide">
                            <thead className="isd-subtle">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium isd-text-muted uppercase tracking-wider">Account Operator</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium isd-text-muted uppercase tracking-wider">Email Address</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium isd-text-muted uppercase tracking-wider">Current System Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium isd-text-muted uppercase tracking-wider">Compliance Vetting Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium isd-text-muted uppercase tracking-wider">Administrative Actions</th>
                                </tr>
                            </thead>
                            <tbody className="isd-surface isd-divide isd-divide">
                                {users.map((user) => (
                                    <tr key={user.id} className="isd-hover-subtle transition">
                                        
                                        {/* 1. NAME & REQUEST SPECIFICATION */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium isd-text-primary">
                                            <div className="font-semibold isd-text-primary">{user.name}</div>
                                            {user.requested_role && (
                                                <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium isd-soft-warning isd-text-warning animate-pulse">
                                                    Wants to be: {user.requested_role}
                                                </span>
                                            )}
                                        </td>
                                        
                                        {/* 2. EMAIL */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm isd-text-muted">
                                            {user.email}
                                        </td>
                                        
                                        {/* 3. CURRENT ROLE BADGE */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="isd-app-role-badge px-2 inline-flex text-xs leading-5 font-bold rounded-full uppercase tracking-wider border">
                                                {user.role}
                                            </span>
                                        </td>
                                        
                                        {/* 4. 📑 ROBUST VETTING INTERFACE INSIGHT PANEL */}
                                        <td className="px-6 py-4 text-sm isd-text-muted">
                                            {renderStatus(user)}
                                        </td>

                                        {/* 5. 📥 DYNAMIC APPROVAL ACTION TRIGGERS */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            {renderActions(user)}
                                        </td>

                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>

                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
