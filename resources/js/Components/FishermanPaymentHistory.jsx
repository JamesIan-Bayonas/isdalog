import { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';

const money = (value) => value == null ? 'Not recorded' : new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);
function timestamp(value) {
    if (!value) return null;
    const text = String(value).replace(' ', 'T');
    const date = new Date(/(?:Z|[+-]\d{2}:?\d{2})$/i.test(text) ? text : `${text}Z`);
    return Number.isNaN(date.getTime()) ? null : date;
}
const day = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const requestStatuses = { pending: 'Pending review', approved: 'Approved request', rejected: 'Rejected request' };
const payoutStatuses = { processing: 'Simulation processing', paid: 'Simulation completed', failed: 'Simulation failed · refunded' };

export default function FishermanPaymentHistory({ sales = [], withdrawals = [] }) {
    const { url } = usePage();
    useEffect(() => {
        const selected = new URL(url, window.location.origin).searchParams.get('withdrawal');
        const id = selected && /^\d+$/.test(selected) ? `withdrawal-record-${selected}` : window.location.hash.slice(1);
        if (!/^withdrawal-record-\d+$/.test(id)) return;
        const frame = requestAnimationFrame(() => {
            const target = document.getElementById(id);
            target?.focus({ preventScroll: true });
            target?.scrollIntoView({ block: 'center' });
        });
        return () => cancelAnimationFrame(frame);
    }, [url, withdrawals]);
    const [type, setType] = useState('');
    const [status, setStatus] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const entries = [
        ...(sales ?? []).filter((sale) => sale.status === 'completed').map((sale) => ({
            key: `sale-${sale.order_id}`, type: 'earnings', status: 'released',
            title: sale.fish_name, reference: `Order #${sale.order_id}`, date: timestamp(sale.updated_at), sale,
        })),
        ...(withdrawals ?? []).map((request) => ({
            key: `withdrawal-${request.id}`, type: 'withdrawal', status: request.payout ? `payout_${request.payout.status}` : request.status,
            title: `${request.payment_method === 'gcash' ? 'GCash' : 'Maya'} •••• ${request.account_last_four}`,
            reference: `Request #${request.id}`, date: timestamp(request.created_at), request,
        })),
    ].sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));
    const invalidRange = Boolean(from && to && from > to);
    const filtered = entries.filter((entry) => (!type || entry.type === type) && (!status || entry.status === status)
        && (!from || (entry.date && day(entry.date) >= from)) && (!to || (entry.date && day(entry.date) <= to)));
    const reset = () => { setType(''); setStatus(''); setFrom(''); setTo(''); };

    return <section id="fisherman-payments" tabIndex={-1} className="isd-catch-history isd-fisherman-anchor" aria-labelledby="fisherman-payments-heading">
        <div className="isd-fisherman-section-heading"><div><h3 id="fisherman-payments-heading">Earnings & withdrawal history</h3><p className="isd-fisherman-supporting">Completed sales and your recorded withdrawal requests.</p></div><a href="#fisherman-section-navigation" className="isd-history-back">Back to sections ↑</a></div>
        <p className="isd-fisherman-supporting">Pending withdrawals reserve your balance. Approval records a review decision; it does not confirm payment by the provider.</p>
        <div className="isd-payment-filters">
            <label htmlFor="payment-type">Transaction type<select id="payment-type" className="isd-ui-input" value={type} onChange={(event) => setType(event.target.value)}><option value="">All types</option><option value="earnings">Sale earnings</option><option value="withdrawal">Withdrawal requests</option></select></label>
            <label htmlFor="payment-status">Status<select id="payment-status" className="isd-ui-input" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option><option value="released">Earnings released</option>{Object.entries(requestStatuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}{Object.entries(payoutStatuses).map(([value, label]) => <option key={value} value={`payout_${value}`}>{label}</option>)}</select></label>
            <label htmlFor="payment-from">From date<input id="payment-from" className="isd-ui-input" type="date" value={from} onInput={(event) => setFrom(event.currentTarget.value)} onChange={(event) => setFrom(event.target.value)} aria-invalid={invalidRange} aria-describedby={invalidRange ? 'payment-date-error' : undefined} /></label>
            <label htmlFor="payment-to">To date<input id="payment-to" className="isd-ui-input" type="date" value={to} onInput={(event) => setTo(event.currentTarget.value)} onChange={(event) => setTo(event.target.value)} aria-invalid={invalidRange} aria-describedby={invalidRange ? 'payment-date-error' : undefined} /></label>
            <button type="button" className="isd-ui-button isd-ui-button-secondary" disabled={!type && !status && !from && !to} onClick={reset}>Clear filters</button>
        </div>
        {invalidRange && <p id="payment-date-error" role="alert">The from date must be on or before the to date.</p>}
        <p className="isd-history-result-count" role="status">Showing {filtered.length} of {entries.length} records</p>
        {filtered.length ? <ul className="isd-history-list">{filtered.map((entry) => <li key={entry.key} id={entry.request ? `withdrawal-record-${entry.request.id}` : undefined} tabIndex={entry.request ? -1 : undefined} className="isd-history-record isd-fisherman-anchor">
            <div className="isd-history-record-heading"><div><span className="isd-history-id">{entry.reference}</span><h4>{entry.title}</h4></div><strong>{entry.type === 'earnings' ? 'Earnings released' : entry.request.payout ? payoutStatuses[entry.request.payout.status] ?? entry.request.payout.status : requestStatuses[entry.status] ?? entry.status}</strong></div>
            <dl className="isd-history-facts">
                <div><dt>{entry.type === 'earnings' ? 'Order last updated' : 'Requested'}</dt><dd>{entry.date ? <time dateTime={entry.date.toISOString()}>{entry.date.toLocaleString()}</time> : 'Not recorded'}</dd></div>
                {entry.sale ? <><div><dt>Buyer</dt><dd>{entry.sale.buyer_name || 'Not recorded'}</dd></div><div><dt>Gross sale</dt><dd>{money(entry.sale.gross_price)}</dd></div><div><dt>Platform fee</dt><dd>{money(entry.sale.platform_fee)}</dd></div><div><dt>Net earnings</dt><dd>{money(entry.sale.net_payout)}</dd></div></> : <><div><dt>Requested amount</dt><dd>{money(entry.request.amount)}</dd></div>{entry.request.reviewed_at && <div><dt>Reviewed</dt><dd>{timestamp(entry.request.reviewed_at)?.toLocaleString() ?? 'Not recorded'}</dd></div>}{entry.request.review_note && <div><dt>Review reason</dt><dd className="whitespace-pre-wrap">{entry.request.review_note}</dd></div>}{entry.request.refund_transaction_id && <div><dt>Returned to your balance</dt><dd>{money(entry.request.amount)} · refund #{entry.request.refund_transaction_id}</dd></div>}</>}
            </dl>
            {entry.request?.payout && <dl className="isd-history-facts"><div><dt>Payout reference</dt><dd>{entry.request.payout.reference}</dd></div><div><dt>Mode</dt><dd>Simulation · no real money sent</dd></div>{entry.request.payout.paid_at && <div><dt>Simulated completion</dt><dd>{timestamp(entry.request.payout.paid_at)?.toLocaleString()}</dd></div>}{entry.request.payout.failure_reason && <div><dt>Failure reason</dt><dd>{entry.request.payout.failure_reason}</dd></div>}</dl>}
        </li>)}</ul> : <div className="isd-history-empty">{entries.length ? 'No payment records match these filters.' : 'Your completed sales and withdrawal requests will appear here.'}</div>}
        <p className="isd-fisherman-supporting isd-history-note">Dates use your device’s timezone. Simulation records are test results and do not confirm a real GCash payment.</p>
    </section>;
}
