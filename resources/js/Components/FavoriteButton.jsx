// File: isdalog/resources/js/Components/FavoriteButton.jsx
import { useForm } from '@inertiajs/react';

export default function FavoriteButton({ listingId, saved }) {
    const form = useForm({ saved: false });

    function toggle() {
        form.transform(() => ({ saved: !saved }));
        form.put(route('saved.favorite', listingId), { preserveScroll: true });
    }

    return <div>
        <button type="button" onClick={toggle} disabled={form.processing} aria-pressed={Boolean(saved)}
            className="isd-ui-button disabled:opacity-50">
            {form.processing ? 'Updating…' : saved ? 'Remove favorite' : 'Save favorite'}
        </button>
        {form.errors.saved && <p role="alert">{form.errors.saved}</p>}
    </div>;
}
