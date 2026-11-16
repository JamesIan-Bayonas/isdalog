// File: isdalog/resources/js/Components/GettingStarted.jsx
import {Link,usePage} from '@inertiajs/react';
export default function GettingStarted() {
    const steps=usePage().props.gettingStarted;
    if(!steps?.length)return null;
    return <section aria-labelledby="getting-started-title" className="isd-surface border isd-border rounded-2xl p-5 sm:p-6 space-y-4">
        <div><h2 id="getting-started-title" className="text-lg font-bold isd-text-primary">Your next steps</h2><p className="text-sm isd-text-muted">Guidance based on your account and recorded activity. Existing work remains available below.</p></div>
        <ol className="grid md:grid-cols-3 gap-4">{steps.map((step,index)=><li key={step.title} className="isd-subtle border isd-border rounded-xl p-4 flex flex-col gap-3">
            <p className="text-xs isd-text-muted">Step {index+1}{step.complete?' · Recorded in your account':''}</p><h3 className="font-semibold isd-text-primary">{step.title}</h3><p className="text-sm isd-text-secondary flex-1">{step.detail}</p><Link href={route(step.route)} className="text-sm isd-text-brand underline py-2">{step.label}</Link>
        </li>)}</ol>
    </section>;
}
