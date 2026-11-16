import { Link } from '@inertiajs/react';
import {
    ArrowRightIcon,
    BanknotesIcon,
    CheckCircleIcon,
    ClockIcon,
    LockClosedIcon,
    PaperAirplaneIcon,
    ScaleIcon,
    SparklesIcon,
    TruckIcon,
} from '@heroicons/react/24/outline';

const money = (value) => `₱${Number(value ?? 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})}`;

export function FishermanMetrics({ metrics, user }) {
    const summaries = [
        { label: 'Available balance', value: money(metrics.walletBalance ?? user.wallet_balance), detail: 'Available sales balance', icon: BanknotesIcon, tone: 'success' },
        { label: 'Net earnings', value: money(metrics.netEarnings), detail: 'Lifetime · 97% net proceeds from closed sales', icon: CheckCircleIcon },
        { label: 'Pending escrow', value: money(metrics.pendingEscrow), detail: 'Released after buyer delivery confirmation', icon: LockClosedIcon, tone: 'warning' },
        { label: 'Recorded catch', value: `${Number(metrics.totalWeight ?? 0).toLocaleString('en-PH')} kg`, detail: `${metrics.totalCatches ?? 0} catch ${Number(metrics.totalCatches) === 1 ? 'batch' : 'batches'} recorded`, icon: ScaleIcon },
    ];

    return summaries.map(({ label, value, detail, icon: Icon, tone }) => (
        <div key={label} className={`isd-fisherman-metric${tone ? ` isd-fisherman-metric-${tone}` : ''}`}>
            <div className="isd-fisherman-metric-heading">
                <span>{label}</span>
                <Icon aria-hidden="true" />
            </div>
            <p className="isd-fisherman-metric-value">{value}</p>
            <p className="isd-fisherman-supporting">{detail}</p>
        </div>
    ));
}

export function FishermanAttention({ activeListings, salesHistory, telegramConnected }) {
    // These are summaries of the records already supplied to this role, not new workflow states.
    const offers = (activeListings ?? []).filter((listing) => (
        listing.has_bids || (listing.bids_count ?? listing.bids?.length ?? 0) > 0
    ));
    const pickups = (salesHistory ?? []).filter((order) => order.status === 'pending_dispatch');
    const confirmations = (salesHistory ?? []).filter((order) => order.status === 'delivered');
    const groups = [
        {
            title: 'Offers to review', count: offers.length, icon: SparklesIcon,
            description: offers.length ? 'Review buyer offers before awarding your catch.' : 'No buyer offers to review yet.',
            action: 'Review offers', target: offers.length ? `#fisherman-auction-${offers[0].id}` : null,
        },
        {
            title: 'Awaiting pickup', count: pickups.length, icon: TruckIcon,
            description: pickups.length ? 'Rider or buyer handover is still pending.' : 'No catches awaiting pickup.',
            action: 'View pickup information', target: pickups.length ? `#fisherman-sale-${pickups[0].order_id}` : null,
        },
        {
            title: 'Awaiting buyer confirmation', count: confirmations.length, icon: ClockIcon,
            description: confirmations.length ? 'Delivered; the buyer must confirm to release payment.' : 'No delivered sales awaiting confirmation.',
            action: 'View pending payment', target: confirmations.length ? `#fisherman-sale-${confirmations[0].order_id}` : null,
        },
    ];
    const hasPendingWork = groups.some((group) => group.count > 0);

    return (
        <section className="isd-fisherman-attention" aria-labelledby="fisherman-attention-heading">
            <div className="isd-fisherman-section-heading">
                <div>
                    <h3 id="fisherman-attention-heading">Needs attention</h3>
                    <p className="isd-fisherman-supporting">Offers, handovers, and payments at a glance.</p>
                </div>
                {!hasPendingWork && <span className="isd-fisherman-clear"><CheckCircleIcon aria-hidden="true" />You're up to date</span>}
            </div>

            <div className="isd-fisherman-attention-grid">
                {groups.map(({ title, count, description, action, target, icon: Icon }) => (
                    <div key={title} className="isd-fisherman-task">
                        <div className="isd-fisherman-task-heading">
                            <Icon aria-hidden="true" />
                            <span className="isd-fisherman-task-count">{count}</span>
                        </div>
                        <h4>{title}</h4>
                        <p className="isd-fisherman-supporting">{description}</p>
                        {target && <a className="isd-fisherman-task-link" href={target}>{action}<ArrowRightIcon aria-hidden="true" /></a>}
                    </div>
                ))}
            </div>

            <div className="isd-fisherman-telegram">
                <PaperAirplaneIcon aria-hidden="true" />
                <div>
                    <h4>{telegramConnected ? 'Keep your catch records connected' : 'Start recording catches with Telegram'}</h4>
                    <p className="isd-fisherman-supporting">{telegramConnected ? 'Manage your Telegram connection in your account.' : 'Connect your account, then send a catch photo to the bot.'}</p>
                </div>
                <Link className="isd-ui-button isd-ui-button-secondary" href={`${route('profile.edit')}#telegram-connection`}>
                    {telegramConnected ? 'Telegram settings' : 'Connect Telegram'}
                    <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                </Link>
            </div>
        </section>
    );
}
