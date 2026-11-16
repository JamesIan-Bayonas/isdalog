// File: resources/js/Pages/Auth/Login.jsx
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import ThemeToggle from '@/Components/ThemeToggle';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import {
    ShieldCheckIcon,
    LockClosedIcon,
    EnvelopeIcon,
    EyeIcon,
    EyeSlashIcon,
    ArrowRightIcon,
    SparklesIcon,
    CircleStackIcon,
    TruckIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';

export default function Login({ status, canResetPassword }) {
    const [showPassword, setShowPassword] = useState(false);
    const [selectedRolePreview, setSelectedRolePreview] = useState('fisherman');
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    const roleData = {
        fisherman: {
            title: 'Fishermen',
            desc: 'Log catches, manage auctions, and track secured earnings.',
            badge: 'Catch and auctions',
            tone: 'brand',
            icon: SparklesIcon
        },
        buyer: {
            title: 'Buyers',
            desc: 'Place offers, manage funds, and follow delivery progress.',
            badge: 'Marketplace and delivery',
            tone: 'success',
            icon: CircleStackIcon
        },
        rider: {
            title: 'Riders',
            desc: 'Claim dispatches and record verified cold-chain handovers.',
            badge: 'Cold-chain delivery',
            tone: 'info',
            icon: TruckIcon
        },
        admin: {
            title: 'BFAR supervision',
            desc: 'Review compliance signals and operational activity.',
            badge: 'Compliance oversight',
            tone: 'warning',
            icon: ChartBarIcon
        }
    };

    const currentRole = roleData[selectedRolePreview];
    const CurrentRoleIcon = currentRole.icon;

    return (
        <>
            <Head title="Sign In — IsdaLog Maritime Hub" />
            <div className="isd-login-page min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#F4F7F9] text-[#0F172A] selection:bg-[#0B6B75] selection:text-white">
                <ThemeToggle className="isd-auth-theme-fab" />
                <aside className="isd-auth-showcase hidden lg:grid lg:col-span-5">
                    <Link href="/" className="isd-auth-brand">
                        <span className="isd-auth-brand-mark"><img src="/images/isdalog-logo-mark.png" alt="" /></span>
                        <span><strong>IsdaLog</strong><small>Maritime marketplace and logistics</small></span>
                    </Link>

                    <div className="isd-auth-showcase-content">
                        <div className="isd-auth-showcase-copy">
                            <p className="isd-auth-eyebrow">One connected port</p>
                            <h2>A clearer way to trade, deliver, and oversee fresh catch.</h2>
                            <p>Explore the workspace for each role before signing in. Your account access and permissions remain unchanged.</p>
                        </div>

                        <div className="isd-role-preview">
                            <div className="isd-role-compass" aria-hidden="true">
                                <span className="isd-compass-sweep" aria-hidden="true" />
                                <span className="isd-compass-ring isd-ring-one" /><span className="isd-compass-ring isd-ring-two" />
                                <span className="isd-compass-line isd-line-horizontal" /><span className="isd-compass-line isd-line-vertical" />
                                {Object.entries(roleData).map(([key, role]) => <button key={key} type="button" tabIndex={-1} onClick={() => setSelectedRolePreview(key)} className={`isd-compass-point isd-compass-${key} ${selectedRolePreview === key ? 'is-active' : ''}`} aria-label={`Preview ${role.title}`} />)}
                                <span className="isd-compass-center" />
                            </div>
                            <div className="isd-role-list">
                                {Object.entries(roleData).map(([key, role]) => <button key={key} type="button" onClick={() => setSelectedRolePreview(key)} aria-pressed={selectedRolePreview === key} className={selectedRolePreview === key ? 'is-active' : ''}><span className={`isd-role-dot isd-tone-${role.tone}`} />{role.title}</button>)}
                            </div>
                        </div>

                        <div className={`isd-role-summary isd-tone-${currentRole.tone}`} aria-live="polite">
                            <span className="isd-role-summary-icon"><CurrentRoleIcon aria-hidden="true" /></span>
                            <span><strong>{currentRole.title}</strong><small>{currentRole.badge}</small><p>{currentRole.desc}</p></span>
                        </div>
                    </div>
                    <p className="isd-auth-assurance isd-auth-desktop-assurance"><ShieldCheckIcon aria-hidden="true" /> Built for secure, traceable catch operations</p>
                </aside>

                <main className="col-span-1 lg:col-span-7 flex items-center justify-center p-5 sm:p-10 lg:p-12">
                    <div className="w-full max-w-md rounded-2xl border border-[#DCE3E8] bg-white p-6 shadow-[0_8px_24px_rgb(15_23_42_/_0.05)] sm:p-8">
                        {/* Mobile Header Bar */}
                        <div className="lg:hidden flex items-center gap-3 border-b border-[#DCE3E8] pb-5 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-[#E6F3F4] flex items-center justify-center shadow-sm">
                                    <img src="/images/isdalog-logo-mark.png" alt="IsdaLog" className="h-7 w-7 object-contain" />
                                </div>
                                <span className="text-lg font-black text-[#0F172A]">IsdaLog</span>
                            </div>
                        </div>

                        {/* Title Header */}
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
                                Welcome back
                            </h1>
                            <p className="text-sm text-[#475569] mt-2">
                                Sign in to access your IsdaLog workspace.{' '}
                                <Link
                                    href={route('register')}
                                    className="text-[#0B6B75] hover:text-[#07535B] font-bold transition-colors underline-offset-4 hover:underline"
                                >
                                    Create account
                                </Link>
                            </p>
                        </div>

                        {/* Status Message */}
                        {status && (
                            <div className="mt-5 p-4 rounded-xl bg-[#EAF7F0] border border-[#BFE5CF] text-[#16794F] text-sm font-semibold flex items-center gap-2.5" role="status">
                                <ShieldCheckIcon className="w-5 h-5 text-[#16794F] shrink-0" />
                                <span>{status}</span>
                            </div>
                        )}

                        {/* Login Form */}
                        <form onSubmit={submit} className="mt-6 space-y-5">
                            {/* EMAIL FIELD */}
                            <div>
                                <InputLabel htmlFor="email" value="Email address" className="!text-[#475569] !text-xs !font-bold !uppercase !tracking-wider" />
                                <div className="mt-1.5 relative rounded-xl shadow-sm group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B] group-focus-within:text-[#0B6B75] transition-colors">
                                        <EnvelopeIcon className="h-5 w-5" />
                                    </div>
                                    <TextInput
                                        id="email"
                                        aria-invalid={Boolean(errors.email)}
                                        aria-describedby={errors.email ? 'login-email-error' : undefined}
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        className="!bg-white !border-[#C7D2DA] !text-[#0F172A] !pl-11 !py-3.5 !rounded-xl focus:!border-[#0B6B75] focus:!ring-2 focus:!ring-[#0B6B75]/20 block w-full text-sm placeholder:text-[#94A3B8] transition-all"
                                        autoComplete="username"
                                        isFocused={true}
                                        placeholder="operator@isdalog.ph"
                                        onChange={(e) => setData('email', e.target.value)}
                                        required
                                    />
                                </div>
                                <InputError id="login-email-error" message={errors.email} className="mt-2 text-xs" />
                            </div>

                            {/* PASSWORD FIELD */}
                            <div>
                                <div className="flex justify-between items-center">
                                    <InputLabel htmlFor="password" value="Password" className="!text-[#475569] !text-xs !font-bold !uppercase !tracking-wider" />
                                    {canResetPassword && (
                                        <Link
                                            href={route('password.request')}
                                            className="text-xs text-[#0B6B75] hover:text-[#07535B] font-semibold transition-colors"
                                        >
                                            Forgot password?
                                        </Link>
                                    )}
                                </div>
                                <div className="mt-1.5 relative rounded-xl shadow-sm group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B] group-focus-within:text-[#0B6B75] transition-colors">
                                        <LockClosedIcon className="h-5 w-5" />
                                    </div>
                                    <TextInput
                                        id="password"
                                        aria-invalid={Boolean(errors.password)}
                                        aria-describedby={errors.password ? 'login-password-error' : undefined}
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={data.password}
                                        className="!bg-white !border-[#C7D2DA] !text-[#0F172A] !pl-11 !pr-11 !py-3.5 !rounded-xl focus:!border-[#0B6B75] focus:!ring-2 focus:!ring-[#0B6B75]/20 block w-full text-sm placeholder:text-[#94A3B8] transition-all"
                                        autoComplete="current-password"
                                        placeholder="••••••••••••"
                                        onChange={(e) => setData('password', e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#64748B] hover:text-[#0B6B75] transition-colors"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? (
                                            <EyeSlashIcon className="h-5 w-5" />
                                        ) : (
                                            <EyeIcon className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                                <InputError id="login-password-error" message={errors.password} className="mt-2 text-xs" />
                            </div>

                            {/* REMEMBER ME TOGGLE */}
                            <div className="flex items-center justify-between pt-1">
                                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                    <Checkbox
                                        name="remember"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        className="!bg-white !border-[#94A3B8] !text-[#0B6B75] focus:!ring-[#0B6B75]/30 !rounded-md h-4 w-4"
                                    />
                                    <span className="text-xs font-medium text-[#475569]">Keep me signed in</span>
                                </label>
                            </div>

                            {/* SUBMIT BUTTON */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full inline-flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl bg-[#0B6B75] hover:bg-[#07535B] text-white font-bold text-sm shadow-sm transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2 cursor-pointer"
                            >
                                {processing ? (
                                    <div className="flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                        </svg>
                                        <span>Signing in...</span>
                                    </div>
                                ) : (
                                    <>
                                        <span>Sign in</span>
                                        <ArrowRightIcon className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Bottom Security Assurance */}
                        <div className="pt-6 flex items-center justify-center gap-2 text-[11px] text-[#64748B]">
                            <ShieldCheckIcon className="w-4 h-4 text-[#16794F]" />
                            <span>Secure sign-in for your protected workspace</span>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
