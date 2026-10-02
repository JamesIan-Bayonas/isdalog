import ApplicationLogo from '@/Components/ApplicationLogo';
import ThemeToggle from '@/Components/ThemeToggle';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="isd-guest-page flex min-h-screen flex-col items-center px-4 pt-6 sm:justify-center sm:pt-0">
            <ThemeToggle className="isd-auth-theme-fab" />
            <div>
                <Link href="/">
                    <ApplicationLogo className="isd-guest-logo h-20 w-20 fill-current" />
                </Link>
            </div>

            <div className="isd-guest-card mt-6 w-full overflow-hidden px-6 py-5 sm:max-w-md sm:rounded-xl">
                {children}
            </div>
        </div>
    );
}
