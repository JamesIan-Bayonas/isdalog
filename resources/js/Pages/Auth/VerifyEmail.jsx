import { Head, Link, useForm } from '@inertiajs/react';
import { EnvelopeOpenIcon, ArrowPathIcon, ArrowRightOnRectangleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();
        post(route('verification.send'));
    };

    return (
        <>
            <Head title="Verify Identity — IsdaLog Maritime Hub" />

            <div className="min-h-screen flex items-center justify-center bg-[#020617] text-slate-100 p-6 relative overflow-hidden selection:bg-cyan-500 selection:text-white">
                {/* Background Ambient Glows */}
                <div className="absolute top-[-10%] left-[-10%] w-[38rem] h-[38rem] bg-gradient-to-br from-cyan-600/10 via-blue-700/[0.05] to-transparent rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[38rem] h-[38rem] bg-gradient-to-tr from-emerald-600/[0.06] via-cyan-900/10 to-transparent rounded-full blur-3xl pointer-events-none" />

                <div className="w-full max-w-md p-8 rounded-3xl bg-slate-950/70 border border-slate-800/80 backdrop-blur-2xl shadow-2xl space-y-6 relative z-10 text-center">
                    
                    <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/20">
                        <EnvelopeOpenIcon className="w-7 h-7" />
                    </div>

                    <div className="space-y-1">
                        <h1 className="text-2xl font-black text-white tracking-tight">Verify Operator Identity</h1>
                        <p className="text-xs text-slate-400 font-mono leading-relaxed pt-1">
                            An activation clearance token was dispatched to your email. Click the verification link to unlock the live auction and consignment floors.
                        </p>
                    </div>

                    {status === 'verification-link-sent' && (
                        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2">
                            <ShieldCheckIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>A fresh token has been dispatched to your email address.</span>
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-4 pt-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-cyan-600/25 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                        >
                            <ArrowPathIcon className={`w-4 h-4 ${processing ? 'animate-spin' : ''}`} />
                            {processing ? 'Transmitting Fresh Token...' : 'Resend Verification Email'}
                        </button>

                        <div className="pt-2">
                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors"
                            >
                                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                                <span>Sign out of terminal session</span>
                            </Link>
                        </div>
                    </form>

                </div>
            </div>
        </>
    );
}