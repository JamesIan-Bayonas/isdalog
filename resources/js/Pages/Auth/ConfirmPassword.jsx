import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';
import { LockClosedIcon, ShieldExclamationIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Security Key Confirmation — IsdaLog Maritime Hub" />

            <div className="min-h-screen flex items-center justify-center bg-[#020617] text-slate-100 p-6 relative overflow-hidden selection:bg-cyan-500 selection:text-white">
                {/* Background Ambient Glows */}
                <div className="absolute top-[-10%] left-[-10%] w-[38rem] h-[38rem] bg-gradient-to-br from-cyan-600/10 via-blue-700/[0.05] to-transparent rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[38rem] h-[38rem] bg-gradient-to-tr from-amber-600/[0.06] via-slate-950/10 to-transparent rounded-full blur-3xl pointer-events-none" />

                <div className="w-full max-w-md p-8 rounded-3xl bg-slate-950/70 border border-slate-800/80 backdrop-blur-2xl shadow-2xl space-y-6 relative z-10">
                    
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                            <ShieldExclamationIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-white tracking-tight">Security Checkpoint</h1>
                            <p className="text-xs text-slate-400 font-mono">Protected Escrow / Admin Operation</p>
                        </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed font-mono">
                        This is a restricted operational sector. Please re-authenticate your operator key signature to proceed.
                    </p>

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <InputLabel htmlFor="password" value="Security Key" className="!text-slate-300 !text-xs !font-mono !font-bold !uppercase !tracking-wider" />
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
                                    isFocused={true}
                                    placeholder="••••••••••••"
                                    onChange={(e) => setData('password', e.target.value)}
                                    required
                                />
                            </div>
                            <InputError message={errors.password} className="mt-2 text-xs" />
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-cyan-600/25 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                        >
                            {processing ? 'Authenticating Operator Signature...' : 'Authorize Action'}
                            <ArrowRightIcon className="w-4 h-4" />
                        </button>
                    </form>

                </div>
            </div>
        </>
    );
}