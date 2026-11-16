// File: isdalog/resources/js/Pages/Catches/Manage.jsx
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import InputError from '@/Components/InputError';
import { DialogDescription, DialogTitle } from '@headlessui/react';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

const labels = { fish_name: 'Fish name', weight_kg: 'Weight (kg)', starting_price: 'Starting batch price (₱)', location: 'Landing location', availability: 'Availability' };
const money = (value) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);
const time = (value) => {
    const text = String(value).replace(' ', 'T');
    return new Date(/(?:Z|[+-]\d{2}:?\d{2})$/.test(text) ? text : `${text}Z`).toLocaleString();
};
const availability = (listing) => listing.withdrawn_at ? 'Withdrawn' : listing.status !== 'active' || listing.orders_exists ? 'Sold' : listing.expired_at || (listing.ends_at && Date.parse(listing.ends_at) <= Date.now()) ? 'Expired' : listing.bids_count > 0 ? 'Bidding' : 'Available';

export default function Manage({ listings, selectedListing, flash }) {
    const [selection, setSelection] = useState(null);
    const form = useForm({ fish_name: '', weight_kg: '', starting_price: '', location: '', management_version: 0, reason: '' });
    const open = (listing, mode) => {
        form.clearErrors();
        form.setData({ fish_name: listing.fish_name, weight_kg: String(listing.weight_kg), starting_price: String(listing.starting_price), location: listing.location, management_version: listing.management_version, reason: '' });
        setSelection({ listing, mode });
    };
    const close = () => { if (!form.processing) setSelection(null); };
    const submit = (event) => {
        event.preventDefault();
        const options = { preserveScroll: true, onSuccess: () => setSelection(null) };
        if (selection.mode === 'edit') form.patch(route('catches.update', selection.listing.id), options);
        else form.post(route('catches.withdraw', selection.listing.id), options);
    };

    return <AuthenticatedLayout header={<h2 className="text-xl font-semibold isd-text-primary">Catch management</h2>}>
        <Head title="Catch management" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <section className="isd-catch-history isd-catch-management" aria-labelledby="catch-management-heading">
                <div className="isd-fisherman-section-heading"><div><h3 id="catch-management-heading">Manage your catch listings</h3><p className="isd-fisherman-supporting">Edit or withdraw available listings before a buyer bids or places an order. Original catch records remain unchanged.</p></div><Link href={route('dashboard')} className="isd-history-back">Back to dashboard</Link></div>
                {flash?.success && <p role="status" className="isd-review-feedback">{flash.success}</p>}
                {selectedListing && <p className="isd-fisherman-supporting">Showing selected listing. <Link className="isd-history-back" href={route('catches.index')}>View all your listings</Link></p>}
                <p className="isd-history-result-count">{listings.total} {selectedListing ? 'matching' : 'owned'} {listings.total === 1 ? 'listing' : 'listings'}</p>
                {listings.data.length ? <ul className="isd-history-list">{listings.data.map((listing) => {
                    const state = availability(listing);
                    const editable = state === 'Available';
                    return <li key={listing.id} className="isd-history-record">
                        <div className="isd-history-record-heading"><div><p className="isd-history-id">Listing #{listing.id}</p><h4>{listing.fish_name}</h4></div><strong>{state}</strong></div>
                        <dl className="isd-history-facts"><div><dt>Batch weight</dt><dd>{listing.weight_kg} kg</dd></div><div><dt>Starting batch price</dt><dd>{money(listing.starting_price)}</dd></div><div><dt>Landing location</dt><dd>{listing.location}</dd></div><div><dt>Buyer bids</dt><dd>{listing.bids_count}</dd></div></dl>
                        {listing.withdrawn_at && <p className="isd-notification-message">Withdrawn {time(listing.withdrawn_at)} · {listing.withdrawn_reason}</p>}
                        {editable ? <div className="isd-review-pagination"><button type="button" className="isd-ui-button isd-ui-button-primary" onClick={() => open(listing, 'edit')} aria-label={`Edit listing ${listing.id}`}>Edit details</button><button type="button" className="isd-ui-button isd-ui-button-danger" onClick={() => open(listing, 'withdraw')} aria-label={`Withdraw listing ${listing.id}`}>Withdraw listing</button></div> : <p className="isd-fisherman-supporting isd-history-note">{state === 'Bidding' ? 'Buyer bids protect this listing from edits and withdrawal.' : state === 'Withdrawn' ? 'This listing is no longer offered in the marketplace.' : 'An awarded or ordered catch cannot be edited or withdrawn.'}</p>}
                        <details className="isd-listing-history"><summary>Recent changes · {listing.activities_count}</summary>
                            {listing.activities.length ? <><p className="isd-fisherman-supporting">Latest {listing.activities.length} of {listing.activities_count} changes. Times use your device’s timezone.</p><ol>{listing.activities.map((activity) => <li key={activity.id}><strong>{activity.action === 'edited' ? 'Listing edited' : activity.action === 'expired' ? 'Auction expired' : 'Listing withdrawn'}</strong> · <time dateTime={activity.created_at}>{new Date(activity.created_at).toLocaleString()}</time>{Object.entries(activity.after_values).filter(([field, value]) => activity.before_values[field] !== value).map(([field, value]) => <p key={field}>{labels[field] ?? field}: {String(activity.before_values[field])} → {String(value)}</p>)}{activity.reason && <p>Reason: {activity.reason}</p>}</li>)}</ol></> : <p className="isd-fisherman-supporting">No management changes recorded yet.</p>}
                        </details>
                    </li>;
                })}</ul> : <div className="isd-history-empty">No catch listings to show. Record a catch through Telegram to create a listing.</div>}
                <nav className="isd-review-pagination" aria-label="Catch listing pages">{listings.prev_page_url && <Link href={listings.prev_page_url} className="isd-ui-button isd-ui-button-secondary">Previous page</Link>}{listings.next_page_url && <Link href={listings.next_page_url} className="isd-ui-button isd-ui-button-secondary">Next page</Link>}</nav>
            </section>
        </div>
        <Modal show={Boolean(selection)} onClose={close} maxWidth="lg">
            <form className="isd-review-dialog" onSubmit={submit} aria-busy={form.processing}>
                <DialogTitle as="h3">{selection?.mode === 'edit' ? 'Edit catch listing' : 'Withdraw catch listing'}</DialogTitle>
                <DialogDescription>Listing #{selection?.listing.id} · {selection?.listing.fish_name}. {selection?.mode === 'edit' ? 'Prices apply to the whole batch.' : 'This removes the unsold listing from the marketplace and retains its history.'}</DialogDescription>
                <InputError message={form.errors.listing} />
                {selection?.mode === 'edit' ? Object.entries(labels).filter(([field]) => field !== 'availability').map(([field, label]) => <div key={field}><label htmlFor={`catch-edit-${field}`}>{label}</label><input id={`catch-edit-${field}`} className="isd-ui-input" type={['weight_kg', 'starting_price'].includes(field) ? 'number' : 'text'} step={['weight_kg', 'starting_price'].includes(field) ? '0.01' : undefined} min={field === 'weight_kg' ? '0.1' : field === 'starting_price' ? '1' : undefined} maxLength={255} required disabled={form.processing} value={form.data[field]} onChange={(event) => form.setData(field, event.target.value)} aria-invalid={Boolean(form.errors[field])} aria-describedby={`catch-error-${field}`} /><InputError id={`catch-error-${field}`} message={form.errors[field]} /></div>) : <div><label htmlFor="catch-withdraw-reason">Reason for withdrawal</label><textarea id="catch-withdraw-reason" className="isd-ui-input" rows={3} maxLength={500} required disabled={form.processing} value={form.data.reason} onChange={(event) => form.setData('reason', event.target.value)} aria-invalid={Boolean(form.errors.reason)} aria-describedby="catch-error-reason" /><InputError id="catch-error-reason" message={form.errors.reason} /></div>}
                <div className="isd-review-pagination"><button type="button" className="isd-ui-button isd-ui-button-secondary" disabled={form.processing} onClick={close}>Cancel</button><button type="submit" className={`isd-ui-button ${selection?.mode === 'withdraw' ? 'isd-ui-button-danger' : 'isd-ui-button-primary'}`} disabled={form.processing}>{form.processing ? 'Saving…' : selection?.mode === 'edit' ? 'Save listing changes' : 'Confirm withdrawal'}</button></div>
            </form>
        </Modal>
    </AuthenticatedLayout>;
}
