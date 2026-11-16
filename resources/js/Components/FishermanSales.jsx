import { useState } from 'react';
import { DialogDescription, DialogTitle } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Modal from '@/Components/Modal';

const money = (value) => value == null ? '—' : `₱${Number(value).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const statuses = ['pending_dispatch', 'en_route', 'delivered', 'completed'];

function statusLabel(order) {
    if (order.status === 'pending_dispatch') return order.logistics_type === 'self_pickup' ? 'Awaiting buyer pickup' : 'Awaiting rider pickup';
    if (order.status === 'en_route') return order.logistics_type === 'self_pickup' ? 'Pickup in progress' : 'In transit';
    if (order.status === 'delivered') return 'Awaiting buyer confirmation';
    if (order.status === 'completed') return 'Payment released';
    return String(order.status || 'Status unavailable').replaceAll('_', ' ');
}

function SaleStatus({ order }) {
    return <span className={`isd-sale-status${order.status === 'completed' ? ' isd-sale-status-complete' : ''}`}>{statusLabel(order)}</span>;
}

function statusNote(order) {
    if (order.status === 'pending_dispatch') {
        if (order.logistics_type === 'self_pickup') return 'Prepare the catch for the buyer’s pickup.';
        return order.pickup_otp ? 'Prepare the catch for rider pickup. The pickup code is below.' : 'Prepare the catch for rider pickup.';
    }
    if (order.status === 'en_route') return order.logistics_type === 'self_pickup' ? 'Pickup is in progress. Payment has not been released.' : 'The catch is in transit. Payment has not been released.';
    if (order.status === 'delivered') return 'Delivered. The buyer must confirm delivery before payment is released to your wallet.';
    if (order.status === 'completed') return 'Your net proceeds have been released to your wallet.';
    return 'Check the recorded status for this sale.';
}

function PickupCode({ order }) {
    // Match the existing Fisherman ledger's exact visibility condition.
    return order.status === 'pending_dispatch' && order.pickup_otp ? (
        <p className="isd-sale-code">Pickup code <strong>{order.pickup_otp}</strong></p>
    ) : null;
}

export default function FishermanSales({ salesHistory }) {
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const orders = salesHistory ?? [];
    // Resolve from the current props so a refreshed order never leaves stale details open.
    const selected = orders.find((order) => order.order_id === selectedOrderId);
    const isReleased = selected?.status === 'completed';

    return (
        <section id="fisherman-sales" tabIndex={-1} className="isd-sales isd-fisherman-anchor" aria-labelledby="fisherman-sales-heading">
            <div className="isd-sales-heading">
                <div><h3 id="fisherman-sales-heading">Sales and escrow</h3><p className="isd-fisherman-supporting">Follow each handover and see when your proceeds are released.</p></div>
                <span className="isd-sale-fee-note">Platform fee: 3%</span>
            </div>
            {orders.length === 0 ? <p className="isd-sales-empty">No sales recorded yet. Accepted offers will appear here.</p> : (
                <div className="isd-sales-scroll" role="region" aria-label="Sales and escrow ledger" tabIndex={0}>
                    <table className="isd-sales-table" role="table">
                        <caption className="sr-only">Your sales, pickup information, and net proceeds. Open sale details for the full payment breakdown.</caption>
                        <thead role="rowgroup"><tr role="row">{['Order', 'Catch', 'Weight', 'Gross sale', 'Fee (3%)', 'Net proceeds (97%)', 'Buyer', 'Status', 'Details'].map((label) => <th key={label} scope="col" role="columnheader">{label}</th>)}</tr></thead>
                        <tbody role="rowgroup">
                            {orders.map((order) => (
                                <tr key={order.order_id} id={`fisherman-sale-${order.order_id}`} tabIndex={-1} role="row" className="isd-fisherman-anchor">
                                    <td role="cell" className="isd-sale-id"><span className="isd-sale-mobile-label">Order</span>#{order.order_id}</td>
                                    <td role="cell" className="isd-sale-catch"><span className="isd-sale-mobile-label">Catch</span><strong>{order.fish_name}</strong></td>
                                    <td role="cell" className="isd-sale-weight"><span className="isd-sale-mobile-label">Weight</span>{order.weight_kg} kg</td>
                                    <td role="cell" className="isd-sale-gross"><span className="isd-sale-mobile-label">Gross sale</span>{money(order.gross_price ?? order.final_price)}</td>
                                    <td role="cell" className="isd-sale-fee"><span className="isd-sale-mobile-label">Fee (3%)</span>{order.platform_fee == null ? '—' : `−${money(order.platform_fee)}`}</td>
                                    <td role="cell" className="isd-sale-net"><span className="isd-sale-mobile-label">Net proceeds (97%)</span><strong>{money(order.net_payout ?? order.seller_earnings)}</strong><small>{order.status === 'completed' ? 'Released to wallet' : 'Expected · not yet released'}</small></td>
                                    <td role="cell" className="isd-sale-buyer"><span className="isd-sale-mobile-label">Buyer</span>{order.buyer_name || 'Not provided'}</td>
                                    <td role="cell" className="isd-sale-state"><SaleStatus order={order} /><PickupCode order={order} /></td>
                                    <td role="cell" className="isd-sale-details-action"><button type="button" className="isd-ui-button isd-ui-button-secondary" aria-haspopup="dialog" aria-label={`View details for sale ${order.order_id}`} onClick={() => setSelectedOrderId(order.order_id)}>View sale details</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal show={Boolean(selected)} onClose={() => setSelectedOrderId(null)} maxWidth="2xl">
                {selected && <div className="isd-sale-dialog">
                    <div className="isd-catch-dialog-heading">
                        <div><p className="isd-catch-eyebrow">Sale #{selected.order_id} · Auction #{selected.listing_id}</p><DialogTitle as="h3">{selected.fish_name}</DialogTitle></div>
                        <button type="button" className="isd-catch-close" aria-label="Close sale details" onClick={() => setSelectedOrderId(null)}><XMarkIcon aria-hidden="true" /></button>
                    </div>
                    <DialogDescription className="isd-fisherman-supporting">Pickup information, recorded progress, and your payment breakdown for this sale.</DialogDescription>
                    <SaleStatus order={selected} />
                    {statuses.includes(selected.status) && <ol className="isd-sale-progress" aria-label="Sale stages; highlighted stage is the current recorded status">
                        {statuses.map((status, index) => <li key={status} aria-current={selected.status === status ? 'step' : undefined}><span aria-hidden="true">{index + 1}</span><span>{statusLabel({ ...selected, status })}</span></li>)}
                    </ol>}
                    <p className="isd-sale-next-step">{statusNote(selected)}</p>
                    <section aria-label="Pickup and people">
                        <h4>Pickup and people</h4>
                        <dl className="isd-sale-facts">
                            <div><dt>Fulfillment</dt><dd>{selected.logistics_type === 'self_pickup' ? 'Buyer self-pickup' : selected.logistics_type === 'request_rider' ? 'Rider delivery' : 'Not provided'}</dd></div>
                            <div><dt>Landing location</dt><dd>{selected.location || 'Not provided'}</dd></div>
                            <div><dt>Batch weight</dt><dd>{selected.weight_kg} kg</dd></div>
                            <div><dt>Buyer</dt><dd>{selected.buyer_name || 'Not provided'}</dd></div>
                            {selected.buyer_contact && <div><dt>Buyer contact</dt><dd>{selected.buyer_contact}</dd></div>}
                            {selected.logistics_type === 'request_rider' && <div><dt>Rider</dt><dd>{selected.rider_name || 'Not assigned'}</dd></div>}
                            {selected.logistics_type === 'request_rider' && selected.rider_contact && <div><dt>Rider contact</dt><dd>{selected.rider_contact}</dd></div>}
                        </dl>
                        <PickupCode order={selected} />
                    </section>
                    <section aria-label="Payment breakdown">
                        <h4>Payment breakdown</h4>
                        <dl className="isd-catch-offer-summary">
                            <div><dt>Gross sale · batch total</dt><dd>{money(selected.gross_price ?? selected.final_price)}</dd></div>
                            <div><dt>Platform fee (3%)</dt><dd>{selected.platform_fee == null ? '—' : `−${money(selected.platform_fee)}`}</dd></div>
                            <div><dt>{isReleased ? 'Net proceeds released (97%)' : 'Expected net proceeds (97%)'}</dt><dd className="isd-sale-net-value">{money(selected.net_payout ?? selected.seller_earnings)}</dd></div>
                            <div><dt>Payment state</dt><dd>{isReleased ? 'Released to wallet' : 'Not yet released'}</dd></div>
                        </dl>
                        <p className="isd-fisherman-supporting">{isReleased ? 'This sale’s proceeds are separate from your current available balance, which may include other sales and withdrawals.' : 'Expected proceeds are not yet available for withdrawal.'}</p>
                    </section>
                    <div className="isd-sale-dialog-actions"><button type="button" className="isd-ui-button isd-ui-button-secondary" onClick={() => setSelectedOrderId(null)}>Back to sales</button></div>
                </div>}
            </Modal>
        </section>
    );
}
