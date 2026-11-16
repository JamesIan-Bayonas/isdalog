import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import InputError from '@/Components/InputError';
import { DialogTitle, DialogDescription } from '@headlessui/react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

const statuses = { pending: 'Pending review', approved: 'Approved · awaiting payout', rejected: 'Rejected' };
const payoutLabel = (payout) => `Simulation · ${{ processing: 'processing', paid: 'completed', failed: 'failed · refunded' }[payout.status] ?? payout.status}`;
const money = (value) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);
function date(value) {
    if (!value) return 'Not recorded';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? 'Not recorded' : parsed.toLocaleString();
}

export default function Withdrawals({ withdrawals, filters, sandboxPayouts = false }) {
    const { flash } = usePage().props;
    const [selected, setSelected] = useState(null);
    const [payoutSelection, setPayoutSelection] = useState(null);
    const payoutForm = useForm({ outcome: '' });
    const openPayout = (record, action) => { payoutForm.clearErrors(); payoutForm.setData('outcome', action); setPayoutSelection({ record, action }); };
    const closePayout = () => { if (!payoutForm.processing) setPayoutSelection(null); };
    const submitPayout = (event) => {
        event.preventDefault();
        if (!payoutSelection || payoutForm.processing) return;
        payoutForm.post(route(payoutSelection.action === 'start' ? 'admin.withdrawals.payout' : 'admin.withdrawals.simulate', payoutSelection.record.id), { preserveScroll: true, onSuccess: () => setPayoutSelection(null) });
    };
    const { data, setData, patch, processing, errors, reset, clearErrors } = useForm({ decision: '', review_note: '' });
    const close = () => { if (!processing) setSelected(null); };
    const open = (record) => { reset(); clearErrors(); setSelected(record); };
    const submit = (event) => {
        event.preventDefault();
        if (!selected || processing) return;
        patch(route('admin.withdrawals.review', selected.id), { preserveScroll: true, onSuccess: () => setSelected(null) });
    };

    return <AuthenticatedLayout header={<h2 className="text-xl font-semibold isd-text-primary">Withdrawal review</h2>}>
        <Head title="Withdrawal review" />
        <div className="isd-withdrawal-review max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
            <div className="isd-catch-history">
                <div className="isd-fisherman-section-heading"><div><h3>Review reserved withdrawal funds</h3><p className="isd-fisherman-supporting">Approve a request for payout, or reject it and return the reserved amount.</p></div><Link href={route('dashboard')} className="isd-history-back">Back to dashboard</Link></div>
                <p className="isd-fisherman-supporting">Approval does not send money or confirm payment. Review notes are visible to the fisherman. Decisions cannot be changed here.</p>
                <p className="isd-review-feedback">{sandboxPayouts ? 'GCash simulation mode. Test completion and failure recovery without sending real money.' : 'Live GCash payouts are not configured. Payout actions are disabled.'}</p>
                {flash?.success && <p className="isd-review-feedback" role="status">{flash.success}</p>}
                <div className="isd-review-filter"><label htmlFor="withdrawal-status">Review status</label><select id="withdrawal-status" className="isd-ui-input" value={filters.status} onChange={(event) => router.get(route('admin.withdrawals.index'), { status: event.target.value }, { replace: true, preserveScroll: true })}>
                    <option value="pending">Pending review</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="all">All requests</option>
                </select></div>
                <p className="isd-history-result-count" role="status">{withdrawals.total} matching {withdrawals.total === 1 ? 'request' : 'requests'} · page {withdrawals.current_page} of {withdrawals.last_page}</p>
                {withdrawals.data.length ? <ul className="isd-history-list">{withdrawals.data.map((record) => <li key={record.id} className="isd-history-record">
                    <div className="isd-history-record-heading"><div><p className="isd-history-id">Request #{record.id}</p><h4>{record.user?.name || 'Account unavailable'}</h4></div><strong>{record.payout ? payoutLabel(record.payout) : statuses[record.status] ?? record.status}</strong></div>
                    <dl className="isd-history-facts">
                        <div><dt>Requested amount</dt><dd>{money(record.amount)}</dd></div>
                        <div><dt>Destination</dt><dd>{record.payment_method === 'gcash' ? 'GCash' : 'Maya'} · {record.account_number}</dd></div>
                        <div><dt>Account holder</dt><dd>{record.account_name}</dd></div>
                        <div><dt>Requested</dt><dd>{date(record.created_at)}</dd></div>
                        {record.reviewed_at && <><div><dt>Reviewed</dt><dd>{date(record.reviewed_at)}</dd></div><div><dt>Reviewed by</dt><dd>{record.reviewer_name || 'Not recorded'}</dd></div><div><dt>Review note</dt><dd className="whitespace-pre-wrap">{record.review_note}</dd></div></>}
                        {record.refund_transaction_id && <div><dt>Refund record</dt><dd>Transaction #{record.refund_transaction_id} · {money(record.amount)} returned</dd></div>}
                        {record.payout && <><div><dt>Payout reference</dt><dd>{record.payout.reference}</dd></div><div><dt>Simulation reference</dt><dd>{record.payout.provider_reference}</dd></div>{record.payout.paid_at && <div><dt>Simulated completion</dt><dd>{date(record.payout.paid_at)}</dd></div>}{record.payout.failed_at && <><div><dt>Simulation failed</dt><dd>{date(record.payout.failed_at)}</dd></div><div><dt>Failure reason</dt><dd>{record.payout.failure_reason}</dd></div></>}</>}
                    </dl>
                    {record.status === 'pending' && <button type="button" className="isd-ui-button isd-ui-button-primary isd-review-action" onClick={() => open(record)} aria-label={`Review request ${record.id}`}>Review request</button>}
                    {record.status === 'approved' && !record.payout && !record.refund_transaction_id && record.payment_method === 'gcash' && <button type="button" disabled={!sandboxPayouts} className="isd-ui-button isd-ui-button-primary isd-review-action" onClick={() => openPayout(record, 'start')} aria-label={`Start GCash simulation for request ${record.id}`}>Start GCash simulation</button>}
                    {sandboxPayouts && record.payout?.mode === 'sandbox' && record.payout.status === 'processing' && <div className="isd-review-pagination"><button type="button" className="isd-ui-button isd-ui-button-secondary" onClick={() => openPayout(record, 'paid')} aria-label={`Simulate completion for request ${record.id}`}>Simulate completion</button><button type="button" className="isd-ui-button isd-ui-button-danger" onClick={() => openPayout(record, 'failed')} aria-label={`Simulate failure for request ${record.id}`}>Simulate failure & refund</button></div>}
                </li>)}</ul> : <div className="isd-history-empty">No withdrawal requests match this status.</div>}
                <nav aria-label="Withdrawal pages" className="isd-review-pagination">
                    {withdrawals.prev_page_url && <Link className="isd-ui-button isd-ui-button-secondary" href={withdrawals.prev_page_url}>Previous page</Link>}
                    {withdrawals.next_page_url && <Link className="isd-ui-button isd-ui-button-secondary" href={withdrawals.next_page_url}>Next page</Link>}
                </nav>
                <p className="isd-fisherman-supporting isd-history-note">Dates use your device’s timezone.</p>
            </div>
        </div>
        <Modal show={Boolean(selected)} onClose={close} maxWidth="lg">
            <form onSubmit={submit} className="isd-review-dialog" aria-busy={processing}>
                <div className="isd-fisherman-section-heading"><DialogTitle as="h3">Review request #{selected?.id}</DialogTitle><button type="button" className="isd-ui-button isd-ui-button-secondary" disabled={processing} onClick={close} aria-label="Close withdrawal review">Close</button></div>
                <DialogDescription>{selected?.user?.name} requested {money(selected?.amount ?? 0)} to {selected?.payment_method === 'gcash' ? 'GCash' : 'Maya'} · {selected?.account_number}. Account holder: {selected?.account_name}. Verify the destination before deciding.</DialogDescription>
                <label htmlFor="withdrawal-decision">Decision</label>
                <select id="withdrawal-decision" className="isd-ui-input" required disabled={processing} value={data.decision} onChange={(event) => setData('decision', event.target.value)} aria-invalid={Boolean(errors.decision)} aria-describedby="withdrawal-decision-help withdrawal-decision-error">
                    <option value="">Choose a decision</option><option value="approved">Approve for payout</option><option value="rejected">Reject and refund reserved funds</option>
                </select>
                <p id="withdrawal-decision-help" className="isd-fisherman-supporting">{data.decision === 'rejected' ? `This returns ${money(selected?.amount ?? 0)} to the fisherman’s available balance once.` : 'Approval leaves the funds reserved. No money is sent to the provider.'}</p>
                <InputError id="withdrawal-decision-error" message={errors.decision} />
                <label htmlFor="withdrawal-review-note">Reason for the fisherman</label>
                <textarea id="withdrawal-review-note" className="isd-ui-input" rows={3} required maxLength={500} disabled={processing} value={data.review_note} onChange={(event) => setData('review_note', event.target.value)} aria-invalid={Boolean(errors.review_note)} aria-describedby="withdrawal-note-error" />
                <InputError id="withdrawal-note-error" message={errors.review_note} />
                <div className="isd-review-pagination"><button type="button" className="isd-ui-button isd-ui-button-secondary" disabled={processing} onClick={close}>Cancel</button><button type="submit" className={`isd-ui-button ${data.decision === 'rejected' ? 'isd-ui-button-danger' : 'isd-ui-button-primary'}`} disabled={processing || !data.decision}>{processing ? 'Recording decision…' : data.decision === 'rejected' ? 'Confirm rejection & refund' : 'Confirm approval'}</button></div>
            </form>
        </Modal>
        <Modal show={Boolean(payoutSelection)} onClose={closePayout} maxWidth="lg">
            <form onSubmit={submitPayout} className="isd-review-dialog" aria-busy={payoutForm.processing}>
                <DialogTitle as="h3">GCash simulation · request #{payoutSelection?.record.id}</DialogTitle>
                <DialogDescription>{money(payoutSelection?.record.amount ?? 0)} · {payoutSelection?.record.user?.name}. No real GCash transfer will occur.</DialogDescription>
                <p>{payoutSelection?.action === 'start' ? 'Create a tracked simulation. Funds remain reserved until a completion or failure result is recorded.' : payoutSelection?.action === 'failed' ? 'Record a simulated failure and return the reserved amount to the fisherman’s available balance once.' : 'Record a simulated completion. Reserved funds will not be returned; the history will label this as a simulation.'}</p>
                <InputError message={payoutForm.errors.payout || payoutForm.errors.outcome} />
                <div className="isd-review-pagination"><button type="button" className="isd-ui-button isd-ui-button-secondary" disabled={payoutForm.processing} onClick={closePayout}>Cancel</button><button type="submit" className="isd-ui-button isd-ui-button-primary" disabled={payoutForm.processing}>{payoutForm.processing ? 'Recording…' : 'Confirm simulation'}</button></div>
            </form>
        </Modal>
    </AuthenticatedLayout>;
}
