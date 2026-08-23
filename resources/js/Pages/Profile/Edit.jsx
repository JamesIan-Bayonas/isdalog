// File: resources/js/Pages/Profile/Edit.jsx
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import ConnectTelegramForm from './Partials/ConnectTelegramForm';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import UpgradeRoleForm from './Partials/UpgradeRoleForm';

export default function Edit({ mustVerifyEmail, status, botUsername }) {
    const user = usePage().props.auth.user;
    const flashStatus = usePage().props.flash?.success;

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className="font-black text-xl text-white tracking-tight">
                        Profile Configuration
                    </h2>
                    <p className="text-xs font-mono text-slate-400">
                        Manage security credentials, operating role clearance, and Telegram AI hooks
                    </p>
                </div>
            }
        >
            <Head title="Profile Configuration — IsdaLog" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    {flashStatus && (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-xl shadow-lg font-mono text-xs font-semibold">
                            ✓ {flashStatus}
                        </div>
                    )}

                    {/* Telegram AI Bot Integration Card (Exclusively Gated to Fishermen) */}
                    {user?.role === 'fisherman' && (
                        <div className="bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl p-4 shadow-lg sm:rounded-2xl sm:p-8">
                            <ConnectTelegramForm className="max-w-xl" />
                        </div>
                    )}

                    {/* Operating Clearance & Role Upgrade Card */}
                    <div className="bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl p-4 shadow-lg sm:rounded-2xl sm:p-8">
                        <UpgradeRoleForm className="max-w-xl" />
                    </div>

                    {/* Profile Credentials Card */}
                    <div className="bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl p-4 shadow-lg sm:rounded-2xl sm:p-8">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-xl"
                        />
                    </div>

                    {/* Security Key / Password Card */}
                    <div className="bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl p-4 shadow-lg sm:rounded-2xl sm:p-8">
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>

                    {/* Danger Zone Card */}
                    <div className="bg-slate-900/70 border border-rose-900/40 backdrop-blur-xl p-4 shadow-lg sm:rounded-2xl sm:p-8">
                        <DeleteUserForm className="max-w-xl" />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}