import DangerButton from '@/Components/DangerButton';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import axios from 'axios';
import { PaperAirplaneIcon, CheckBadgeIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

export default function ConnectTelegramForm({ className = '' }) {
    const user = usePage().props.auth.user;
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
                    <PaperAirplaneIcon className="w-5 h-5 text-sky-500" />
                    <h2 className="text-lg font-medium text-gray-900">
                        Telegram AI Telemetry Link
                    </h2>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                    Connect your personal Telegram account to enable Edge-AI fish classification and automatic catch logging.
                </p>
            </header>

            {user.telegram_chat_id ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <CheckBadgeIcon className="w-8 h-8 text-emerald-500 shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-emerald-900">Telegram Account Connected</p>
                            <p className="text-xs font-mono text-emerald-700">Chat ID: {user.telegram_chat_id}</p>
                        </div>
                    </div>
                    <form onSubmit={handleUnlink}>
                        <DangerButton disabled={unlinking} className="!text-xs">
                            {unlinking ? 'Disconnecting...' : 'Disconnect Telegram'}
                        </DangerButton>
                    </form>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700">
                        <p className="font-semibold text-slate-800">Why link Telegram?</p>
                        <ul className="list-disc list-inside mt-1 text-xs text-slate-600 space-y-1">
                            <li>Instant camera photo catch logging via your Telegram bot</li>
                            <li>Real-time push notifications for winning bids and consignment settlements</li>
                            <li>Automatic mapping of sea catches to your registered account</li>
                        </ul>
                    </div>

                    {errorMsg && (
                        <p className="text-sm text-red-600">{errorMsg}</p>
                    )}

                    {!deepLink ? (
                        <PrimaryButton onClick={generateLink} disabled={loading} className="!bg-sky-600 hover:!bg-sky-500 focus:!ring-sky-500">
                            {loading ? 'Generating Link...' : 'Link Telegram Account'}
                        </PrimaryButton>
                    ) : (
                        <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 space-y-3">
                            <p className="text-xs text-sky-800">
                                Click the button below to open Telegram and tap <strong>Start</strong> to finalize linking:
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <a
                                    href={deepLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold shadow-md transition-all"
                                >
                                    <span>Open Bot in Telegram</span>
                                    <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                                </a>
                                <SecondaryButton onClick={() => setDeepLink(null)}>
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