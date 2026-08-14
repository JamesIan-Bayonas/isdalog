// resources/js/Pages/Auth/Login.jsx
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
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

    // Roles are modelled as sonar contacts — angle is fixed per role so the
    // console reads like a real scope, not a decoration.
    const roleData = {
        fisherman: {
            title: 'Harbor Fishermen',
            desc: 'Instant zero-typing AI catch logging & direct consignment floor listing.',
            badge: 'Harvest & Auction',
            color: 'text-cyan-400',
            ring: 'stroke-cyan-400',
            fill: 'fill-cyan-400',
            bg: 'bg-cyan-500/10 border-cyan-500/30',
            angle: 55,
            icon: SparklesIcon
        },
        buyer: {
            title: 'Marketplace Buyers',
            desc: 'Real-time WebSocket bidding with secured wallet escrow verification.',
            badge: 'Live Trading',
            color: 'text-emerald-400',
            ring: 'stroke-emerald-400',
            fill: 'fill-emerald-400',
            bg: 'bg-emerald-500/10 border-emerald-500/30',
            angle: 145,
            icon: CircleStackIcon
        },
        rider: {
            title: 'Logistics Couriers',
            desc: 'Port-to-market dispatch routing & verifiable chain-of-custody tracking.',
            badge: 'Cold Chain Delivery',
            color: 'text-violet-400',
            ring: 'stroke-violet-400',
            fill: 'fill-violet-400',
            bg: 'bg-violet-500/10 border-violet-500/30',
            angle: 235,
            icon: TruckIcon
        },
        admin: {
            title: 'BFAR Supervision',
            desc: 'Biomass volume telemetry & automated marine conservation monitoring.',
            badge: 'Compliance Oversight',
            color: 'text-amber-400',
            ring: 'stroke-amber-400',
            fill: 'fill-amber-400',
            bg: 'bg-amber-500/10 border-amber-500/30',
            angle: 325,
            icon: ChartBarIcon
        }
    };

    const CurrentRoleIcon = roleData[selectedRolePreview].icon;

    // Polar -> cartesian for the sonar contacts. Center (110,110), radius 76.
    const contactPoint = (angleDeg) => {
        const rad = (angleDeg * Math.PI) / 180;
        return {
            x: 110 + 76 * Math.cos(rad),
            y: 110 + 76 * Math.sin(rad),
        };
    };

    return (
        <>
            <Head title="Sign In — IsdaLog Maritime Hub" />

            <style>{`
                @keyframes vela-sweep {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes vela-ping-slow {
                    0% { transform: scale(0.9); opacity: .55; }
                    70%, 100% { transform: scale(1.9); opacity: 0; }
                }
                .vela-sweep-arm {
                    transform-origin: 110px 110px;
                    animation: vela-sweep 4.5s linear infinite;
                }
                .vela-contact-ping {
                    animation: vela-ping-slow 2.4s cubic-bezier(0,0,.2,1) infinite;
                    transform-origin: center;
                }
            `}</style>

            <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#020617] text-slate-100 selection:bg-cyan-500 selection:text-white relative overflow-hidden">

                {/* --- AMBIENT NAUTICAL BACKDROP LIGHTING --- */}
                <div className="absolute top-[-12%] left-[-12%] w-[42rem] h-[42rem] bg-gradient-to-br from-cyan-600/10 via-blue-700/[0.06] to-transparent rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-[-12%] right-[-6%] w-[36rem] h-[36rem] bg-gradient-to-tr from-emerald-600/[0.06] via-cyan-900/10 to-transparent rounded-full blur-3xl pointer-events-none" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b08_1px,transparent_1px),linear-gradient(to_bottom,#1e293b08_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

                {/* ========================================================================= */}
                {/* LEFT — SONAR CONSOLE (5 Columns)                                          */}
                {/* ========================================================================= */}
                <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-12 relative z-10 border-r border-slate-800/70 bg-slate-950/50 backdrop-blur-xl">

                    {/* Brand Header */}
                    <div>
                        <Link href="/" className="inline-flex items-center gap-3.5 group">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-[1px] shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-300">
                                <div className="w-full h-full bg-slate-950 rounded-[15px] flex items-center justify-center">
                                    <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-tr from-cyan-400 to-blue-400">⚓</span>
                                </div>
                            </div>
                            <div>
                                <span className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                                    IsdaLog
                                    <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-500/30">
                                        v2.4 Core
                                    </span>
                                </span>
                                <p className="text-[11px] font-mono text-slate-500 tracking-wider">Galas Port Terminal · Dipolog City</p>
                            </div>
                        </Link>
                    </div>

                    {/* Sonar Console + Role Contacts */}
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/70 text-xs font-semibold text-slate-300 shadow-inner">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Municipal trading nodes operational</span>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-3xl font-black text-white leading-[1.1] tracking-tight">
                                Autonomous maritime catch & escrow logistics.
                            </h2>
                            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                                Every role on this port is a contact on the scope. Select one to see what it reports.
                            </p>
                        </div>

                        <div className="flex gap-6 items-center pt-1">
                            {/* --- Sonar scope: the signature element --- */}
                            <svg viewBox="0 0 220 220" className="w-40 h-40 shrink-0" role="img" aria-label="Platform role scope">
                                <circle cx="110" cy="110" r="100" className="fill-slate-900/70 stroke-slate-800" strokeWidth="1" />
                                <circle cx="110" cy="110" r="76" className="fill-none stroke-slate-800" strokeWidth="1" />
                                <circle cx="110" cy="110" r="42" className="fill-none stroke-slate-800" strokeWidth="1" />
                                <line x1="10" y1="110" x2="210" y2="110" className="stroke-slate-800" strokeWidth="1" />
                                <line x1="110" y1="10" x2="110" y2="210" className="stroke-slate-800" strokeWidth="1" />

                                {/* rotating sweep */}
                                <g className="vela-sweep-arm">
                                    <path d="M110 110 L110 10 A100 100 0 0 1 178 42 Z" fill="url(#sweepGradient)" opacity="0.55" />
                                </g>
                                <defs>
                                    <linearGradient id="sweepGradient" x1="110" y1="10" x2="178" y2="42" gradientUnits="userSpaceOnUse">
                                        <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.5" />
                                        <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                                    </linearGradient>
                                </defs>

                                {/* role contacts */}
                                {Object.keys(roleData).map((role) => {
                                    const { x, y } = contactPoint(roleData[role].angle);
                                    const active = selectedRolePreview === role;
                                    return (
                                        <g key={role} onClick={() => setSelectedRolePreview(role)} className="cursor-pointer">
                                            {active && (
                                                <circle cx={x} cy={y} r="6" className={`${roleData[role].fill} vela-contact-ping`} />
                                            )}
                                            <circle
                                                cx={x} cy={y}
                                                r={active ? 6 : 4}
                                                className={`${roleData[role].fill} transition-all duration-300`}
                                                stroke="#020617"
                                                strokeWidth="1.5"
                                            />
                                        </g>
                                    );
                                })}

                                <circle cx="110" cy="110" r="3" className="fill-slate-300" />
                            </svg>

                            {/* Role tabs, now labeled as "contacts" the scope is reading */}
                            <div className="flex-1 grid grid-cols-2 gap-1.5">
                                {Object.keys(roleData).map((role) => (
                                    <button
                                        key={role}
                                        type="button"
                                        onClick={() => setSelectedRolePreview(role)}
                                        className={`py-2 px-2.5 rounded-lg text-[11px] font-bold capitalize transition-all text-left border ${
                                            selectedRolePreview === role
                                                ? 'bg-slate-800/90 text-white border-slate-700 shadow-sm'
                                                : 'bg-transparent text-slate-500 border-transparent hover:text-slate-300 hover:border-slate-800'
                                        }`}
                                    >
                                        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle ${selectedRolePreview === role ? roleData[role].fill : 'bg-slate-700'}`} />
                                        {role}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Active Role Feature Readout */}
                        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-md transition-all duration-300">
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-lg border ${roleData[selectedRolePreview].bg}`}>
                                    <CurrentRoleIcon className={`w-5 h-5 ${roleData[selectedRolePreview].color}`} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-bold text-white">{roleData[selectedRolePreview].title}</h4>
                                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                            {roleData[selectedRolePreview].badge}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                        {roleData[selectedRolePreview].desc}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Status Telemetry */}
                    <div className="pt-6 border-t border-slate-900 flex items-center justify-between text-xs text-slate-500 font-mono">
                        <span>LAT 8.58° N, LON 123.33° E</span>
                        <span className="text-emerald-400 font-semibold">BFAR Compliant</span>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* RIGHT FORM CONTAINER (7 Columns)                                          */}
                {/* ========================================================================= */}
                <div className="col-span-1 lg:col-span-7 flex items-center justify-center p-6 sm:p-12 relative z-10">
                    <div className="w-full max-w-md space-y-8">

                        {/* Mobile Header Bar */}
                        <div className="lg:hidden flex items-center justify-between border-b border-slate-800 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-md">
                                    <span className="text-lg font-black text-white">⚓</span>
                                </div>
                                <span className="text-lg font-black text-white">IsdaLog</span>
                            </div>
                            <span className="text-xs font-mono text-cyan-400">Galas Port Node</span>
                        </div>

                        {/* Title Header */}
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                                Sign in to terminal
                            </h1>
                            <p className="text-sm text-slate-400 mt-2">
                                Access live trading, cargo logistics, or registration.{' '}
                                <Link
                                    href={route('register')}
                                    className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors underline-offset-4 hover:underline"
                                >
                                    Create account
                                </Link>
                            </p>
                        </div>

                        {/* Status Message (e.g. Password Reset) */}
                        {status && (
                            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-semibold flex items-center gap-2.5">
                                <ShieldCheckIcon className="w-5 h-5 text-emerald-400 shrink-0" />
                                <span>{status}</span>
                            </div>
                        )}

                        {/* Login Form */}
                        <form onSubmit={submit} className="space-y-5">

                            {/* EMAIL FIELD */}
                            <div>
                                <InputLabel htmlFor="email" value="Account Email" className="!text-slate-300 !text-xs !font-bold !uppercase !tracking-wider" />
                                <div className="mt-1.5 relative rounded-xl shadow-sm group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                                        <EnvelopeIcon className="h-5 w-5" />
                                    </div>
                                    <TextInput
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        className="!bg-slate-900/90 !border-slate-800 !text-white !pl-11 !py-3.5 !rounded-xl focus:!border-cyan-500 focus:!ring-2 focus:!ring-cyan-500/30 block w-full text-sm placeholder:text-slate-600 transition-all shadow-inner"
                                        autoComplete="username"
                                        isFocused={true}
                                        placeholder="operator@isdalog.ph"
                                        onChange={(e) => setData('email', e.target.value)}
                                        required
                                    />
                                </div>
                                <InputError message={errors.email} className="mt-2 text-xs" />
                            </div>

                            {/* PASSWORD FIELD */}
                            <div>
                                <div className="flex justify-between items-center">
                                    <InputLabel htmlFor="password" value="Security Key" className="!text-slate-300 !text-xs !font-bold !uppercase !tracking-wider" />
                                    {canResetPassword && (
                                        <Link
                                            href={route('password.request')}
                                            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
                                        >
                                            Forgot password?
                                        </Link>
                                    )}
                                </div>
                                <div className="mt-1.5 relative rounded-xl shadow-sm group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                                        <LockClosedIcon className="h-5 w-5" />
                                    </div>
                                    <TextInput
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={data.password}
                                        className="!bg-slate-900/90 !border-slate-800 !text-white !pl-11 !pr-11 !py-3.5 !rounded-xl focus:!border-cyan-500 focus:!ring-2 focus:!ring-cyan-500/30 block w-full text-sm placeholder:text-slate-600 transition-all shadow-inner"
                                        autoComplete="current-password"
                                        placeholder="••••••••••••"
                                        onChange={(e) => setData('password', e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? (
                                            <EyeSlashIcon className="h-5 w-5" />
                                        ) : (
                                            <EyeIcon className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                                <InputError message={errors.password} className="mt-2 text-xs" />
                            </div>

                            {/* REMEMBER ME TOGGLE */}
                            <div className="flex items-center justify-between pt-1">
                                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                    <Checkbox
                                        name="remember"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        className="!bg-slate-900 !border-slate-700 !text-cyan-500 focus:!ring-cyan-500/50 !rounded-md h-4 w-4"
                                    />
                                    <span className="text-xs font-medium text-slate-400">Maintain active session</span>
                                </label>
                            </div>

                            {/* SUBMIT BUTTON */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full inline-flex items-center justify-center gap-2.5 py-4 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-cyan-600/25 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2 cursor-pointer"
                            >
                                {processing ? (
                                    <div className="flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                        </svg>
                                        <span>Authenticating signature...</span>
                                    </div>
                                ) : (
                                    <>
                                        <span>Authorize & Sign In</span>
                                        <ArrowRightIcon className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Bottom Security Assurance */}
                        <div className="pt-4 flex items-center justify-center gap-2 text-[11px] text-slate-500">
                            <ShieldCheckIcon className="w-4 h-4 text-emerald-500" />
                            <span>Protected by 256-bit escrow & identity encryption</span>
                        </div>

                    </div>
                </div>

            </div>
        </>
    );
}