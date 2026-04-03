import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, CardContent, Field, Input } from '../components/ui';
import useAuth from '../hooks/useAuth';
import { DEFAULT_TENANT_ID, normalizeTenantSlug } from '../utils/auth';

const onboardingNotes = [
  ['Fast setup', 'Spin up a tenant workspace in under a minute.'],
  ['Secure access', 'Each organization gets its own isolated session.'],
  ['Live visibility', 'Move from signup to dispatch without extra setup.'],
];

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    const formData = new FormData(e.currentTarget);
    const tenantSlug = normalizeTenantSlug(formData.get('subdomain') || DEFAULT_TENANT_ID) || DEFAULT_TENANT_ID;

    try {
      await register({
        companyName: String(formData.get('companyName') || '').trim(),
        email: String(formData.get('email') || '').trim(),
        password: String(formData.get('password') || ''),
        rememberMe: formData.get('remember') === 'on',
        tenantSlug,
      });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setErrorMessage(error.message || 'Unable to create the workspace right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-screen w-full lg:grid-cols-[0.95fr_1.05fr]">
      <section className="flex items-center justify-center px-6 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-lg space-y-8">
          <div className="space-y-4 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-2 text-sm font-semibold text-[var(--text)]">
              <span className="material-symbols-outlined text-[18px] text-[var(--accent)]">domain_add</span>
              FleetTrack
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--text-dim)]">Create Workspace</p>
              <h1 className="mt-3 font-headline text-4xl font-bold text-[var(--text)]">Start your fleet workspace</h1>
              <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
                Create your organization access and jump straight into dispatch, tracking, and fleet visibility.
              </p>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              <form className="space-y-5" onSubmit={handleRegister}>
                <Field label="Company Name">
                  <Input name="companyName" placeholder="Saarthi Logistics" />
                </Field>

                <Field label="Organization Subdomain" hint="This becomes your FleetTrack workspace identifier.">
                  <Input name="subdomain" placeholder="saarthi-logistics" suffix=".fleettrack.io" />
                </Field>

                <Field label="Business Email">
                  <Input name="email" placeholder="ops@company.com" type="email" />
                </Field>

                <Field label="Password">
                  <Input
                    name="password"
                    placeholder="Create a password"
                    type={isPasswordVisible ? 'text' : 'password'}
                    endAdornment={
                      <button
                        type="button"
                        aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-dim)] transition duration-200 hover:bg-[var(--surface-muted)] hover:text-[var(--text)]"
                        onClick={() => setIsPasswordVisible((current) => !current)}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {isPasswordVisible ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    }
                  />
                </Field>

                {errorMessage ? (
                  <div className="rounded-2xl border border-[rgba(239,68,68,0.22)] bg-[rgba(239,68,68,0.08)] px-4 py-3 text-sm text-red-200">
                    {errorMessage}
                  </div>
                ) : null}

                <label className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
                  <input
                    className="h-4 w-4 rounded border-[var(--border)] bg-[var(--panel-muted)] text-[var(--accent)] focus:ring-[var(--accent)]"
                    defaultChecked
                    id="remember"
                    name="remember"
                    type="checkbox"
                  />
                  Keep this new workspace signed in for 30 days
                </label>

                <Button className="w-full justify-center" loading={isSubmitting} size="lg" type="submit">
                  Create Account
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-[var(--text-muted)] lg:text-left">
            Already have an account?
            <Link className="ml-1 font-semibold text-[var(--accent)] transition hover:text-[var(--accent-hover)]" to="/login">
              Sign in
            </Link>
          </p>
        </div>
      </section>

      <section className="relative hidden overflow-hidden border-l border-[var(--border)] lg:flex">
        <div className="absolute inset-0 [background:var(--auth-hero-bg)]" />
        <div className="theme-grid-overlay absolute inset-0 opacity-40 [background-size:72px_72px]" />

        <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-14">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-3 rounded-full border border-[var(--accent-border)] bg-[var(--accent-soft)] px-4 py-2 text-sm font-semibold text-[var(--accent)]">
              <span className="material-symbols-outlined text-[18px]">settings_suggest</span>
              Launch Faster
            </div>
            <h2 className="mt-8 max-w-lg font-headline text-5xl font-bold leading-tight text-[var(--text)]">
              Everything ready from the first sign-in.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-[var(--text-muted)]">
              The demo flow creates a tenant session immediately so you can land inside the dashboard without another blocking step, already aligned to an India-based logistics setup.
            </p>
          </div>

          <div className="grid gap-4">
            {onboardingNotes.map(([title, note]) => (
              <div key={title} className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-elevated)] p-5 backdrop-blur">
                <p className="font-headline text-2xl font-bold text-[var(--text)]">{title}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
