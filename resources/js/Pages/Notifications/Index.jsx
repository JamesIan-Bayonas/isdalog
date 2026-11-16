// File: isdalog/resources/js/Pages/Notifications/Index.jsx
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function Notifications({ notifications, filter }) {
    const unread = usePage().props.withdrawalUnreadCount ?? 0;
    const [busy, setBusy] = useState(null);
    const [error, setError] = useState('');
    const act = (id, action) => {
        if (busy) return;
        setError(''); setBusy(`${action}-${id}`);
        const options = { preserveScroll: action !== 'open', onFinish: () => setBusy(null), onError: () => setError('The update could not be saved. Try again.') };
        if (action === 'open') router.post(route('notifications.open', id), {}, options);
        else router.patch(action === 'all' ? route('notifications.read-all') : route('notifications.read', id), {}, options);
    };
    return <AuthenticatedLayout header={<h2 className="text-xl font-semibold isd-text-primary">Notifications</h2>}>
        <Head title="Notifications" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <section className="isd-catch-history isd-notification-inbox" aria-labelledby="notification-inbox-heading" aria-busy={Boolean(busy)}>
                <div className="isd-fisherman-section-heading"><div><h3 id="notification-inbox-heading">Your transaction updates</h3><p className="isd-fisherman-supporting">Offers, orders, handovers, settlements and withdrawal updates. These records do not confirm SMS delivery.</p></div><Link href={route('dashboard')} className="isd-history-back">Back to dashboard</Link></div>
                <div className="isd-notification-toolbar">
                    <label htmlFor="notification-filter">Show<select id="notification-filter" className="isd-ui-input" value={filter} disabled={Boolean(busy)} onChange={(event) => router.get(route('notifications.index'), { filter: event.target.value }, { replace: true, preserveScroll: true, onStart: () => setBusy('filter'), onFinish: () => setBusy(null) })}><option value="all">All notifications</option><option value="unread">Unread only</option></select></label>
                    <button type="button" className="isd-ui-button isd-ui-button-secondary" disabled={Boolean(busy)} onClick={() => router.reload({ only: ['notifications', 'withdrawalUnreadCount'], onStart: () => setBusy('refresh'), onFinish: () => setBusy(null) })}>Refresh updates</button>
                    <button type="button" className="isd-ui-button isd-ui-button-secondary" disabled={Boolean(busy) || unread === 0} onClick={() => act('all', 'all')}>Mark all as read</button>
                </div>
                <p className="isd-history-result-count" role="status">{unread} unread · {notifications.total} matching {notifications.total === 1 ? 'notification' : 'notifications'}</p>
                {error && <p role="alert">{error}</p>}
                {notifications.data.length ? <ul className="isd-history-list">{notifications.data.map((notification) => <li key={notification.id} className="isd-history-record">
                    <div className="isd-history-record-heading"><div><p className="isd-history-id">{notification.withdrawal_request_id ? 'Withdrawal #' + notification.withdrawal_request_id : (notification.subject_type === 'order' ? 'Order #' : 'Listing #') + notification.subject_id} · {notification.read_at ? 'Read' : 'Unread'}</p><h4>{notification.title}</h4></div><time className="isd-fisherman-supporting" dateTime={notification.created_at}>{new Date(notification.created_at).toLocaleString()}</time></div>
                    <p className="isd-notification-message">{notification.message}</p>
                    <div className="isd-review-pagination"><button type="button" className="isd-ui-button isd-ui-button-primary" disabled={Boolean(busy)} onClick={() => act(notification.id, 'open')} aria-label={`Open notification ${notification.id}`}>View details</button>{!notification.read_at && <button type="button" className="isd-ui-button isd-ui-button-secondary" disabled={Boolean(busy)} onClick={() => act(notification.id, 'read')} aria-label={`Mark notification ${notification.id} as read`}>Mark as read</button>}</div>
                </li>)}</ul> : <div className="isd-history-empty">{filter === 'unread' ? 'You have no unread updates.' : 'New transaction updates will appear here. Earlier changes are available in your payment history.'}</div>}
                <nav className="isd-review-pagination" aria-label="Notification pages">{notifications.prev_page_url && <Link href={notifications.prev_page_url} className="isd-ui-button isd-ui-button-secondary">Previous page</Link>}{notifications.next_page_url && <Link href={notifications.next_page_url} className="isd-ui-button isd-ui-button-secondary">Next page</Link>}</nav>
                <p className="isd-fisherman-supporting isd-history-note">Updates refresh every minute while this page is visible. Dates use your device’s timezone. Opening an update marks it as read.</p>
            </section>
        </div>
    </AuthenticatedLayout>;
}
