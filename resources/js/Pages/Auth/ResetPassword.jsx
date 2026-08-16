import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';
import { LockClosedIcon, EnvelopeIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <>
            <Head title="Set New Key — IsdaLog Maritime Hub" />

            <div className="min-h-screen flex items-center justify-center bg-[#020617] text-slate-100 p-6 relative overflow-hidden selection:bg-cyan-500 selection:text-white">
                {/* Background Ambient Glows */}
                <div className="absolute top-[-10%] left-[-10%] w-[38rem] h-[38rem] bg-gradient-to-br from-cyan-600/10 via-blue-700/[0.05] to-transparent rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[38rem] h-[38rem] bg-gradient-to-tr from-emerald-600/[0.06] via-cyan-900/10 to-transparent rounded-full blur-3xl pointer-events-none" />

                <div className="w-full max-w-md p-8 rounded-3xl bg-slate-950/70 border border-slate-800/80 backdrop-blur-2xl shadow-2xl space-y-6 relative z-10">
                    
                    <div>
                        <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-tr from-cyan-400 to-blue-400">⚓ IsdaLog</span>
                        <h1 className="text-2xl font-black text-white tracking-tight mt-2">Set New Security Key</h1>
                        <p className="text-xs text-slate-400 font-mono mt-1">
                            Establish a new cryptographic password for your terminal account.
                        </p>
                    </div>

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <InputLabel htmlFor="email" value="Account Email" className="!text-slate-300 !text-xs !font-mono !font-bold !uppercase !tracking-wider" />
                            <div className="mt-1.5 relative rounded-xl group shadow-inner">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                    <EnvelopeIcon className="h-5 w-5" />
                                </div>
                                <TextInput
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    className="!bg-slate-900/90 !border-slate-800 !text-white !pl-11 !py-3.5 !rounded-xl block w-full text-sm"
                                    autoComplete="username"
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                />
                            </div>
                            <InputError message={errors.email} className="mt-2 text-xs" />
                        </div>

                        <div>
                            <InputLabel htmlFor="password" value="New Security Key" className="!text-slate-300 !text-xs !font-mono !font-bold !uppercase !tracking-wider" />
                            <div className="mt-1.5 relative rounded-xl group shadow-inner">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                                    <LockClosedIcon className="h-5 w-5" />
                                </div>
                                <TextInput
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={data.password}
                                    className="!bg-slate-900/90 !border-slate-800 !text-white !pl-11 !py-3.5 !rounded-xl focus:!border-cyan-500 focus:!ring-2 focus:!ring-cyan-500/30 block w-full text-sm placeholder:text-slate-600 transition-all"
                                    autoComplete="new-password"
                                    isFocused={true}
                                    placeholder="••••••••••••"
                                    onChange={(e) => setData('password', e.target.value)}
                                    required
                                />
                            </div>
                            <InputError message={errors.password} className="mt-2 text-xs" />
                        </div>

                        <div>
                            <InputLabel htmlFor="password_confirmation" value="Confirm Security Key" className="!text-slate-300 !text-xs !font-mono !font-bold !uppercase !tracking-wider" />
                            <div className="mt-1.5 relative rounded-xl group shadow-inner">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                                    <LockClosedIcon className="h-5 w-5" />
                                </div>
                                <TextInput
                                    type="password"
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    value={data.password_confirmation}
                                    className="!bg-slate-900/90 !border-slate-800 !text-white !pl-11 !py-3.5 !rounded-xl focus:!border-cyan-500 focus:!ring-2 focus:!ring-cyan-500/30 block w-full text-sm placeholder:text-slate-600 transition-all"
                                    autoComplete="new-password"
                                    placeholder="••••••••••••"
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    required
                                />
                            </div>
                            <InputError message={errors.password_confirmation} className="mt-2 text-xs" />
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-cyan-600/25 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                        >
                            {processing ? 'Authorizing Password Override...' : 'Confirm Key Reset'}
                            <ArrowRightIcon className="w-4 h-4" />
                        </button>
                    </form>

                </div>
            </div>
        </>
    );
}