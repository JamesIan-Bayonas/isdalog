import InputError from '@/Components/InputError';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import { Head, Link, useForm } from '@inertiajs/react';
import { EnvelopeIcon, ArrowRightIcon, ShieldCheckIcon, SparklesIcon } from '@heroicons/react/24/outline';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <>
            <Head title="Reset Key Clearance — IsdaLog Maritime Hub" />

            <div className="min-h-screen flex items-center justify-center bg-[#020617] text-slate-100 p-6 relative overflow-hidden selection:bg-cyan-500 selection:text-white">
                {/* Background Ambient Glows */}
                <div className="absolute top-[-10%] left-[-10%] w-[38rem] h-[38rem] bg-gradient-to-br from-cyan-600/10 via-blue-700/[0.05] to-transparent rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[38rem] h-[38rem] bg-gradient-to-tr from-emerald-600/[0.06] via-cyan-900/10 to-transparent rounded-full blur-3xl pointer-events-none" />

                <div className="w-full max-w-md p-8 rounded-3xl bg-slate-950/70 border border-slate-800/80 backdrop-blur-2xl shadow-2xl space-y-6 relative z-10">
                    
                    {/* Header */}
                    <div className="space-y-2">
                        <Link href="/" className="inline-flex items-center gap-2 mb-2">
                            <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-tr from-cyan-400 to-blue-400">⚓ IsdaLog</span>
                            <span className="text-[10px] font-mono uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-500/30">
                                Terminal Security
                            </span>
                        </Link>
                        <h1 className="text-2xl font-black text-white tracking-tight">Forgot Security Key?</h1>
                        <p className="text-xs text-slate-400 leading-relaxed font-mono">
                            Enter your registered operator email to transmit an encrypted password recovery authorization link.
                        </p>
                    </div>

                    {/* Status Feedback */}
                    {status && (
                        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                            <ShieldCheckIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>{status}</span>
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <InputLabel htmlFor="email" value="Operator Account Email" className="!text-slate-300 !text-xs !font-mono !font-bold !uppercase !tracking-wider" />
                            <div className="mt-1.5 relative rounded-xl group shadow-inner">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                                    <EnvelopeIcon className="h-5 w-5" />
                                </div>
                                <TextInput
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    className="!bg-slate-900/90 !border-slate-800 !text-white !pl-11 !py-3.5 !rounded-xl focus:!border-cyan-500 focus:!ring-2 focus:!ring-cyan-500/30 block w-full text-sm placeholder:text-slate-600 transition-all"
                                    isFocused={true}
                                    placeholder="operator@isdalog.ph"
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                />
                            </div>
                            <InputError message={errors.email} className="mt-2 text-xs" />
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-cyan-600/25 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                        >
                            {processing ? 'Transmitting Key Request...' : 'Transmit Recovery Link'}
                            <ArrowRightIcon className="w-4 h-4" />
                        </button>
                    </form>

                    <div className="text-center pt-2">
                        <Link href={route('login')} className="text-xs font-mono text-cyan-400 hover:text-cyan-300 font-bold transition-colors">
                            ← Return to terminal login
                        </Link>
                    </div>

                </div>
            </div>
        </>
    );
}