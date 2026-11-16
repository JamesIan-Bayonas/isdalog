// File: isdalog/resources/js/Pages/SavedDiscovery.jsx
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FavoriteButton from '@/Components/FavoriteButton';
import { Head, Link, useForm } from '@inertiajs/react';

function Pages({ page, label }) {
    return <nav aria-label={label} className="flex gap-4">
        {page.prev_page_url && <Link href={page.prev_page_url} preserveScroll>Previous</Link>}
        <span>Page {page.current_page} of {page.last_page}</span>
        {page.next_page_url && <Link href={page.next_page_url} preserveScroll>Next</Link>}
    </nav>;
}

function SavedSearch({ search }) {
    const form = useForm({});
    return <article className="isd-surface border isd-border rounded-xl p-4 space-y-2">
        <h3 className="font-bold break-words">{search.name}</h3>
        <p className="break-words">{[search.filters.q, search.filters.port].filter(Boolean).join(' · ') || 'Any species or port'}</p>
        <div className="flex flex-wrap gap-3 items-center">
            <Link className="underline" href={route('marketplace.index', search.filters)}>Run search</Link>
            <button type="button" className="isd-ui-button" disabled={form.processing}
                onClick={() => form.delete(route('saved.search.destroy', search.id), { preserveScroll: true })}>
                Remove search
            </button>
        </div>
    </article>;
}

export default function SavedDiscovery({ favorites, searches }) {
    return <AuthenticatedLayout header={<h1 className="text-xl font-bold isd-text-primary">Saved discovery</h1>}>
        <Head title="Saved discovery" />
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 isd-text-primary">
            <Link className="underline" href={route('marketplace.index')}>Back to marketplace</Link>
            <section className="space-y-3">
                <h2 className="text-lg font-bold">Favorite listings</h2>
                <p>Bookmarks are separate from the bid watchlist. Check the catch page for current availability.</p>
                {!favorites.data.length && <p>Save a listing from the marketplace or its catch page.</p>}
                {favorites.data.map(listing => <article key={listing.id} className="isd-surface border isd-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0 break-words">
                        <Link className="font-bold underline" href={route('catches.show', listing.id)}>{listing.fish_name}</Link>
                        <p>{listing.location} · {Number(listing.available) ? 'Open for offers' : 'Closed or unavailable'}</p>
                    </div>
                    <FavoriteButton listingId={listing.id} saved />
                </article>)}
                {(favorites.last_page > 1 || favorites.current_page > 1) && <Pages page={favorites} label="Favorite listing pages" />}
            </section>
            <section className="space-y-3">
                <h2 className="text-lg font-bold">Saved searches</h2>
                <p>Run a saved search whenever you want to check current listings.</p>
                {!searches.data.length && <p>Apply filters in the marketplace and save the search under a name.</p>}
                {searches.data.map(search => <SavedSearch key={search.id} search={search} />)}
                {(searches.last_page > 1 || searches.current_page > 1) && <Pages page={searches} label="Saved search pages" />}
            </section>
        </div>
    </AuthenticatedLayout>;
}
