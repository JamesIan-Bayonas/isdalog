import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import ThemeToggle from '@/Components/ThemeToggle';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import {
    ArrowRightIcon, CircleStackIcon, EnvelopeIcon, EyeIcon, EyeSlashIcon,
    LockClosedIcon, ShieldCheckIcon, SparklesIcon, TruckIcon, UserIcon,
} from '@heroicons/react/24/outline';

const roles = {
    fisherman: { label: 'Fisherman', title: 'Fishermen', badge: 'Catch and auctions', description: 'Log catches, manage auctions, and track secured earnings.', icon: SparklesIcon, tone: 'brand' },
    buyer: { label: 'Buyer', title: 'Buyers', badge: 'Marketplace and delivery', description: 'Place offers, manage funds, and follow delivery progress.', icon: CircleStackIcon, tone: 'success' },
    rider: { label: 'Rider', title: 'Riders', badge: 'Cold-chain delivery', description: 'Claim dispatches and record verified cold-chain handovers.', icon: TruckIcon, tone: 'info' },
};

export default function Register() {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '', email: '', role: 'fisherman', password: '', password_confirmation: '',
    });

    const submit = (event) => {
        event.preventDefault();
        post(route('register'), { onFinish: () => reset('password', 'password_confirmation') });
    };

    const currentRole = roles[data.role] || roles.fisherman;
    const CurrentRoleIcon = currentRole.icon;

    return (
        <>
            <Head title="Create an account — IsdaLog Maritime Hub" />
            <div className="isd-auth-page">
                <ThemeToggle className="isd-auth-theme-fab" />
                <aside className="isd-auth-showcase">
                    <Link href="/" className="isd-auth-brand">
                        <span className="isd-auth-brand-mark"><img src="/images/isdalog-logo-mark.png" alt="" /></span>
                        <span><strong>IsdaLog</strong><small>Maritime marketplace and logistics</small></span>
                    </Link>

                    <div className="isd-auth-showcase-content">
                        <div className="isd-auth-showcase-copy">
                            <p className="isd-auth-eyebrow">One connected port</p>
                            <h2>Set up the workspace that fits your work on the water.</h2>
                            <p>Choose a role to see what your IsdaLog workspace supports. Account access remains role-based.</p>
                        </div>

                        <div className="isd-role-preview" aria-live="polite">
                            <div className="isd-role-compass" aria-hidden="true">
                                <span className="isd-compass-sweep" aria-hidden="true" />
                                <span className="isd-compass-ring isd-ring-one" /><span className="isd-compass-ring isd-ring-two" />
                                <span className="isd-compass-line isd-line-horizontal" /><span className="isd-compass-line isd-line-vertical" />
                                {Object.entries(roles).map(([key, role]) => <button key={key} type="button" tabIndex={-1} onClick={() => setData('role', key)} className={`isd-compass-point isd-compass-${key} ${data.role === key ? 'is-active' : ''}`} aria-label={`Choose ${role.label}`} />)}
                                <span className="isd-compass-center" />
                            </div>
                            <div className="isd-role-list">
                                {Object.entries(roles).map(([key, role]) => <button key={key} type="button" onClick={() => setData('role', key)} aria-pressed={data.role === key} className={data.role === key ? 'is-active' : ''}><span className={`isd-role-dot isd-tone-${role.tone}`} />{role.title}</button>)}
                            </div>
                        </div>

                        <div className={`isd-role-summary isd-tone-${currentRole.tone}`}>
                            <span className="isd-role-summary-icon"><CurrentRoleIcon aria-hidden="true" /></span>
                            <span><strong>{currentRole.title}</strong><small>{currentRole.badge}</small><p>{currentRole.description}</p></span>
                        </div>
                    </div>
                    <p className="isd-auth-assurance isd-auth-desktop-assurance"><ShieldCheckIcon aria-hidden="true" /> Built for secure, traceable catch operations</p>
                </aside>

                <main className="isd-auth-main">
                    <div className="isd-auth-mobile-topbar">
                        <Link href="/" className="isd-auth-brand"><span className="isd-auth-brand-mark"><img src="/images/isdalog-logo-mark.png" alt="" /></span><strong>IsdaLog</strong></Link>
                    </div>
                    <section className="isd-auth-card" aria-labelledby="register-title">
                        <div className="isd-auth-heading"><h1 id="register-title">Create your account</h1><p>Already have an account? <Link href={route('login')}>Sign in</Link></p></div>

                        <form onSubmit={submit} className="isd-registration-form">
                            <input type="hidden" name="role" value={data.role} />
                            <fieldset className="isd-role-fieldset" aria-describedby={errors.role ? 'register-role-error' : undefined}>
                                <legend>Choose your role</legend>
                                <div className="isd-role-selector">
                                    {Object.entries(roles).map(([key, role]) => <button key={key} type="button" onClick={() => setData('role', key)} className={data.role === key ? 'is-active' : ''} aria-pressed={data.role === key}>{role.label}</button>)}
                                </div>
                                <InputError id="register-role-error" message={errors.role} className="mt-2 text-xs" />
                            </fieldset>

                            <div className="isd-auth-field">
                                <InputLabel htmlFor="name" value="Full name" />
                                <div className="isd-auth-input-wrap"><UserIcon aria-hidden="true" /><TextInput id="name" name="name" value={data.name} className="isd-auth-input" autoComplete="name" placeholder="Juan Dela Cruz" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'register-name-error' : undefined} onChange={(event) => setData('name', event.target.value)} required /></div>
                                <InputError id="register-name-error" message={errors.name} className="mt-2 text-xs" />
                            </div>
                            <div className="isd-auth-field">
                                <InputLabel htmlFor="email" value="Email address" />
                                <div className="isd-auth-input-wrap"><EnvelopeIcon aria-hidden="true" /><TextInput id="email" type="email" name="email" value={data.email} className="isd-auth-input" autoComplete="username" placeholder="operator@isdalog.ph" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'register-email-error' : undefined} onChange={(event) => setData('email', event.target.value)} required /></div>
                                <InputError id="register-email-error" message={errors.email} className="mt-2 text-xs" />
                            </div>
                            <div className="isd-auth-field">
                                <InputLabel htmlFor="password" value="Password" />
                                <div className="isd-auth-input-wrap"><LockClosedIcon aria-hidden="true" /><TextInput id="password" type={showPassword ? 'text' : 'password'} name="password" value={data.password} className="isd-auth-input isd-auth-input-password" autoComplete="new-password" placeholder="••••••••••••" aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'register-password-error' : undefined} onChange={(event) => setData('password', event.target.value)} required /><button type="button" className="isd-password-visibility" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeSlashIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />}</button></div>
                                <InputError id="register-password-error" message={errors.password} className="mt-2 text-xs" />
                            </div>
                            <div className="isd-auth-field">
                                <InputLabel htmlFor="password_confirmation" value="Confirm password" />
                                <div className="isd-auth-input-wrap"><LockClosedIcon aria-hidden="true" /><TextInput id="password_confirmation" type={showPassword ? 'text' : 'password'} name="password_confirmation" value={data.password_confirmation} className="isd-auth-input" autoComplete="new-password" placeholder="••••••••••••" aria-invalid={Boolean(errors.password_confirmation)} aria-describedby={errors.password_confirmation ? 'register-password-confirmation-error' : undefined} onChange={(event) => setData('password_confirmation', event.target.value)} required /></div>
                                <InputError id="register-password-confirmation-error" message={errors.password_confirmation} className="mt-2 text-xs" />
                            </div>
                            <button type="submit" disabled={processing} className="isd-auth-submit"><span>{processing ? 'Creating account...' : `Create ${currentRole.label} account`}</span>{!processing && <ArrowRightIcon aria-hidden="true" />}</button>
                        </form>
                        <p className="isd-auth-assurance"><ShieldCheckIcon aria-hidden="true" /> Your account details are protected</p>
                    </section>
                </main>
            </div>
        </>
    );
}
