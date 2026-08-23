// File: resources/js/Pages/Profile/Partials/UpgradeRoleForm.jsx
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { useForm, usePage } from '@inertiajs/react';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function UpgradeRoleForm({ className = '' }) {
    const user = usePage().props.auth.user;

    if (user.role === 'admin') return null;

    if (user.role === 'fisherman' || user.role === 'rider') {
        return (
            <section className={className}>
                <header>
                    <div className="flex items-center gap-2">
                        <ShieldCheckIcon className="w-5 h-5 text-emerald-400" />
                        <h2 className="text-base font-black text-white tracking-tight">
                            Active Operating Clearance
                        </h2>
                    </div>
                    <p className="mt-1 text-xs font-mono text-slate-400">
                        Your account is provisioned as an active <strong className="capitalize text-cyan-400">{user.role}</strong> operator node.
                    </p>
                </header>
                <div className="mt-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono space-y-1.5 text-slate-300">
                    <p><strong className="text-slate-400 uppercase tracking-wider">Designated Role:</strong> <span className="text-white font-bold">{user.role.toUpperCase()}</span></p>
                    <p><strong className="text-slate-400 uppercase tracking-wider">Verification Status:</strong> <span className="text-emerald-400 font-black">{user.status.toUpperCase()}</span></p>
                </div>
            </section>
        );
    }

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
                <h2 className="text-base font-black text-white tracking-tight">
                    Ecosystem Compliance & Vetting
                </h2>
                <p className="mt-1 text-xs font-mono text-slate-400">
                    Request an upgrade to Harvester or Courier status. All submitted credentials will be securely audited by BFAR administration.
                </p>
            </header>

            {isPending && (
                <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-semibold">
                    ⏳ Your compliance application for <strong>{user.requested_role}</strong> is currently pending administrative review.
                </div>
            )}

            <form onSubmit={submit} className="mt-6 space-y-5">
                <div>
                    <InputLabel htmlFor="requested_role" value="Requested Operating Role" className="!text-xs !font-bold !uppercase !tracking-wider !text-slate-300" />
                    <select
                        id="requested_role"
                        disabled={isPending}
                        value={data.requested_role}
                        className="mt-1 block w-full rounded-xl border-slate-800 bg-slate-950/80 text-white font-mono text-xs shadow-inner focus:border-cyan-500 focus:ring-cyan-500 disabled:opacity-50"
                        onChange={(e) => setData('requested_role', e.target.value)}
                        required
                    >
                        <option value="fisherman">Local Fisherman (Requires BFAR Registration)</option>
                        <option value="rider">Logistics Courier (Requires Valid Vehicle/Plate No.)</option>
                    </select>
                    <InputError className="mt-2 text-xs" message={errors.requested_role} />
                </div>

                {data.requested_role === 'fisherman' && (
                    <div>
                        <InputLabel htmlFor="bfar_registration_number" value="BFAR FishR Registration Number" className="!text-xs !font-bold !uppercase !tracking-wider !text-slate-300" />
                        <TextInput
                            id="bfar_registration_number"
                            disabled={isPending}
                            className="mt-1 block w-full !bg-slate-950/80 !border-slate-800 !text-white font-mono text-xs disabled:opacity-50"
                            value={data.bfar_registration_number}
                            onChange={(e) => setData('bfar_registration_number', e.target.value)}
                            placeholder="e.g. PH-12345678-000"
                            required
                        />
                        <InputError className="mt-2 text-xs" message={errors.bfar_registration_number} />
                    </div>
                )}

                {data.requested_role === 'rider' && (
                    <div>
                        <InputLabel htmlFor="vehicle_details" value="Vehicle Details & Plate Number" className="!text-xs !font-bold !uppercase !tracking-wider !text-slate-300" />
                        <TextInput
                            id="vehicle_details"
                            disabled={isPending}
                            className="mt-1 block w-full !bg-slate-950/80 !border-slate-800 !text-white font-mono text-xs disabled:opacity-50"
                            value={data.vehicle_details}
                            onChange={(e) => setData('vehicle_details', e.target.value)}
                            placeholder="e.g. Honda Click 125i (ABC 1234)"
                            required
                        />
                        <InputError className="mt-2 text-xs" message={errors.vehicle_details} />
                    </div>
                )}

                {!isPending && (
                    <div className="flex items-center gap-4 pt-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs font-mono uppercase tracking-wider rounded-xl shadow-lg shadow-cyan-600/20 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                        >
                            {processing ? 'Transmitting...' : 'Submit Compliance Documents'}
                        </button>
                        <Transition
                            show={recentlySuccessful}
                            enter="transition ease-in-out"
                            enterFrom="opacity-0"
                            leave="transition ease-in-out"
                            leaveTo="opacity-0"
                        >
                            <p className="text-xs text-emerald-400 font-mono font-semibold">Application Transmitted.</p>
                        </Transition>
                    </div>
                )}
            </form>
        </section>
    );
}