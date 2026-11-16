// File: isdalog/resources/js/Pages/Admin/Vocabulary.jsx
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
function Editor({term}) {
    const form=useForm({kind:term?.kind || 'species',code:term?.code || '',display_name:term?.display_name || '',aliases:[],latitude:term?.latitude ?? '',longitude:term?.longitude ?? '',source_note:term?.source_note || ''});
    const field=(key,label,options={})=><label className="block text-sm">{label}<input className="isd-ui-input block w-full mt-1" value={form.data[key]} onChange={e=>form.setData(key,e.target.value)} {...options} /></label>;
    const submit=e=>{e.preventDefault();form.transform(data=>({...data,aliases:data.aliases.map(value=>value.trim()).filter(Boolean)}));const options={preserveScroll:true,onSuccess:()=>{if(!term)form.reset();}};if(term)form.patch(route('admin.vocabulary.update',term.id),options);else form.post(route('admin.vocabulary.store'),options);};
    return <form onSubmit={submit} className="isd-surface border isd-border rounded-xl p-5 space-y-4 min-w-0">
        <h3 className="font-bold text-lg">{term?term.display_name:'Add a vocabulary entry'}</h3>
        {term && <p className="text-sm">Stable ID: {term.id} · {term.code} · {term.kind}</p>}
        {!term && <><label className="block text-sm">Type<select className="isd-ui-input block w-full mt-1" value={form.data.kind} onChange={e=>form.setData('kind',e.target.value)}><option value="species">Species</option><option value="port">Port</option></select></label>{field('code','Permanent identifier (lowercase words and hyphens)',{required:true,maxLength:80})}</>}
        {field('display_name','Display name',{required:true,maxLength:255})}
        <label className="block text-sm">Add aliases (one per line)<textarea className="isd-ui-input block w-full mt-1" rows={3} value={form.data.aliases.join('\n')} onChange={e=>form.setData('aliases',e.target.value.split('\n'))} /></label>
        {term && <p className="text-xs break-words">Existing aliases: {term.aliases.join(' · ')}. Saved aliases and former display names stay attached to this ID.</p>}
        {form.data.kind==='port' && <div className="grid sm:grid-cols-2 gap-3">{field('latitude','Reference latitude',{type:'number',step:'any',min:-90,max:90,required:true})}{field('longitude','Reference longitude',{type:'number',step:'any',min:-180,max:180,required:true})}</div>}
        <label className="block text-sm">Source and review note<textarea required minLength={10} maxLength={2000} rows={3} className="isd-ui-input block w-full mt-1" value={form.data.source_note} onChange={e=>form.setData('source_note',e.target.value)} /></label>
        {Object.entries(form.errors).map(([key,value])=><p key={key} role="alert" className="text-sm">{value}</p>)}
        <button className="isd-ui-button isd-ui-button-primary" disabled={form.processing}>{form.processing?'Saving…':term?'Save vocabulary entry':'Create entry'}</button>
    </form>;
}
function Review({page,type}) {
    return <section className="space-y-3"><h2 className="font-bold text-xl">Unlinked {type==='listing'?'listings':'catch records'}</h2><p>Missing links can include known legacy labels and unknown names. Check exact aliases to attach recognized IDs. For an unfamiliar name, confirm the meaning before adding an alias. Labels and historical timestamps stay intact.</p>
        {!page.data.length && <p>No unlinked records.</p>}
        {page.data.map(record=><article key={record.id} className="isd-surface border isd-border p-4 rounded-xl flex flex-wrap justify-between gap-3 items-center"><div className="min-w-0 break-words"><h3 className="font-bold">#{record.id} · {record.fish_name || record.species}</h3><p>{record.location || 'No port label'} · Species ID: {record.species_term_id || 'Unlinked'} · Port ID: {record.port_term_id || 'Unlinked'}</p></div><Link as="button" method="post" href={route('admin.vocabulary.link',{type,id:record.id})} preserveScroll className="isd-ui-button">Check exact aliases</Link></article>)}
        <nav aria-label={type+' review pages'} className="flex gap-4">{page.prev_page_url && <Link href={page.prev_page_url} preserveScroll>Previous</Link>}<span>Page {page.current_page} of {page.last_page}</span>{page.next_page_url && <Link href={page.next_page_url} preserveScroll>Next</Link>}</nav>
    </section>;
}
export default function Vocabulary({terms,unlinked,catchUnlinked}) {
    const flash=usePage().props.flash;
    return <AuthenticatedLayout header={<h2 className="font-bold text-xl">Port & species vocabulary</h2>}><Head title="Port & species vocabulary" />
        <div className="max-w-6xl mx-auto p-4 py-8 space-y-8 isd-text-primary">
            {flash?.success && <p role="status">{flash.success}</p>}
            <section className="space-y-3"><h1 className="font-bold text-2xl">Names people use. Records you can trace.</h1><p>Maintain stable entries, local/common aliases and port reference coordinates. Exact aliases link new website and Telegram submissions; search expands known species aliases. Original labels are retained. No fuzzy match or automatic species identification is performed.</p><p>Legacy port coordinates are approximate references, not boat GPS, surveyed positions or a promise of courier coverage. Include evidence in the source note. Broad names covering several species should remain unlinked until clarified. Saved aliases cannot be reassigned or removed here; corrections need a reviewed data change.</p></section>
            <Editor />
            <h2 className="font-bold text-xl">Catalogue entries</h2><div className="grid lg:grid-cols-2 gap-4">{terms.map(term=><Editor key={term.id} term={term} />)}</div>
            <Review page={unlinked} type="listing" /><Review page={catchUnlinked} type="catch" />
        </div>
    </AuthenticatedLayout>;
}
