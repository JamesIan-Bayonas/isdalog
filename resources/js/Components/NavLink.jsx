import { Link } from '@inertiajs/react';

export default function NavLink({
    active = false,
    className = '',
    children,
    ...props
}) {
    return (
        <Link
            {...props}
            className={
                'inline-flex items-center border-b-2 px-3 pt-1 text-xs font-mono font-bold tracking-wider uppercase transition-all duration-150 ease-in-out focus:outline-none ' +
                (active
                    ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30 rounded-t-lg shadow-sm focus:border-cyan-300 '
                    : 'border-transparent text-slate-400 hover:text-slate-100 hover:border-slate-700 focus:text-slate-200 focus:border-slate-600 ') +
                className
            }
        >
            {children}
        </Link>
    );
}