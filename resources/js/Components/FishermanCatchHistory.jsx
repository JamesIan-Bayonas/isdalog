import { useState } from 'react';

function recordedTime(value) {
    if (!value) return null;
    // Raw SQL timestamps follow the application's UTC timezone; ISO values retain their offset.
    const text = String(value).replace(' ', 'T');
    const date = new Date(/(?:Z|[+-]\d{2}:?\d{2})$/i.test(text) ? text : `${text}Z`);
    return Number.isNaN(date.getTime()) ? null : date;
}

const valueWithUnit = (value, unit) => value == null || value === '' || !Number.isFinite(Number(value))
    ? 'Not recorded' : `${Number(value).toLocaleString('en-PH')} ${unit}`;

export default function FishermanCatchHistory({ records }) {
    const [query, setQuery] = useState('');
    const [location, setLocation] = useState('');
    const loaded = records ?? [];
    const locations = [...new Set(loaded.map((record) => record.location).filter(Boolean))].sort();
    const selectedLocation = locations.includes(location) ? location : '';
    const search = query.trim().toLocaleLowerCase();
    const filtered = loaded.filter((record) => (
        (!selectedLocation || record.location === selectedLocation)
        && [record.species || record.fish_name || '', record.location || ''].some((value) => String(value).toLocaleLowerCase().includes(search))
    ));
    const hasFilters = Boolean(query || selectedLocation);

    return (
        <section id="fisherman-records" tabIndex={-1} className="isd-catch-history isd-fisherman-anchor" aria-labelledby="fisherman-records-heading">
            <div className="isd-fisherman-section-heading">
                <div><h3 id="fisherman-records-heading">Recent catch records</h3><p className="isd-fisherman-supporting">Up to your latest 10 catch records. Search covers these recent records only.</p></div>
                <a href="#fisherman-section-navigation" className="isd-history-back">Back to sections ↑</a>
            </div>
            <div className="isd-history-filters">
                <div><label htmlFor="fisherman-record-search">Search fish or landing location</label><input id="fisherman-record-search" className="isd-ui-input" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search recent records" /></div>
                <div><label htmlFor="fisherman-record-location">Landing location</label><select id="fisherman-record-location" className="isd-ui-input" value={selectedLocation} onChange={(event) => setLocation(event.target.value)}><option value="">All loaded locations</option>{locations.map((name) => <option key={name} value={name}>{name}</option>)}</select></div>
                <button type="button" className="isd-ui-button isd-ui-button-secondary" disabled={!hasFilters} onClick={() => { setQuery(''); setLocation(''); }}>Clear filters</button>
            </div>
            <p className="isd-history-result-count" role="status">Showing {filtered.length} of {loaded.length} loaded {loaded.length === 1 ? 'record' : 'records'}</p>
            {filtered.length ? <ul className="isd-history-list">
                {filtered.map((record, index) => {
                    const date = recordedTime(record.logged_at || record.created_at);
                    return <li key={record.id ?? index} className="isd-history-record">
                        <div className="isd-history-record-heading"><div><p className="isd-history-id">{record.id == null ? 'Catch record' : `Catch record #${record.id}`}</p><h4>{record.species || record.fish_name || 'Catch batch'}</h4></div><strong className="isd-history-weight">{valueWithUnit(record.weight, 'kg')}</strong></div>
                        <dl className="isd-history-facts">
                            <div><dt>Landing location</dt><dd>{record.location || 'Not recorded'}</dd></div>
                            <div><dt>Recorded at</dt><dd>{date ? <time dateTime={date.toISOString()}>{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)}</time> : 'Time not recorded'}</dd></div>
                            <div><dt>Recorded wind</dt><dd>{valueWithUnit(record.wind_speed, 'km/h')}</dd></div>
                            <div><dt>Recorded temperature</dt><dd>{valueWithUnit(record.temperature, '°C')}</dd></div>
                            <div><dt>Recorded weather</dt><dd>{record.weather_condition || 'Not recorded'}</dd></div>
                        </dl>
                    </li>;
                })}
            </ul> : <div className="isd-history-empty"><p>{loaded.length ? 'No recent records match these filters.' : 'No catch records yet. Connect Telegram and send a catch photo to get started.'}</p>{hasFilters && <p>Clear the filters to see the loaded records again.</p>}</div>}
            <p className="isd-fisherman-supporting isd-history-note">Times use your device’s timezone. Conditions are recorded with each catch.</p>
        </section>
    );
}
