// File: resources/js/Pages/Profile/Partials/UpdateProfileInformationForm.jsx
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const user = usePage().props.auth.user;
    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
        });

    const submit = (e) => {
        e.preventDefault();
        patch(route('profile.update'));
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-base font-black text-white tracking-tight">
                    Profile Information
                </h2>
                <p className="mt-1 text-xs font-mono text-slate-400">
                    Update your account's call-sign designation and official contact email address.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-5">
                <div>
                    <InputLabel htmlFor="name" value="Operator Name" className="!text-xs !font-bold !uppercase !tracking-wider !text-slate-300" />
                    <TextInput
                        id="name"
                        className="mt-1.5 block w-full !bg-slate-950/80 !border-slate-800 !text-white font-mono text-sm shadow-inner"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        isFocused
                        autoComplete="name"
                    />
                    <InputError className="mt-2 text-xs" message={errors.name} />
                </div>

                <div>
                    <InputLabel htmlFor="email" value="Operator Email" className="!text-xs !font-bold !uppercase !tracking-wider !text-slate-300" />
                    <TextInput
                        id="email"
                        type="email"
                        className="mt-1.5 block w-full !bg-slate-950/80 !border-slate-800 !text-white font-mono text-sm shadow-inner"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />
                    <InputError className="mt-2 text-xs" message={errors.email} />
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="mt-2 text-xs font-mono text-amber-400">
                            Your email address is unverified.{' '}
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="underline hover:text-amber-300 font-bold"
                            >
                                Click here to re-send the verification email.
                            </Link>
                        </p>
                        {status === 'verification-link-sent' && (
                            <div className="mt-2 text-xs font-mono font-medium text-emerald-400">
                                A new verification link has been sent to your email address.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4 pt-2">
                    <button
                        type="submit"
                        disabled={processing}
                        className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs font-mono uppercase tracking-wider rounded-xl shadow-lg shadow-cyan-600/20 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                    >
                        {processing ? 'Saving...' : 'Save Profile Changes'}
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