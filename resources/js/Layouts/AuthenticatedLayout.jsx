import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);

    const getRoleBadge = (role) => {
        switch (role) {
            case 'admin':
                return {
                    label: 'BFAR Admin',
                    classes: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
                };
            case 'fisherman':
                return {
                    label: 'Harvester',
                    classes: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
                };
            case 'rider':
                return {
                    label: 'Cold-Chain Courier',
                    classes: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                };
            case 'buyer':
            default:
                return {
                    label: 'Consignment Buyer',
                    classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                };
        }
    };

    const roleBadge = getRoleBadge(user?.role);

    return (
        <div className="min-h-screen bg-[#020617] text-slate-100 selection:bg-cyan-500 selection:text-white relative overflow-x-hidden">
            {/* Ambient Background Gradient Glows */}
            <div className="fixed top-[-10%] left-[-10%] w-[38rem] h-[38rem] bg-gradient-to-br from-cyan-600/10 via-blue-700/[0.04] to-transparent rounded-full blur-3xl pointer-events-none" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[38rem] h-[38rem] bg-gradient-to-tr from-emerald-600/[0.05] via-cyan-900/10 to-transparent rounded-full blur-3xl pointer-events-none" />

            {/* Top Navigation Bar */}
            <nav className="border-b border-slate-800/80 bg-slate-950/75 backdrop-blur-xl sticky top-0 z-40">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between items-center">
                        <div className="flex items-center gap-8">
                            {/* Brand / Logo */}
                            <div className="flex shrink-0 items-center">
                                <Link href="/" className="flex items-center gap-2.5 group">
                                    <div className="p-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 group-hover:scale-105 transition-transform shadow-lg shadow-cyan-500/20">
                                        <ApplicationLogo className="block h-7 w-7 fill-current" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-base font-black tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                                            IsdaLog
                                        </span>
                                        <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400">
                                            Maritime Hub
                                        </span>
                                    </div>
                                </Link>
                            </div>

                            {/* Primary Navigation Links */}
                            <div className="hidden space-x-2 sm:-my-px sm:flex items-center">
                                <NavLink
                                    href={route('dashboard')}
                                    active={route().current('dashboard')}
                                    className="!border-b-0 !px-3.5 !py-2 !rounded-xl !text-xs !font-mono !font-bold transition-all"
                                >
                                    Terminal
                                </NavLink>

                                <NavLink
                                    href={route('marketplace.index')}
                                    active={route().current('marketplace.*')}
                                    className="!border-b-0 !px-3.5 !py-2 !rounded-xl !text-xs !font-mono !font-bold transition-all"
                                >
                                    Live Floor
                                </NavLink>

                                {(user?.role === 'rider' || user?.role === 'admin') && (
                                    <NavLink
                                        href={route('dispatch.index')}
                                        active={route().current('dispatch.*')}
                                        className="!border-b-0 !px-3.5 !py-2 !rounded-xl !text-xs !font-mono !font-bold transition-all"
                                    >
                                        Logistics Matrix
                                    </NavLink>
                                )}

                                {user?.role === 'admin' && (
                                    <NavLink
                                        href={route('bfar.dashboard')}
                                        active={route().current('bfar.dashboard')}
                                        className="!border-b-0 !px-3.5 !py-2 !rounded-xl !text-xs !font-mono !font-bold transition-all"
                                    >
                                        BFAR Oversight
                                    </NavLink>
                                )}
                            </div>
                        </div>

                        {/* Right Section: Role Badge + User Dropdown */}
                        <div className="hidden sm:flex sm:items-center sm:gap-4">
                            {/* Role Badge */}
                            <span
                                className={`text-[10px] font-mono uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border ${roleBadge.classes}`}
                            >
                                {roleBadge.label}
                            </span>

                            {/* Virtual Wallet Indicator */}
                            {user?.wallet_balance !== undefined && (
                                <div className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono flex items-center gap-1.5 shadow-inner">
                                    <span className="text-slate-400">Balance:</span>
                                    <span className="font-black text-emerald-400">
                                        ₱{parseFloat(user.wallet_balance || 0).toFixed(2)}
                                    </span>
                                </div>
                            )}

                            {/* Settings Dropdown */}
                            <div className="relative">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <button
                                            type="button"
                                            className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2 text-xs font-mono font-medium text-slate-200 transition-all hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                                        >
                                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                            <span>{user?.name}</span>
                                            <svg
                                                className="h-3.5 w-3.5 text-slate-400"
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </button>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content contentClasses="py-1 bg-slate-950 border border-slate-800 shadow-2xl rounded-xl">
                                        <Dropdown.Link
                                            href={route('profile.edit')}
                                            className="!text-xs !font-mono !text-slate-300 hover:!bg-slate-900 hover:!text-white"
                                        >
                                            Profile Security & Keys
                                        </Dropdown.Link>
                                        <Dropdown.Link
                                            href={route('logout')}
                                            method="post"
                                            as="button"
                                            className="!text-xs !font-mono !text-rose-400 hover:!bg-rose-500/10 hover:!text-rose-300"
                                        >
                                            Terminate Session
                                        </Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>

                        {/* Hamburger Button for Mobile */}
                        <div className="-me-2 flex items-center sm:hidden">
                            <button
                                onClick={() => setShowingNavigationDropdown((previousState) => !previousState)}
                                className="inline-flex items-center justify-center rounded-xl p-2 text-slate-400 hover:bg-slate-900 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                            >
                                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                    <path
                                        className={!showingNavigationDropdown ? 'inline-flex' : 'hidden'}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                    <path
                                        className={showingNavigationDropdown ? 'inline-flex' : 'hidden'}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Responsive Navigation Menu */}
                <div className={(showingNavigationDropdown ? 'block' : 'hidden') + ' sm:hidden border-t border-slate-800/80 bg-slate-950/95 backdrop-blur-2xl'}>
                    <div className="space-y-1 pb-3 pt-2">
                        <ResponsiveNavLink
                            href={route('dashboard')}
                            active={route().current('dashboard')}
                            className="!font-mono !text-xs !text-slate-300"
                        >
                            Terminal
                        </ResponsiveNavLink>

                        <ResponsiveNavLink
                            href={route('marketplace.index')}
                            active={route().current('marketplace.*')}
                            className="!font-mono !text-xs !text-slate-300"
                        >
                            Live Floor
                        </ResponsiveNavLink>

                        {(user?.role === 'rider' || user?.role === 'admin') && (
                            <ResponsiveNavLink
                                href={route('dispatch.index')}
                                active={route().current('dispatch.*')}
                                className="!font-mono !text-xs !text-slate-300"
                            >
                                Logistics Matrix
                            </ResponsiveNavLink>
                        )}

                        {user?.role === 'admin' && (
                            <ResponsiveNavLink
                                href={route('bfar.dashboard')}
                                active={route().current('bfar.dashboard')}
                                className="!font-mono !text-xs !text-slate-300"
                            >
                                BFAR Oversight
                            </ResponsiveNavLink>
                        )}
                    </div>

                    <div className="border-t border-slate-800/80 pb-3 pt-4 px-4">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <div className="text-sm font-bold text-white">{user?.name}</div>
                                <div className="text-xs font-mono text-slate-400">{user?.email}</div>
                            </div>
                            <span
                                className={`text-[9px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${roleBadge.classes}`}
                            >
                                {roleBadge.label}
                            </span>
                        </div>

                        <div className="space-y-1">
                            <ResponsiveNavLink
                                href={route('profile.edit')}
                                className="!font-mono !text-xs !text-slate-300"
                            >
                                Profile Security & Keys
                            </ResponsiveNavLink>
                            <ResponsiveNavLink
                                method="post"
                                href={route('logout')}
                                as="button"
                                className="!font-mono !text-xs !text-rose-400"
                            >
                                Terminate Session
                            </ResponsiveNavLink>
                        </div>
                    </div>
                </div>
            </nav>

            {/* View Header */}
            {header && (
                <header className="border-b border-slate-800/60 bg-slate-950/40 backdrop-blur-md">
                    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
                        {header}
                    </div>
                </header>
            )}

            {/* View Body */}
            <main className="relative z-10">{children}</main>
        </div>
    );
}