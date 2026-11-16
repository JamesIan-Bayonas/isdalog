// File: isdalog/resources/js/Pages/Admin/UserManagement.jsx
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
function Account({user,own}) {
    const form=useForm({reason:'',role:user.role});
    const send=action=>form.patch(route(action,user.id),{preserveScroll:true,onSuccess:()=>form.reset('reason')});
    return <article className="isd-surface border isd-border rounded-xl p-5 space-y-3 min-w-0 break-words">
        <h2 className="font-bold">{user.name}</h2><p>{user.email} · {user.contact_number || 'No contact number'}</p>
        <p>Role: {user.role} · Access status: {user.status || 'unverified'}</p>
        <p>Requested role: {user.requested_role || 'None'}</p>
        <p>Self-reported registration: {user.bfar_registration_number || 'Not provided'}</p><p>Self-reported vehicle and plate: {user.vehicle_details || 'Not provided'}</p>
        {!own && <><label className="block">Decision reason and next steps (visible to account owner)<textarea className="isd-ui-input block w-full" value={form.data.reason} maxLength={1000} onChange={e=>form.setData('reason',e.target.value)} /></label>
        {Object.entries(form.errors).map(([key,value])=><p key={key} role="alert">{value}</p>)}
        <div className="flex flex-wrap gap-3">
            {user.status==='pending_review' ? <><button disabled={form.processing} onClick={()=>send('admin.users.approve-rider')} className="isd-ui-button isd-ui-button-primary">Approve requested role</button><button disabled={form.processing} onClick={()=>send('admin.users.reject')} className="isd-ui-button isd-ui-button-danger">Decline application</button></> : <><button disabled={form.processing} onClick={()=>send('admin.users.toggle-verification')} className="isd-ui-button">{user.status==='verified'?'Remove access approval':'Approve access'}</button><label>Role<select className="isd-ui-input" value={form.data.role} onChange={e=>form.setData('role',e.target.value)}>{['buyer','fisherman','rider','admin'].map(r=><option key={r}>{r}</option>)}</select></label><button disabled={form.processing} onClick={()=>send('admin.users.role')} className="isd-ui-button">Change role; reset approval</button></>}
        </div></>}
    </article>;
}
export default function UserManagement({auth,users}) {
    const flash=usePage().props.flash;
    return <AuthenticatedLayout header={<h2 className="text-xl font-bold">Account review</h2>}><Head title="Account review" />
        <div className="max-w-6xl mx-auto p-4 py-8 space-y-4 isd-text-primary">
            {flash?.success && <p role="status">{flash.success}</p>}
            <p>Approval grants IsdaLog account access. It does not establish government certification, identity verification or catch safety. Record what you checked and what the applicant should do next. Access changes are blocked while the account has active orders; resolve those responsibilities first. This is not an immediate suspension tool.</p>
            <div className="grid gap-4 lg:grid-cols-2">{users.map(u=><Account key={u.id} user={u} own={u.id===auth.user.id} />)}</div>
        </div>
    </AuthenticatedLayout>;
}
