// File: isdalog/resources/js/Pages/Orders/Show.jsx
import {useState} from 'react';
import {Head,Link,useForm,router} from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import OrderRatingModal from '@/Components/OrderRatingModal';
import OrderResolution from '@/Components/OrderResolution';
import DeliveryDetails from '@/Components/DeliveryDetails';
import RepeatInquiry from '@/Components/RepeatInquiry';
import OrderTrace from '@/Components/OrderTrace';
import DeliveryTracker from '@/Components/DeliveryTracker';
const money=value=>new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP'}).format(value);
const time=value=>value?new Date(/(?:Z|[+-]\d{2}:?\d{2})$/.test(value)?value:value.replace(' ','T')+'Z').toLocaleString():'Not recorded';
export default function Show({order,settlement,handover,canConfirm,canDeliver,canDispatch,issue,refund,canCancel,canReport,canReview,delivery,canEditDelivery,trace,repeatInquiry,canAskAgain,canReplyAgain}) {
    const [confirm,setConfirm]=useState(false);
    const {data,setData,post,processing,errors}=useForm({delivery_otp:''});
    const self=order.logistics_type==='self_pickup';
    const labels={pending_dispatch:self?'Awaiting buyer pickup':'Awaiting courier pickup',en_route:'In transit',delivered:'Delivered — awaiting buyer confirmation',completed:'Completed',cancelled:'Cancelled — funds returned',refunded:'Refunded after review'};
    return <AuthenticatedLayout header={<h1 className="text-xl font-bold isd-text-primary">Order #{order.id}</h1>}><Head title={`Order #${order.id}`}/>
        <article className="max-w-5xl mx-auto px-4 py-8 space-y-6">
            <Link href={route('orders.index',{status:'all'})} className="isd-text-brand underline">Orders & history</Link>
            <button type="button" onClick={()=>router.reload({preserveScroll:true})} className="ml-4 underline isd-text-brand">Refresh order status</button>
            <section className="isd-surface rounded-2xl border isd-border p-6 space-y-4"><p className="font-semibold isd-text-brand">{labels[order.status]||order.status}</p><h2 className="text-2xl font-bold isd-text-primary">{order.fish_name}</h2>
                <dl className="grid sm:grid-cols-2 gap-4 isd-text-primary">{[['Fulfillment',self?'Self-pickup':'Courier delivery'],['Seller',order.seller_name||'Unavailable'],['Buyer',order.buyer_name||'Unavailable'],['Courier',self?'Not required':order.rider_name||'Not assigned'],['Landing reference',order.location],['Batch weight',`${order.weight_kg} kg`],['Agreed catch price',money(order.final_price)],['Recorded delivery charge',money(order.delivery_fee)],['Remaining escrow',money(order.escrow_balance)],['Destination & instructions',self?'Self-pickup; arrange at the landing reference':delivery?.delivery_details_saved_at?'Saved — see delivery destination below':'Awaiting buyer details']].map(([label,value])=><div key={label}><dt className="text-sm isd-text-muted">{label}</dt><dd className="break-words font-semibold">{value}</dd></div>)}</dl>
                <Link href={route('catches.show',order.listing_id)} className="underline isd-text-brand">Catch details & provenance</Link>
                <p className="text-xs isd-text-muted">The agreed price is saved on the order. {order.sale_snapshot_at?'Catch description, port and weight were frozen at acceptance;':'This legacy order uses current listing description and weight;'} this is not an external payment receipt.</p>
            </section>
            <section className="isd-surface rounded-2xl border isd-border p-6 space-y-4"><h2 className="text-lg font-bold isd-text-primary">Handover & next step</h2>
                {handover.code && <div className="isd-subtle border isd-border rounded-xl p-4"><p className="isd-text-secondary">Your {handover.kind.toLowerCase()} code</p><p className="font-mono text-2xl tracking-widest isd-text-primary">{handover.code}</p><p className="text-sm isd-text-muted">Share only at physical handover with the collecting buyer or assigned courier.</p></div>}
                {canConfirm && <button onClick={()=>setConfirm(true)} className="rounded-xl isd-action isd-on-action px-5 py-3">{self?'Confirm collected catch':'Confirm receipt & settle'}</button>}
                {canDeliver && <form onSubmit={event=>{event.preventDefault();post(route('dispatch.deliver',order.id));}} className="space-y-3"><label className="block isd-text-primary" htmlFor="order-delivery-code">Delivery code from buyer<input id="order-delivery-code" required pattern="[0-9]{6}" maxLength={6} inputMode="numeric" value={data.delivery_otp} onChange={event=>setData('delivery_otp',event.target.value)} className="block w-full mt-2 rounded-xl border isd-border isd-surface isd-text-primary p-3"/></label>{(errors.delivery_otp||errors.error)&&<p role="alert" className="isd-text-danger">{errors.delivery_otp||errors.error}</p>}<button disabled={processing} className="isd-action isd-on-action rounded-xl px-5 py-3">{processing?'Verifying…':'Verify delivery'}</button></form>}
                {!canConfirm&&!canDeliver&&<p className="isd-text-secondary">{['completed','cancelled','refunded'].includes(order.status)?'This order is closed. Review the recorded settlement or refund below.':self?'Arrange pickup with the other participant. The buyer confirms using the seller’s pickup code.':'Waiting for the next handover step. Courier claims remain on the dispatch board.'}</p>}
                {!self&&canDispatch&&<Link href={route('dispatch.index')} className="block underline isd-text-brand">Courier dispatch board (riders/admins only)</Link>}
            </section>
            <DeliveryDetails order={order} delivery={delivery} canEdit={canEditDelivery}/>
            <OrderResolution order={order} issue={issue} refund={refund} canCancel={canCancel} canReport={canReport} canReview={canReview}/>
            {!self&&['pending_dispatch','en_route','delivered'].includes(order.status)&&<DeliveryTracker order={order}/>}
            <section className="isd-surface rounded-2xl border isd-border p-6 space-y-3"><h2 className="text-lg font-bold isd-text-primary">Recorded milestones</h2><dl className="grid sm:grid-cols-2 gap-4 isd-text-primary">{[['Order created',order.created_at],['Pickup',order.picked_up_at],...(!self?[['Delivery',order.delivered_at]]:[]),['Buyer confirmation',order.completed_at]].map(([label,value])=><div key={label}><dt className="text-sm isd-text-muted">{label}</dt><dd>{time(value)}</dd></div>)}</dl><p className="text-xs isd-text-muted">Older milestones without stored timestamps remain unknown. A current status does not establish an earlier event time.</p></section>
            <section className="isd-surface rounded-2xl border isd-border p-6 space-y-3"><h2 className="text-lg font-bold isd-text-primary">Settlement record</h2>{settlement?<><dl className="grid sm:grid-cols-2 gap-4 isd-text-primary">{[['Reserved total distributed',settlement.funded_amount],['Seller proceeds',settlement.fisherman_amount],['Platform fee',settlement.platform_fee],['Courier proceeds',settlement.rider_amount]].map(([label,value])=><div key={label}><dt className="text-sm isd-text-muted">{label}</dt><dd>{money(value)}</dd></div>)}</dl><p className="text-sm isd-text-muted">Recorded {time(settlement.created_at)}. Internal wallet distribution; not proof of an external payout.</p></>:<p className="isd-text-secondary">No detailed settlement record is available. {['cancelled','refunded'].includes(order.status)?'Reserved funds were returned; see the refund record above.':order.status==='completed'?'This may be an older completed order.':'Funds are not shown as released. Settlement requires eligible receipt and correctly funded escrow.'}</p>}</section>
            <RepeatInquiry orderId={order.id} inquiry={repeatInquiry} canAsk={canAskAgain} canReply={canReplyAgain} />
            <OrderTrace trace={trace}/>
            <OrderRatingModal order={order} isOpen={confirm} onClose={()=>setConfirm(false)}/>
        </article>
    </AuthenticatedLayout>;
}
