// File: resources/js/Pages/Profile/Partials/UpdatePasswordForm.jsx
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { useRef } from 'react';

export default function UpdatePasswordForm({ className = '' }) {
    const passwordInput = useRef();
    const currentPasswordInput = useRef();
    const {
        data,
        setData,
        errors,
        put,
        reset,
        processing,
        recentlySuccessful,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword = (e) => {
        e.preventDefault();
        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current.focus();
                }
                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current.focus();
                }
            },
        });
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-base font-black text-white tracking-tight">
                    Update Security Key
                </h2>
                <p className="mt-1 text-xs font-mono text-slate-400">
                    Ensure your account is protected using a long, cryptographic security key.
                </p>
            </header>

            <form onSubmit={updatePassword} className="mt-6 space-y-5">
                <div>
                    <InputLabel
                        htmlFor="current_password"
                        value="Current Security Key"
                        className="!text-xs !font-bold !uppercase !tracking-wider !text-slate-300"
                    />
                    <TextInput
                        id="current_password"
                        ref={currentPasswordInput}
                        value={data.current_password}
                        onChange={(e) =>
                            setData('current_password', e.target.value)
                        }
                        type="password"
                        className="mt-1.5 block w-full !bg-slate-950/80 !border-slate-800 !text-white font-mono text-sm shadow-inner"
                        autoComplete="current-password"
                    />
                    <InputError
                        message={errors.current_password}
                        className="mt-2 text-xs"
                    />
                </div>

                <div>
                    <InputLabel 
                        htmlFor="password" 
                        value="New Security Key" 
                        className="!text-xs !font-bold !uppercase !tracking-wider !text-slate-300" 
                    />
                    <TextInput
                        id="password"
                        ref={passwordInput}
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        type="password"
                        className="mt-1.5 block w-full !bg-slate-950/80 !border-slate-800 !text-white font-mono text-sm shadow-inner"
                        autoComplete="new-password"
                    />
                    <InputError message={errors.password} className="mt-2 text-xs" />
                </div>

                <div>
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Confirm Security Key"
                        className="!text-xs !font-bold !uppercase !tracking-wider !text-slate-300"
                    />
                    <TextInput
                        id="password_confirmation"
                        value={data.password_confirmation}
                        onChange={(e) =>
                            setData('password_confirmation', e.target.value)
                        }
                        type="password"
                        className="mt-1.5 block w-full !bg-slate-950/80 !border-slate-800 !text-white font-mono text-sm shadow-inner"
                        autoComplete="new-password"
                    />
                    <InputError
                        message={errors.password_confirmation}
                        className="mt-2 text-xs"
                    />
                </div>

                <div className="flex items-center gap-4 pt-2">
                    <button
                        type="submit"
                        disabled={processing}
                        className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs font-mono uppercase tracking-wider rounded-xl shadow-lg shadow-cyan-600/20 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                    >
                        {processing ? 'Authorizing Key Update...' : 'Save New Security Key'}
                    </button>
                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-xs text-emerald-400 font-mono font-semibold">
                            Saved.
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}