// File: resources/js/Pages/Profile/Partials/DeleteUserForm.jsx
import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';

export default function DeleteUserForm({ className = '' }) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef();
    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser = (e) => {
        e.preventDefault();
        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);
        clearErrors();
        reset();
    };

    return (
        <section className={`space-y-6 ${className}`}>
            <header>
                <h2 className="text-base font-black text-rose-400 tracking-tight">
                    Terminate Operator Account
                </h2>
                <p className="mt-1 text-xs font-mono text-slate-400 leading-relaxed">
                    Once your terminal identity is purged, all associated telemetry, biometric models, and ledger records will be permanently deleted.
                </p>
            </header>

            <DangerButton onClick={confirmUserDeletion} className="!bg-rose-600 hover:!bg-rose-500 !text-xs !font-mono !font-bold !rounded-xl !py-2.5 !px-4">
                Delete Account
            </DangerButton>

            <Modal show={confirmingUserDeletion} onClose={closeModal} maxWidth="md">
                <form onSubmit={deleteUser} className="p-6 space-y-5 bg-slate-950 border border-slate-800 rounded-2xl text-slate-100">
                    <h2 className="text-base font-black text-white tracking-tight">
                        Confirm Identity Termination
                    </h2>
                    <p className="text-xs font-mono text-slate-400 leading-relaxed">
                        Please enter your account password to confirm permanent decommission of this operator profile.
                    </p>

                    <div className="mt-4">
                        <InputLabel
                            htmlFor="password"
                            value="Security Key"
                            className="sr-only"
                        />
                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) =>
                                setData('password', e.target.value)
                            }
                            className="block w-full !bg-slate-900/90 !border-slate-800 !text-white font-mono text-sm"
                            isFocused
                            placeholder="••••••••••••"
                        />
                        <InputError
                            message={errors.password}
                            className="mt-2 text-xs"
                        />
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton 
                            onClick={closeModal}
                            className="!bg-slate-900 !border-slate-800 !text-slate-300 hover:!bg-slate-800 !rounded-xl !text-xs"
                        >
                            Cancel
                        </SecondaryButton>
                        <DangerButton 
                            disabled={processing}
                            className="!bg-rose-600 hover:!bg-rose-500 !rounded-xl !text-xs !font-mono !font-bold"
                        >
                            {processing ? 'Terminating...' : 'Confirm Termination'}
                        </DangerButton>
                    </div>
                </form>
            </Modal>
        </section>
    );
}