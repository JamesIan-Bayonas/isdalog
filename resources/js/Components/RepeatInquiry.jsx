// File: isdalog/resources/js/Components/RepeatInquiry.jsx
import { useForm } from '@inertiajs/react';

export default function RepeatInquiry({ orderId, inquiry, canAsk, canReply }) {
    const form = useForm({ message: '', reply: '' });
    if (!inquiry && !canAsk) return null;

    const field = canReply ? 'reply' : 'message';

    function submit(event) {
        event.preventDefault();
        const options = { preserveScroll: true, onSuccess: () => form.reset() };
        if (canReply) {
            form.patch(route('orders.repeat.reply', orderId), options);
        } else {
            form.post(route('orders.repeat.store', orderId), options);
        }
    }

    return <section className="isd-surface border isd-border rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-bold isd-text-primary">Ask about buying again</h2>
        <p className="isd-text-secondary">Ask the original seller about current stock, price and pickup or delivery options. Any purchase requires a new listing and checkout.</p>
        {inquiry && <div className="space-y-3 isd-text-primary">
            <p className="font-semibold">Buyer inquiry</p>
            <p className="whitespace-pre-wrap break-words">{inquiry.message}</p>
            {inquiry.replied_at ? <>
                <p className="font-semibold">Seller reply</p>
                <p className="whitespace-pre-wrap break-words">{inquiry.reply}</p>
            </> : <p role="status">Awaiting seller reply.</p>}
        </div>}
        {(canAsk || canReply) && <form onSubmit={submit} className="space-y-3">
            <label className="block isd-text-primary">{canReply ? 'Reply to the buyer' : 'Message to the seller'}
                <textarea className="isd-ui-input block w-full mt-1" rows={3} maxLength={1000} required
                    value={form.data[field]} onChange={event => form.setData(field, event.target.value)} />
            </label>
            {form.errors[field] && <p role="alert">{form.errors[field]}</p>}
            <button className="isd-ui-button isd-ui-button-primary" disabled={form.processing}>
                {form.processing ? 'Sending…' : canReply ? 'Send reply' : 'Send inquiry'}
            </button>
        </form>}
    </section>;
}
