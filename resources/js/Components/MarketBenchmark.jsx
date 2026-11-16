// File: isdalog/resources/js/Components/MarketBenchmark.jsx
const date=value=>value?new Date(/(?:Z|[+-]\d{2}:?\d{2})$/.test(value)?value:value.replace(' ','T')+'Z').toLocaleDateString('en-PH'):'Unknown';
const money=value=>new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP'}).format(Number(value));
export default function MarketBenchmark({benchmark,compact=false}) {
    if(!benchmark)return null;
    const b=benchmark;
    return <section className={compact?'text-xs isd-text-muted space-y-1':'isd-surface border isd-border rounded-2xl p-6 space-y-3'} aria-label="Comparable order prices">
        {!compact && <h2 className="text-lg font-bold isd-text-primary">Comparable order prices</h2>}
        <p>{b.status==='available'?<><strong className="isd-text-primary">{money(b.average_per_kg)} / kg</strong> mean · {b.samples} completed orders · range {money(b.low_per_kg)}–{money(b.high_per_kg)} / kg.</>:b.status==='unclassified'?'Comparison unavailable: species or port has not been linked to the vocabulary.':<>Insufficient comparable data: {b.samples} completed orders; at least {b.minimum_samples} required.</>}</p>
        <p>{b.species && b.port ? b.species+' · '+b.port+' · ':''}{date(b.window_start)}–{date(b.window_end)} (30-day window).</p>
        {b.status==='available' && <p>Recorded completions: {date(b.first_sale_at)}–{date(b.last_sale_at)}.</p>}
        <p>Each accepted batch price is divided by its frozen weight; each order counts equally. Delivery fees are excluded. Internal IsdaLog records may include demonstration activity. Historical reference; price and availability are not guaranteed.</p>
    </section>;
}
