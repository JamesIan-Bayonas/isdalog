import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import ConnectTelegramForm from './Partials/ConnectTelegramForm';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import UpgradeRoleForm from './Partials/UpgradeRoleForm';

export default function Edit({ mustVerifyEmail, status, botUsername }) {
    const flashStatus = usePage().props.flash?.success;

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Profile Configuration
                </h2>
            }
        >
            <Head title="Profile" />
            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    {flashStatus && (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-lg shadow-sm font-semibold text-sm">
                            ✓ {flashStatus}
                        </div>
                    )}

                    {/* Telegram AI Bot Integration Card */}
                    <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                        <ConnectTelegramForm className="max-w-xl" />
                    </div>

                    <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                        <UpgradeRoleForm className="max-w-xl" />
                    </div>

                    <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-xl"
                        />
                    </div>

                    <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>

                    <div className="bg-white p-4 shadow sm:rounded-lg sm:p-8">
                        <DeleteUserForm className="max-w-xl" />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}