import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function UpgradeRoleForm({ className = '' }) {
    const user = usePage().props.auth.user;
    
    // Prevent UI render if user is already an admin
    if (user.role === 'admin') return null;

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        requested_role: 'fisherman',
        bfar_registration_number: user.bfar_registration_number || '',
        vehicle_details: user.vehicle_details || '',
    });

    const submit = (e) => {
        e.preventDefault();
        patch(route('profile.upgrade'));
    };

    const isPending = user.status === 'pending_review';

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">
                    Ecosystem Compliance & Vetting
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                    Request an upgrade to Harvester or Courier status. All submitted credentials will be securely audited by BFAR administration.
                </p>
            </header>

            {isPending && (
                <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-semibold">
                    ⏳ Your compliance application for <strong>{user.requested_role}</strong> is currently pending administrative review.
                </div>
            )}

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <InputLabel htmlFor="requested_role" value="Requested Operating Role" />
                    <select
                        id="requested_role"
                        disabled={isPending}
                        value={data.requested_role}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm disabled:opacity-50"
                        onChange={(e) => setData('requested_role', e.target.value)}
                        required
                    >
                        <option value="fisherman">Local Fisherman (Requires BFAR Registration)</option>
                        <option value="rider">Logistics Courier (Requires Valid Vehicle/Plate No.)</option>
                    </select>
                    <InputError className="mt-2" message={errors.requested_role} />
                </div>

                {data.requested_role === 'fisherman' && (
                    <div>
                        <InputLabel htmlFor="bfar_registration_number" value="BFAR FishR Registration Number" />
                        <TextInput
                            id="bfar_registration_number"
                            disabled={isPending}
                            className="mt-1 block w-full disabled:opacity-50"
                            value={data.bfar_registration_number}
                            onChange={(e) => setData('bfar_registration_number', e.target.value)}
                            placeholder="e.g. PH-12345678-000"
                            required
                        />
                        <InputError className="mt-2" message={errors.bfar_registration_number} />
                    </div>
                )}

                {data.requested_role === 'rider' && (
                    <div>
                        <InputLabel htmlFor="vehicle_details" value="Vehicle Details & Plate Number" />
                        <TextInput
                            id="vehicle_details"
                            disabled={isPending}
                            className="mt-1 block w-full disabled:opacity-50"
                            value={data.vehicle_details}
                            onChange={(e) => setData('vehicle_details', e.target.value)}
                            placeholder="e.g. Honda Click 125i (ABC 1234)"
                            required
                        />
                        <InputError className="mt-2" message={errors.vehicle_details} />
                    </div>
                )}

                {!isPending && (
                    <div className="flex items-center gap-4">
                        <PrimaryButton disabled={processing}>Submit Compliance Documents</PrimaryButton>

                        <Transition
                            show={recentlySuccessful}
                            enter="transition ease-in-out"
                            enterFrom="opacity-0"
                            leave="transition ease-in-out"
                            leaveTo="opacity-0"
                        >
                            <p className="text-sm text-gray-600 font-semibold">Application Transmitted.</p>
                        </Transition>
                    </div>
                )}
            </form>
        </section>
    );
}