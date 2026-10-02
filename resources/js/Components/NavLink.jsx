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
            aria-current={active ? 'page' : undefined}
            className={`isd-app-nav-link ${active ? 'is-active' : ''} ${className}`}
        >
            {children}
        </Link>
    );
}
