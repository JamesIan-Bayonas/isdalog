// File: isdalog/resources/js/Pages/Catches/Create.jsx
import { useRef, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { CameraIcon, CheckCircleIcon, ArrowRightIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const steps = ['Catch details', 'Price & landing port', 'Review & publish'];
const empty = () => ({ species: '', weight: '', price_per_kg: '', location: '', image_base64: '' });
const money = (value) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);
const fieldClass = 'mt-2 block w-full rounded-xl border isd-border isd-surface isd-text-primary px-3 py-3 focus:ring-2 isd-focus-field';
const decimal = (value) => /^\d+(\.\d{1,2})?$/.test(value) && Number(value) > 0;

export default function Create({ ports = [], speciesNames = [] }) {
    const [step, setStep] = useState(0);
    const [data, setData] = useState(empty);
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState('');
    const [busy, setBusy] = useState(false);
    const [photoBusy, setPhotoBusy] = useState(false);
    const [uncertain, setUncertain] = useState(false);
    const [result, setResult] = useState(null);
    const pending = useRef(null);
    const inFlight = useRef(false);
    const photoVersion = useRef(0);
    const heading = useRef(null);
    const fileInput = useRef(null);
    const selectedPort = ports.find(port => port.name === data.location);
    const batchCents = Math.floor((Math.round(Number(data.weight) * 100) * Math.round(Number(data.price_per_kg) * 100) + 50) / 100);

    const go = (next) => {
        setStep(next);
        setMessage('');
        requestAnimationFrame(() => heading.current?.focus());
    };
    const update = (field, value) => {
        setData(current => ({ ...current, [field]: value }));
        setErrors(current => ({ ...current, [field]: undefined }));
        pending.current = null;
    };
    const validate = () => {
        const next = {};
        if (!data.species.trim() || data.species.length > 255) next.species = 'Enter a fish name, up to 255 characters.';
        if (!decimal(data.weight) || Number(data.weight) > 999999.99) next.weight = 'Enter kilograms from 0.01 to 999,999.99, using up to two decimal places.';
        if (!decimal(data.price_per_kg) || Number(data.price_per_kg) > 99999999.99) next.price_per_kg = 'Enter a positive price per kilogram, using up to two decimal places.';
        if (!Number.isSafeInteger(batchCents) || batchCents < 1 || batchCents > 9999999999) next.price_per_kg = 'The batch total must be between ₱0.01 and ₱99,999,999.99.';
        if (!selectedPort) next.location = 'Choose your landing port.';
        return next;
    };
    const nextStep = (event) => {
        event.preventDefault();
        const all = validate();
        const relevant = step === 0 ? ['species', 'weight'] : Object.keys(all);
        const current = Object.fromEntries(Object.entries(all).filter(([key]) => relevant.includes(key)));
        setErrors(current);
        if (Object.keys(current).length) {
            requestAnimationFrame(() => document.getElementById(`capture-${Object.keys(current)[0]}`)?.focus());
            return;
        }
        go(step + 1);
    };
    const readPhoto = (event) => {
        const file = event.target.files?.[0];
        const version = ++photoVersion.current;
        update('image_base64', '');
        setPhotoBusy(false);
        if (!file) return;
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
            setErrors(current => ({ ...current, image_base64: 'Choose a JPEG, PNG or WebP photo up to 5 MB.' }));
            event.target.value = '';
            return;
        }
        setPhotoBusy(true);
        const reader = new FileReader();
        reader.onload = () => {
            if (version !== photoVersion.current) return;
            update('image_base64', String(reader.result));
            setPhotoBusy(false);
        };
        reader.onerror = () => {
            if (version !== photoVersion.current) return;
            setPhotoBusy(false);
            setErrors(current => ({ ...current, image_base64: 'Photo could not be read. Choose it again or continue without a photo.' }));
        };
        reader.readAsDataURL(file);
    };
    const publish = async (event) => {
        event.preventDefault();
        if (inFlight.current || photoBusy) return;
        const validation = validate();
        if (!pending.current && Object.keys(validation).length) {
            setErrors(validation);
            go(validation.species || validation.weight ? 0 : 1);
            return;
        }
        // Preserve exactly this request after an uncertain network outcome; never generate a fresh retry ID.
        pending.current ||= { ...data, species: data.species.trim(), submission_id: crypto.randomUUID(), lat: selectedPort.lat, lon: selectedPort.lon };
        inFlight.current = true;
        setBusy(true);
        setMessage('');
        try {
            const response = await axios.post(route('catches.store'), pending.current, { headers: { Accept: 'application/json' }, timeout: 30000 });
            if (response.data?.status !== 'success' || !response.data?.data?.listing_id) throw new Error('Publication response could not be confirmed.');
            setResult(response.data.data);
            setUncertain(false);
            pending.current = null;
            requestAnimationFrame(() => heading.current?.focus());
        } catch (error) {
            const status = error.response?.status;
            if (status === 422) {
                const fields = Object.fromEntries(Object.entries(error.response.data.errors || {}).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]));
                setErrors(fields);
                pending.current = null;
                setUncertain(false);
                go(fields.species || fields.weight || fields.image_base64 ? 0 : 1);
                setMessage('Please correct the highlighted fields. Your catch has not been published.');
            } else {
                setUncertain(true);
                setMessage(status === 419 || status === 401 ? 'Your session needs attention. Open your account in another tab to sign in, then retry this submission.'
                    : status === 403 ? 'Your account cannot publish this catch. Check your account role before retrying.'
                    : status === 409 ? 'This submission ID already has different saved details. Check My catches before taking further action.'
                    : 'Publication could not be confirmed. Your details are kept here. Retry the same submission or check My catches; do not start a second copy.');
            }
        } finally {
            inFlight.current = false;
            setBusy(false);
        }
    };
    const error = (field) => errors[field] && <p id={`capture-error-${field}`} role="alert" className="mt-2 text-sm isd-text-danger">{errors[field]}</p>;
    const field = (name, label, attributes = {}) => <label className="block text-sm font-semibold isd-text-primary" htmlFor={`capture-${name}`}>
        {label}<input id={`capture-${name}`} name={name} value={data[name]} onChange={event => update(name, event.target.value)} className={fieldClass}
            aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `capture-error-${name}` : undefined} {...attributes} />{error(name)}
    </label>;

    return <AuthenticatedLayout header={<div><p className="text-xs font-semibold uppercase tracking-widest isd-text-brand">Your next catch, ready for market</p><h1 className="text-xl font-bold isd-text-primary">Sell your catch</h1></div>}>
        <Head title="Sell your catch" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
            {result ? <section className="isd-surface border isd-border rounded-2xl p-6 sm:p-10 space-y-5" aria-labelledby="publish-result">
                <CheckCircleIcon className="w-12 h-12 isd-text-success" aria-hidden="true" />
                <h2 id="publish-result" tabIndex={-1} ref={heading} className="text-2xl font-bold isd-text-primary">Your catch is published</h2>
                <p className="isd-text-secondary">{result.species} · {result.weight} kg · starting batch price {money(result.floor_price)}</p>
                <p className="text-sm isd-text-muted">Listing #{result.listing_id}. Buyers can now make offers. Your catch record and listing are saved to your account.</p>
                <div className="flex flex-wrap gap-3">
                    <Link href={route('catches.index', { listing: result.listing_id })} className="isd-action isd-on-action rounded-xl px-5 py-3 font-semibold">View my published catch</Link>
                    <Link href={route('marketplace.index')} className="isd-text-brand border isd-border rounded-xl px-5 py-3">Open marketplace</Link>
                    <button type="button" onClick={() => { setResult(null); setData(empty()); setErrors({}); setUncertain(false); go(0); }} className="isd-text-brand px-3 py-3">Sell another catch</button>
                </div>
            </section> : <>
                <nav aria-label="Catch publication progress" className="mb-6">
                    <ol className="grid grid-cols-3 gap-2 sm:gap-4">{steps.map((name, index) => <li key={name} aria-current={step === index ? 'step' : undefined} className={`border-b-2 pb-3 text-xs sm:text-sm ${step === index ? 'isd-border-brand isd-text-brand font-bold' : 'isd-border isd-text-muted'}`}><span className="block text-xs mb-1">Step {index + 1}</span>{name}</li>)}</ol>
                </nav>
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                    <section className="isd-surface border isd-border rounded-2xl p-5 sm:p-8 min-w-0">
                        <h2 ref={heading} tabIndex={-1} className="text-xl font-bold isd-text-primary mb-2">{steps[step]}</h2>
                        <p className="text-sm isd-text-muted mb-6">{step === 0 ? 'Tell buyers what you are selling. A photo is helpful and optional.' : step === 1 ? 'Set the price for each kilogram and choose where the catch will land.' : 'Check your batch before making it available to buyers.'}</p>
                        {message && <p role="alert" className="mb-5 rounded-xl border isd-border p-4 text-sm isd-text-warning">{message}</p>}
                        <form onSubmit={step < 2 ? nextStep : publish} className="space-y-6" aria-busy={busy || photoBusy}>
                            <fieldset disabled={busy || uncertain} className="space-y-5 min-w-0">
                                <legend className="sr-only">{steps[step]}</legend>
                                {step === 0 && <>
                                    {field('species', 'Fish name', { type: 'text', required: true, maxLength: 255, placeholder: 'e.g. Bangus or Yellowfin tuna', autoComplete: 'off', list: 'species-vocabulary' })}
                                    <datalist id="species-vocabulary">{speciesNames.map(name=><option key={name} value={name} />)}</datalist><p className="text-xs isd-text-muted">Known aliases help buyers find the same species. You may enter another name; it will remain available for review.</p>
                                    {field('weight', 'Total batch weight (kg)', { type: 'number', required: true, min: '0.01', max: '999999.99', step: '0.01', inputMode: 'decimal', placeholder: 'e.g. 12.50' })}
                                    <div><label htmlFor="capture-photo" className="block text-sm font-semibold isd-text-primary">Catch photo <span className="font-normal isd-text-muted">(optional)</span></label>
                                        <div className="mt-2 rounded-xl border border-dashed isd-border p-4 space-y-3">
                                            {data.image_base64 ? <img src={data.image_base64} alt="Your selected catch photo" className="w-full h-48 object-contain rounded-lg isd-subtle" /> : <CameraIcon className="w-9 h-9 isd-text-muted" aria-hidden="true" />}
                                            <input ref={fileInput} id="capture-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={readPhoto} aria-describedby={`capture-photo-help${errors.image_base64 ? ' capture-error-image_base64' : ''}`} aria-invalid={Boolean(errors.image_base64)} className="block max-w-full text-sm isd-text-secondary" />
                                            <p id="capture-photo-help" className="text-xs isd-text-muted">JPEG, PNG or WebP · up to 5 MB. Fish names are entered by you; no AI identification is required.</p>
                                            {photoBusy && <p role="status" className="text-sm isd-text-muted">Reading photo…</p>}
                                            {data.image_base64 && <button type="button" onClick={() => { ++photoVersion.current; update('image_base64', ''); if (fileInput.current) fileInput.current.value = ''; }} className="text-sm underline isd-text-brand">Remove photo</button>}
                                            {errors.image_base64 && <button type="button" onClick={() => { ++photoVersion.current; update('image_base64', ''); setPhotoBusy(false); if (fileInput.current) fileInput.current.value = ''; }} className="text-sm underline isd-text-brand">Continue without a photo</button>}
                                        </div>{error('image_base64')}
                                    </div>
                                </>}
                                {step === 1 && <>
                                    {field('price_per_kg', 'Asking price per kilogram (₱/kg)', { type: 'number', required: true, min: '0.01', max: '99999999.99', step: '0.01', inputMode: 'decimal', placeholder: 'e.g. 120.00' })}
                                    <label htmlFor="capture-location" className="block text-sm font-semibold isd-text-primary">Landing port
                                        <select id="capture-location" required value={data.location} onChange={event => update('location', event.target.value)} className={fieldClass} aria-invalid={Boolean(errors.location)} aria-describedby={errors.location ? 'capture-error-location' : undefined}>
                                            <option value="">Choose a port</option>{ports.map(port => <option key={port.name} value={port.name}>{port.name}</option>)}
                                        </select>{error('location')}
                                    </label>
                                    <p className="text-sm isd-text-muted">Port coordinates are a landing reference, not your vessel’s recorded GPS position.</p>
                                </>}
                                {step === 2 && <>
                                    {data.image_base64 && <img src={data.image_base64} alt="Catch photo to be published" className="h-48 w-full object-contain rounded-xl isd-subtle" />}
                                    <dl className="space-y-4 text-sm">{[['Fish name', data.species], ['Batch weight', `${data.weight} kg`], ['Asking price', `${money(Number(data.price_per_kg))} / kg`], ['Landing port', data.location]].map(([label, value]) => <div className="flex flex-wrap justify-between gap-2 border-b isd-border pb-3" key={label}><dt className="isd-text-muted">{label}</dt><dd className="font-semibold isd-text-primary break-words max-w-full">{value}</dd></div>)}</dl>
                                    <p className="text-sm isd-text-secondary">The auction opens for 48 hours after publication. You choose whether to accept an offer before it closes. Publishing does not charge a buyer or guarantee a sale.</p>
                                </>}
                            </fieldset>
                            <div className="flex flex-wrap gap-3 pt-4 border-t isd-border">
                                {step > 0 && !uncertain && <button type="button" disabled={busy} onClick={() => go(step - 1)} className="inline-flex gap-2 items-center rounded-xl border isd-border px-4 py-3 isd-text-secondary"><ArrowLeftIcon className="w-4 h-4" />Back</button>}
                                <button type="submit" disabled={busy || photoBusy || (step === 0 && Boolean(errors.image_base64))} className="inline-flex gap-2 items-center rounded-xl isd-action isd-on-action px-5 py-3 font-semibold disabled:opacity-50">{busy ? 'Publishing…' : uncertain ? 'Retry same submission' : step === 2 ? 'Publish catch' : 'Continue'}<ArrowRightIcon className="w-4 h-4" /></button>
                                <Link href={route('catches.index')} className="px-3 py-3 isd-text-brand" target={uncertain ? '_blank' : undefined} rel={uncertain ? 'noopener noreferrer' : undefined}>My catches</Link>
                            </div>
                        </form>
                    </section>
                    <aside className="isd-subtle rounded-2xl border isd-border p-5 h-fit space-y-4" aria-label="Batch summary">
                        <h3 className="font-bold isd-text-primary">Your batch at a glance</h3>
                        <p className="isd-text-secondary break-words">{data.species || 'Fish name not entered yet'}</p>
                        <p className="text-sm isd-text-muted">{data.weight || '—'} kg × {decimal(data.price_per_kg) ? money(Number(data.price_per_kg)) : '—'} / kg</p>
                        <div className="border-t isd-border pt-4"><p className="text-xs uppercase tracking-wider isd-text-muted">Starting batch price</p><p className="text-2xl font-bold isd-text-brand break-words">{batchCents > 0 && batchCents <= 9999999999 ? money(batchCents / 100) : '—'}</p></div>
                        <p className="text-xs isd-text-muted">The batch total is rounded to the nearest centavo. The existing 3% platform fee applies after a completed sale; delivery charges are separate.</p>
                        <p className="text-xs isd-text-muted">Photo and fish details are seller-provided. They do not certify freshness, handling or regulatory clearance.</p>
                        <Link href={route('profile.edit')} className="inline-block text-sm underline isd-text-brand">Prefer Telegram? Connect your account</Link>
                    </aside>
                </div>
            </>}
        </div>
    </AuthenticatedLayout>;
}
