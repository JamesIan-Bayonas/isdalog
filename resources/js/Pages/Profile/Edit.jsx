// File: isdalog/resources/js/Pages/Profile/Edit.jsx
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import ConnectTelegramForm from './Partials/ConnectTelegramForm';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import UpgradeRoleForm from './Partials/UpgradeRoleForm';

export default function Edit({ mustVerifyEmail, status, botUsername, accountReviews }) {
    const user = usePage().props.auth.user;
    const flashStatus = usePage().props.flash?.success;
    const telegramSection = useRef(null);

    useEffect(() => {
        if (window.location.hash === '#telegram-connection' && telegramSection.current) {
            telegramSection.current.focus();
            telegramSection.current.scrollIntoView({ block: 'start' });
        }
    }, []);

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className="font-black text-xl text-white tracking-tight">
                        Profile and account
                    </h2>
                    <p className="text-xs font-mono text-slate-400">
                        Manage your details, security, role, and Telegram connection
                    </p>
                </div>
            }
        >
            <Head title="Profile and account — IsdaLog" />

            <div className="isd-profile-page py-8">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    {flashStatus && (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-xl shadow-lg font-mono text-xs font-semibold">
                            ✓ {flashStatus}
                        </div>
                    )}

                    <section className="isd-surface border isd-border rounded-xl p-5 space-y-3 isd-text-primary">
                        <h2 className="text-lg font-bold">Account access and review</h2>
                        <p>Role: {user.role} · Status: {user.status || 'unverified'}</p>
                        <p>{user.status === 'verified' ? 'Account access is enabled. Legacy or demonstration approvals may have no recorded review evidence.' : user.status === 'pending_review' ? 'Your role application is awaiting an IsdaLog administrator. Your current role remains in place.' : 'No current access approval is recorded. Complete your contact and role details below, then submit for review.'}</p>
                        <p>Access approval is not proof of identity, government licensing, catch safety or freshness. Submitted registration and vehicle details are self-reported.</p><p>Riders need approval to claim jobs. Other marketplace permissions follow your role; an unverified status is not an account suspension.</p>
                        <p>Buyer: name and email; save a contact number for support and role review. Fisherman review: contact number and registration reference. Rider review: contact number, vehicle and plate details. Telegram is optional.</p>
                        <Link className="underline" href={route('support.index')}>Ask for account help or report a concern</Link>
                        <p>Active orders must be completed or resolved before access changes. Account closure with transaction or support records requires administrator assistance.</p>
                        {accountReviews.map((r,i)=><div key={i} className="border-t isd-border pt-3"><p>{new Date(r.created_at).toLocaleString()} · {r.resulting_role} · {r.resulting_status}</p><p className="whitespace-pre-wrap">{r.reason}</p><p>To correct a declined application, update the details and resubmit below, or contact support.</p></div>)}
                    </section>
                    {/* Telegram AI Bot Integration Card (Exclusively Gated to Fishermen) */}
                    {user?.role === 'fisherman' && (
                        <div ref={telegramSection} id="telegram-connection" tabIndex={-1} className="isd-fisherman-anchor bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl p-4 shadow-lg sm:rounded-2xl sm:p-8">
                            <ConnectTelegramForm className="max-w-xl" />
                        </div>
                    )}

                    {/* Operating Clearance & Role Upgrade Card */}
                    {user?.role !== 'admin' && (
                        <div className="bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl p-4 shadow-lg sm:rounded-2xl sm:p-8">
                            <UpgradeRoleForm className="max-w-xl" />
                        </div>
                    )}

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
