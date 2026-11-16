// File: isdalog/resources/js/Components/WithdrawalNotificationBell.jsx
import { BellIcon } from '@heroicons/react/24/outline';
import { Link, usePage, usePoll } from '@inertiajs/react';

export default function WithdrawalNotificationBell() {
    const { props, component } = usePage();
    const count = props.withdrawalUnreadCount ?? 0;
    usePoll(60000, {
        only: component === 'Notifications/Index' ? ['withdrawalUnreadCount', 'notifications'] : ['withdrawalUnreadCount'],
        onBefore: () => document.visibilityState === 'visible',
    });

    return <Link href={route('notifications.index')} className="isd-notification-bell" aria-label={`Notifications, ${count} unread`}>
        <BellIcon className="h-5 w-5" aria-hidden="true" />
        {count > 0 && <span className="isd-notification-count" aria-hidden="true">{count > 99 ? '99+' : count}</span>}
    </Link>;
}
