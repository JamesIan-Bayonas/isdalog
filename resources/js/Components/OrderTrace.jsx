// File: isdalog/resources/js/Components/OrderTrace.jsx
const time=value=>value?new Date(value).toLocaleString('en-PH'):'Time not recorded';
export default function OrderTrace({trace}) {
    if(!trace)return null;
    return <section className="isd-surface border isd-border rounded-2xl p-6 space-y-4" aria-label="Catch to order timeline">
        <h2 className="text-lg font-bold isd-text-primary">Catch-to-order record</h2>
        <p className="text-sm isd-text-secondary">Listing #{trace.listing_id}{trace.catch_id?' · Catch #'+trace.catch_id:' · No explicit catch link'}{trace.order_id?' · Order #'+trace.order_id:''}. {trace.catch_link_basis==='acceptance_snapshot'?'Catch link frozen when accepted.':'Current explicit listing link; no acceptance snapshot is available.'}</p>
        <ol className="space-y-4 border-l-2 isd-border pl-5">{trace.events.map(event=><li key={event.key} className="space-y-1"><h3 className="font-semibold isd-text-primary">{event.label}</h3><p className="text-xs isd-text-muted">{time(event.at)}</p><p className="text-sm isd-text-secondary">{event.detail}</p></li>)}</ol>
        <p className="text-xs isd-text-muted">Only stored events are shown. Missing milestones remain unknown; times are not reconstructed from current status or last update. Harvest time, cold-chain temperatures and handling verification are not established by this record.</p>
    </section>;
}
