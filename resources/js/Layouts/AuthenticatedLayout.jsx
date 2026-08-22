// File: resources/js/Layouts/AuthenticatedLayout.jsx
import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;

    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);

    return (
        <div className="min-h-screen bg-[#020617] text-slate-100">
            <nav className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-50">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between items-center">
                        <div className="flex items-center">
                            <div className="flex shrink-0 items-center">
                                <Link href="/" className="inline-flex items-center gap-2.5 group">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-[1px] shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-300">
                                        <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                                            <span className="text-base font-black text-transparent bg-clip-text bg-gradient-to-tr from-cyan-400 to-blue-400">⚓</span>
                                        </div>
                                    </div>
                                    <span className="font-black tracking-tight text-white hidden md:inline-block">IsdaLog</span>
                                </Link>
                            </div>

                            <div className="hidden space-x-6 sm:-my-px sm:ms-8 sm:flex">
                                <NavLink
                                    href={route('dashboard')}
                                    active={route().current('dashboard')}
                                    className={route().current('dashboard') ? '!border-cyan-400 !text-cyan-400' : '!text-slate-400 hover:!text-slate-200 hover:!border-slate-700'}
                                >
                                    Dashboard
                                </NavLink>
                                <NavLink 
                                    href={route('marketplace.index')} 
                                    active={route().current('marketplace.index')}
                                    className={route().current('marketplace.index') ? '!border-cyan-400 !text-cyan-400' : '!text-slate-400 hover:!text-slate-200 hover:!border-slate-700'}
                                >
                                    Live Trading Floor
                                </NavLink>
                                {user.role === 'rider' && (
                                    <NavLink 
                                        href={route('dispatch.index')} 
                                        active={route().current('dispatch.*')}
                                        className={route().current('dispatch.*') ? '!border-cyan-400 !text-cyan-400' : '!text-slate-400 hover:!text-slate-200 hover:!border-slate-700'}
                                    >
                                        Dispatch Board
                                    </NavLink>
                                )}
                                {user.role === 'admin' && (
                                    <NavLink
                                        href="/admin/users"
                                        active={window.location.pathname.startsWith('/admin/users')}
                                        className={window.location.pathname.startsWith('/admin/users') ? '!border-cyan-400 !text-cyan-400' : '!text-slate-400 hover:!text-slate-200 hover:!border-slate-700'}
                                    >
                                        User Management
                                    </NavLink>
                                )}
                            </div>
                        </div>

                        <div className="hidden sm:ms-6 sm:flex sm:items-center">
                            <div className="relative ms-3">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <span className="inline-flex rounded-md items-center">
                                            <div className="mr-3 hidden md:flex items-center bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/30 text-xs font-mono font-bold">
                                                <svg className="w-3.5 h-3.5 mr-1 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>₱ {parseFloat(user.wallet_balance || 0).toLocaleString()}</span>
                                            </div>

                                            <button
                                                type="button"
                                                className="inline-flex items-center rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs font-bold font-mono text-slate-200 transition duration-150 ease-in-out hover:bg-slate-800 focus:outline-none"
                                            >
                                                {user.name}
                                                <svg
                                                    className="-me-0.5 ms-2 h-4 w-4 text-slate-400"
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
                                        </span>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content contentClasses="py-1 bg-slate-950 border border-slate-800 text-slate-200">
                                        <Dropdown.Link
                                            href={route('profile.edit')}
                                            className="!text-slate-300 hover:!bg-slate-900 hover:!text-white text-xs font-mono"
                                        >
                                            Profile
                                        </Dropdown.Link>
                                        <Dropdown.Link
                                            href={route('logout')}
                                            method="post"
                                            as="button"
                                            className="!text-slate-300 hover:!bg-slate-900 hover:!text-white text-xs font-mono"
                                        >
                                            Log Out
                                        </Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>

                        <div className="-me-2 flex items-center sm:hidden">
                            <button
                                onClick={() =>
                                    setShowingNavigationDropdown(
                                        (previousState) => !previousState,
                                    )
                                }
                                className="inline-flex items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-white focus:outline-none"
                            >
                                <svg
                                    className="h-6 w-6"
                                    stroke="currentColor"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        className={
                                            !showingNavigationDropdown
                                                ? 'inline-flex'
                                                : 'hidden'
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                    <path
                                        className={
                                            showingNavigationDropdown
                                                ? 'inline-flex'
                                                : 'hidden'
                                        }
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

                <div
                    className={
                        (showingNavigationDropdown ? 'block' : 'hidden') +
                        ' sm:hidden border-b border-slate-800 bg-slate-950'
                    }
                >
                    <div className="space-y-1 pb-3 pt-2">
                        <ResponsiveNavLink
                            href={route('dashboard')}
                            active={route().current('dashboard')}
                            className="!text-slate-300 hover:!bg-slate-900"
                        >
                            Dashboard
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href={route('marketplace.index')}
                            active={route().current('marketplace.index')}
                            className="!text-slate-300 hover:!bg-slate-900"
                        >
                            Live Trading Floor
                        </ResponsiveNavLink>
                        {user.role === 'rider' && (
                            <ResponsiveNavLink
                                href={route('dispatch.index')}
                                active={route().current('dispatch.*')}
                                className="!text-slate-300 hover:!bg-slate-900"
                            >
                                Dispatch Board
                            </ResponsiveNavLink>
                        )}
                        {user.role === 'admin' && (
                            <ResponsiveNavLink
                                href={route('bfar.dashboard')}
                                active={route().current('bfar.dashboard')}
                                className="!text-emerald-400 font-bold hover:!bg-slate-900"
                            >
                                🛡️ BFAR Data Center
                            </ResponsiveNavLink>
                        )}
                    </div>
                </div>
            </nav>

            {header && (
                <header className="border-b border-slate-800/80 bg-slate-950/40 backdrop-blur-md">
                    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            <main>{children}</main>
        </div>
    );
}