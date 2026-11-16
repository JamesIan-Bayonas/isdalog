// File: isdalog/resources/js/Pages/Support/Index.jsx
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
function Reply({ request }) {
    const form=useForm({response:''});
    return <form className="mt-4 space-y-2" onSubmit={e=>{e.preventDefault();form.patch(route('support.resolve',request.id));}}>
        <label className="block">Response for request #{request.id}<textarea required minLength={10} maxLength={3000} className="isd-ui-input block w-full" value={form.data.response} onChange={e=>form.setData('response',e.target.value)} /></label>
        <p role="alert">{form.errors.response}</p><button disabled={form.processing} className="isd-ui-button isd-ui-button-primary">{form.processing?'Saving…':'Send response and close'}</button>
    </form>;
}
export default function Support({requests,isAdmin}) {
    const form=useForm({category:'account',subject:'',message:''}); const flash=usePage().props.flash;
    return <AuthenticatedLayout header={<h2 className="text-xl font-bold">Help & support</h2>}><Head title="Help & support" />
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 isd-text-primary">
            {flash?.success && <p role="status">{flash.success}</p>}
            <section className="isd-surface border isd-border rounded-xl p-5 space-y-3">
                <h1 className="text-xl font-bold">Find the right next step</h1>
                <p>For an order cancellation, delivery problem or refund review, <Link className="underline" href={route('orders.index')}>open the order in Orders & history</Link>. Support messages do not pause settlement or start a refund review.</p>
                <p>For role access, <Link className="underline" href={route('profile.edit')}>check your profile and account review</Link>. Review means an IsdaLog administrator has granted access. It does not certify identity, licensing, catch safety or freshness.</p>
                <p>Use this private channel for account help, technical problems or safety reports. Only you and IsdaLog administrators can read your requests. Do not include passwords, handover codes, payment secrets or identity document images. This is not an emergency service; replies are not immediate or guaranteed.</p>
            </section>
            <section className="isd-surface border isd-border rounded-xl p-5"><h2 className="text-lg font-bold">Send a support request</h2>
                <form onSubmit={e=>{e.preventDefault();form.post(route('support.store'),{onSuccess:()=>form.reset('subject','message')});}} className="space-y-3 mt-4">
                    <label className="block">Category<select className="isd-ui-input block w-full" value={form.data.category} onChange={e=>form.setData('category',e.target.value)}>{['account','technical','safety','other'].map(c=><option key={c}>{c}</option>)}</select></label>
                    <label className="block">Subject<input required minLength={5} maxLength={150} className="isd-ui-input block w-full" value={form.data.subject} onChange={e=>form.setData('subject',e.target.value)} /></label>
                    <label className="block">What happened, and what help do you need?<textarea required minLength={20} maxLength={3000} rows={5} className="isd-ui-input block w-full" value={form.data.message} onChange={e=>form.setData('message',e.target.value)} /></label>
                    {Object.entries(form.errors).map(([key,value])=><p role="alert" key={key}>{value}</p>)}
                    <button disabled={form.processing} className="isd-ui-button isd-ui-button-primary">{form.processing?'Sending…':'Send request'}</button>
                </form>
            </section>
            <h2 className="text-xl font-bold">{isAdmin?'Support review queue':'Your requests'}</h2>
            {!requests.data.length && <p>No support requests yet.</p>}
            {requests.data.map(r=><article key={r.id} className="isd-surface border isd-border rounded-xl p-5 space-y-2 break-words">
                <h3 className="font-bold">#{r.id} · {r.subject}</h3><p>{r.category} · {r.status} · {new Date(r.created_at).toLocaleString()}</p>
                <p>{isAdmin && r.submitted_by}</p><p className="whitespace-pre-wrap">{r.message}</p>
                {r.response && <div className="border-t isd-border pt-3"><h4 className="font-bold">Administrator response</h4><p className="whitespace-pre-wrap">{r.response}</p><p>{new Date(r.resolved_at).toLocaleString()}</p><p>If you need more help, send a new request referencing #{r.id}.</p></div>}
                {isAdmin && r.status==='open' && <Reply request={r} />}
            </article>)}
            <nav aria-label="Support pages" className="flex flex-wrap gap-3">{requests.prev_page_url && <Link href={requests.prev_page_url}>Previous</Link>}<span>Page {requests.current_page} of {requests.last_page}</span>{requests.next_page_url && <Link href={requests.next_page_url}>Next</Link>}</nav>
        </div>
    </AuthenticatedLayout>;
}
