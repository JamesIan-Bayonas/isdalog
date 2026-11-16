// File: isdalog/resources/js/Pages/Orders/Index.jsx
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
const labels={pending_dispatch:'Awaiting handover',en_route:'In transit',delivered:'Awaiting buyer confirmation',completed:'Completed',cancelled:'Cancelled — refunded',refunded:'Reviewed refund'};
export default function Index({orders,status}) {
    return <AuthenticatedLayout header={<h1 className="text-xl font-bold isd-text-primary">Orders & history</h1>}><Head title="Orders & history"/>
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
            <nav aria-label="Order filters" className="flex gap-3 flex-wrap">{[['active','In progress'],['completed','Closed history'],['all','All orders']].map(([key,label])=><Link key={key} href={route('orders.index',{status:key})} aria-current={status===key?'page':undefined} className={`rounded-xl border isd-border px-4 py-3 ${status===key?'isd-action isd-on-action':'isd-surface isd-text-primary'}`}>{label}</Link>)}</nav>
            <p className="isd-text-muted">{orders.total} matching orders. Only records you are permitted to view are shown.</p>
            <ul className="grid md:grid-cols-2 gap-4">{orders.data.map(order=><li key={order.id} className="isd-surface border isd-border rounded-2xl p-5 space-y-3"><p className="text-sm isd-text-muted">Order #{order.id} · {labels[order.status]||order.status}</p><h2 className="text-lg font-bold isd-text-primary">{order.fish_name}</h2><p className="isd-text-secondary">{order.weight_kg} kg · ₱{Number(order.final_price).toFixed(2)} batch price</p><p className="text-sm isd-text-muted">{order.logistics_type==='self_pickup'?'Self-pickup':'Courier delivery'} · {order.location}</p><Link href={route('orders.show',order.id)} className="inline-block underline isd-text-brand">View order & next step</Link></li>)}</ul>
            {!orders.data.length && <p className="isd-surface border isd-border p-6 rounded-xl isd-text-secondary">No orders in this view. <Link href={route('marketplace.index')} className="underline isd-text-brand">Open marketplace</Link> or choose another filter.</p>}
            <nav aria-label="Order pages" className="flex justify-between items-center gap-3 isd-text-brand">{orders.prev_page_url?<Link href={orders.prev_page_url}>Previous</Link>:<span/>}<span className="isd-text-secondary">Page {orders.current_page} of {orders.last_page}</span>{orders.next_page_url?<Link href={orders.next_page_url}>Next</Link>:<span/>}</nav>
        </div>
    </AuthenticatedLayout>;
}
