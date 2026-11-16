// File: isdalog/resources/js/Pages/Catches/Show.jsx
import { Head, Link } from '@inertiajs/react';
import FavoriteButton from '@/Components/FavoriteButton';
import MarketBenchmark from '@/Components/MarketBenchmark';
import OrderTrace from '@/Components/OrderTrace';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
export default function Show({ listing, provenance, benchmark, trace, isFavorite }) {
    const [failed, setFailed] = useState(false);
    const money = value => new Intl.NumberFormat('en-PH', {style:'currency',currency:'PHP'}).format(value);
    return <AuthenticatedLayout header={<h1 className="text-xl font-bold isd-text-primary">Catch details</h1>}>
        <Head title={`${listing.fish_name} — Catch details`} />
        <article className="max-w-4xl mx-auto px-4 py-8 space-y-6">
            <Link href={route('marketplace.index')} className="isd-text-brand underline">Back to marketplace</Link>
            <section className="isd-surface border isd-border rounded-2xl p-6 space-y-4">
                <p className="text-sm isd-text-muted">Batch #{listing.id} · {listing.available ? 'Available for offers' : 'Closed or unavailable'}</p>
                <h2 className="text-2xl font-bold isd-text-primary">{listing.fish_name}</h2>
                {listing.image_url && !failed ? <img src={listing.image_url} alt={`Seller photo of ${listing.fish_name}`} onError={()=>setFailed(true)} className="w-full max-h-80 object-contain rounded-xl" /> : <p className="isd-text-muted">Catch photo unavailable.</p>}
                <dl className="grid sm:grid-cols-2 gap-4 isd-text-primary">{[['Seller',listing.seller],['Landing port',listing.location],['Batch weight',`${listing.weight_kg} kg`],['Current batch offer',money(listing.current_bid)],['Price per kilogram',Number(listing.weight_kg)>0 ? money(Number(listing.current_bid)/Number(listing.weight_kg))+'/kg' : 'Unavailable'],['Offer deadline',listing.ends_at ? new Date(listing.ends_at).toLocaleString('en-PH',{timeZone:'Asia/Manila',timeZoneName:'short'}) : 'No deadline recorded']].map(([name,value])=><div key={name}><dt className="text-sm isd-text-muted">{name}</dt><dd className="font-semibold break-words">{value}</dd></div>)}</dl>
                <FavoriteButton listingId={listing.id} saved={isFavorite} />
                {listing.available && <Link href={route('marketplace.index',{q:listing.fish_name,port:listing.location})} className="inline-block rounded-xl isd-action isd-on-action px-5 py-3">Find this catch in the marketplace</Link>}
            </section>
            <MarketBenchmark benchmark={benchmark} />
            <OrderTrace trace={trace} />
            <section className="isd-surface border isd-border rounded-2xl p-6 space-y-3">
                <h2 className="text-lg font-bold isd-text-primary">Recorded provenance</h2>
                {provenance ? <><p className="isd-text-secondary">Linked catch record #{provenance.record_id}: {provenance.species}, {provenance.weight} kg, {provenance.location}.</p><p className="text-sm isd-text-muted">Logged {provenance.logged_at ? new Date(provenance.logged_at).toLocaleString() : 'at an unknown time'}. This is the logging time, not a verified harvest or landing time. Listing details can differ after permitted edits.</p></> : <p className="isd-text-secondary">No explicitly linked catch record is available for this listing. Historical provenance has not been inferred.</p>}
                <p className="text-sm isd-text-muted">Fish identity, photograph and landing location are seller-provided. Harvest time, storage method and temperature history are not recorded here. This page does not certify freshness, handling or regulatory clearance.</p>
            </section>
        </article>
    </AuthenticatedLayout>;
}
