import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, CardContent, Field, Input } from '../components/ui';
import { requestPasswordResetOtp } from '../services/authClient';
import { DEFAULT_TENANT_ID, normalizeTenantSlug } from '../utils/auth';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequestOtp = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const tenantSlug = normalizeTenantSlug(formData.get('subdomain') || DEFAULT_TENANT_ID) || DEFAULT_TENANT_ID;
    const email = String(formData.get('email') || '').trim();

    try {
      const response = await requestPasswordResetOtp({
        tenantSlug,
        email,
      });

      setSuccessMessage(response?.message || 'If the account exists, a password reset OTP has been sent.');

      navigate(
        `/reset-password?subdomain=${encodeURIComponent(tenantSlug)}&email=${encodeURIComponent(email)}`,
        { replace: false }
      );
    } catch (error) {
      setErrorMessage(error.message || 'Unable to send OTP right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center px-6 py-10 sm:px-8 lg:px-12">
      <div className="w-full max-w-lg space-y-8">
        <div className="space-y-4 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-2 text-sm font-semibold text-[var(--text)]">
            <span className="material-symbols-outlined text-[18px] text-[var(--accent)]">lock_reset</span>
            FleetTrack Security
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--text-dim)]">Forgot Password</p>
            <h1 className="mt-3 font-headline text-4xl font-bold text-[var(--text)]">Request a one-time OTP</h1>
            <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
              Enter your tenant subdomain and business email. If your account exists, we will send a password reset OTP.
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form className="space-y-5" onSubmit={handleRequestOtp}>
              <Field label="Organization Subdomain">
                <Input autoComplete="organization" name="subdomain" placeholder="saarthi-logistics" suffix=".fleettrack.io" />
              </Field>

              <Field label="Business Email">
                <Input autoComplete="email" name="email" placeholder="ops@company.com" type="email" />
              </Field>

              {errorMessage ? (
                <div className="rounded-2xl border border-[rgba(239,68,68,0.22)] bg-[rgba(239,68,68,0.08)] px-4 py-3 text-sm text-red-200">
                  {errorMessage}
                </div>
              ) : null}

              {successMessage ? (
                <div className="rounded-2xl border border-[rgba(16,185,129,0.25)] bg-[rgba(16,185,129,0.09)] px-4 py-3 text-sm text-emerald-200">
                  {successMessage}
                </div>
              ) : null}

              <Button className="w-full justify-center" loading={isSubmitting} size="lg" type="submit">
                Send OTP
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-[var(--text-muted)] lg:text-left">
          Already remember your password?
          <Link className="ml-1 font-semibold text-[var(--accent)] transition hover:text-[var(--accent-hover)]" to="/login">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
