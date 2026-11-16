import { Link } from '@inertiajs/react';

export default function ResponsiveNavLink({
    active = false,
    className = '',
    children,
    ...props
}) {
    return (
        <Link
            {...props}
            aria-current={active ? 'page' : undefined}
            className={`isd-app-mobile-link ${active ? 'is-active' : ''} ${className}`}
        >
            {children}
        </Link>
    );
}
