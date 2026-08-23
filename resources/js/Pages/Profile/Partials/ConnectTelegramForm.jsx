// File: resources/js/Pages/Profile/Partials/ConnectTelegramForm.jsx
import DangerButton from '@/Components/DangerButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import axios from 'axios';
import { PaperAirplaneIcon, CheckBadgeIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

// File: resources/js/Pages/Profile/Partials/ConnectTelegramForm.jsx
export default function ConnectTelegramForm({ className = '' }) {
    const user = usePage().props.auth.user;

    // Defense-in-depth: Telegram catch classification is strictly for fisherman nodes
    if (user?.role !== 'fisherman') {
        return null;
    }

    const [loading, setLoading] = useState(false);
    const [deepLink, setDeepLink] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const { delete: destroy, processing: unlinking } = useForm();

    const generateLink = async () => {
        setLoading(true);
        setErrorMsg(null);
        try {
            const response = await axios.post(route('profile.telegram.token'));
            if (response.data.status === 'success') {
                setDeepLink(response.data.deep_link);
            }
        } catch (error) {
            setErrorMsg('Failed to generate connection token. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleUnlink = (e) => {
        e.preventDefault();
        destroy(route('profile.telegram.unlink'));
    };

    return (
        <section className={`space-y-6 ${className}`}>
            <header>
                <div className="flex items-center gap-2">
                    <PaperAirplaneIcon className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-base font-black text-white tracking-tight">
                        Telegram AI Telemetry Link
                    </h2>
                </div>
                <p className="mt-1 text-xs font-mono text-slate-400">
                    Connect your personal Telegram account to enable Edge-AI fish classification and automatic catch logging.
                </p>
            </header>

            {user.telegram_chat_id ? (
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <CheckBadgeIcon className="w-8 h-8 text-emerald-400 shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-emerald-300 font-mono">Telegram Account Connected</p>
                            <p className="text-xs font-mono text-emerald-400/80">Chat ID: {user.telegram_chat_id}</p>
                        </div>
                    </div>
                    <form onSubmit={handleUnlink}>
                        <DangerButton disabled={unlinking} className="!text-xs !bg-rose-600 hover:!bg-rose-500">
                            {unlinking ? 'Disconnecting...' : 'Disconnect Telegram'}
                        </DangerButton>
                    </form>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-slate-300">
                        <p className="font-bold text-white text-xs uppercase font-mono tracking-wider">Why link Telegram?</p>
                        <ul className="list-disc list-inside mt-2 text-xs font-mono text-slate-400 space-y-1">
                            <li>Instant camera photo catch logging via your Telegram bot</li>
                            <li>Real-time push notifications for winning bids and consignment settlements</li>
                            <li>Automatic mapping of sea catches to your registered account</li>
                        </ul>
                    </div>

                    {errorMsg && (
                        <p className="text-xs font-mono text-rose-400">{errorMsg}</p>
                    )}

                    {!deepLink ? (
                        <button
                            type="button"
                            onClick={generateLink}
                            disabled={loading}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold font-mono tracking-wider shadow-lg shadow-cyan-600/20 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                        >
                            {loading ? 'Generating Link...' : 'Link Telegram Account'}
                        </button>
                    ) : (
                        <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/40 space-y-3">
                            <p className="text-xs font-mono text-cyan-300">
                                Click the button below to open Telegram and tap <strong className="text-white">Start</strong> to finalize linking:
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <a
                                    href={deepLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-md transition-all font-mono"
                                >
                                    <span>Open Bot in Telegram</span>
                                    <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                                </a>
                                <SecondaryButton 
                                    onClick={() => setDeepLink(null)}
                                    className="!bg-slate-900 !border-slate-800 !text-slate-300 hover:!bg-slate-800 !text-xs !rounded-xl"
                                >
                                    Reset
                                </SecondaryButton>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}