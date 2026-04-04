import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Card, CardContent, Field, Input } from '../components/ui';
import { resetPasswordWithOtp } from '../services/authClient';
import { DEFAULT_TENANT_ID, normalizeTenantSlug } from '../utils/auth';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSubdomain = useMemo(() => searchParams.get('subdomain') || '', [searchParams]);
  const initialEmail = useMemo(() => searchParams.get('email') || '', [searchParams]);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const tenantSlug = normalizeTenantSlug(formData.get('subdomain') || DEFAULT_TENANT_ID) || DEFAULT_TENANT_ID;
    const email = String(formData.get('email') || '').trim();
    const otp = String(formData.get('otp') || '').trim();
    const password = String(formData.get('password') || '');
    const confirmPassword = String(formData.get('confirmPassword') || '');

    if (password !== confirmPassword) {
      setIsSubmitting(false);
      setErrorMessage('Password confirmation does not match.');
      return;
    }

    try {
      const response = await resetPasswordWithOtp({
        tenantSlug,
        email,
        otp,
        password,
      });

      setSuccessMessage(response?.message || 'Password reset successful. Redirecting to sign in...');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1200);
    } catch (error) {
      setErrorMessage(error.message || 'Unable to reset password right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center px-6 py-10 sm:px-8 lg:px-12">
      <div className="w-full max-w-lg space-y-8">
        <div className="space-y-4 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-2 text-sm font-semibold text-[var(--text)]">
            <span className="material-symbols-outlined text-[18px] text-[var(--accent)]">password</span>
            FleetTrack Security
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--text-dim)]">Reset Password</p>
            <h1 className="mt-3 font-headline text-4xl font-bold text-[var(--text)]">Use your OTP to continue</h1>
            <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
              Enter the OTP from your inbox and set a new password for your workspace account.
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form className="space-y-5" onSubmit={handleResetPassword}>
              <Field label="Organization Subdomain">
                <Input autoComplete="organization" defaultValue={initialSubdomain} name="subdomain" placeholder="saarthi-logistics" suffix=".fleettrack.io" />
              </Field>

              <Field label="Business Email">
                <Input autoComplete="email" defaultValue={initialEmail} name="email" placeholder="ops@company.com" type="email" />
              </Field>

              <Field label="One-time OTP">
                <Input inputMode="numeric" name="otp" placeholder="Enter 6-digit OTP" type="text" />
              </Field>

              <Field label="New Password">
                <Input
                  autoComplete="new-password"
                  name="password"
                  placeholder="Set a new password"
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

              <Field label="Confirm New Password">
                <Input
                  autoComplete="new-password"
                  name="confirmPassword"
                  placeholder="Confirm your new password"
                  type={isConfirmPasswordVisible ? 'text' : 'password'}
                  endAdornment={
                    <button
                      type="button"
                      aria-label={isConfirmPasswordVisible ? 'Hide password' : 'Show password'}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-dim)] transition duration-200 hover:bg-[var(--surface-muted)] hover:text-[var(--text)]"
                      onClick={() => setIsConfirmPasswordVisible((current) => !current)}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {isConfirmPasswordVisible ? 'visibility_off' : 'visibility'}
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

              {successMessage ? (
                <div className="rounded-2xl border border-[rgba(16,185,129,0.25)] bg-[rgba(16,185,129,0.09)] px-4 py-3 text-sm text-emerald-200">
                  {successMessage}
                </div>
              ) : null}

              <Button className="w-full justify-center" loading={isSubmitting} size="lg" type="submit">
                Reset Password
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-[var(--text-muted)] lg:text-left">
          Need a new OTP?
          <Link className="ml-1 font-semibold text-[var(--accent)] transition hover:text-[var(--accent-hover)]" to="/forgot-password">
            Request again
          </Link>
        </p>
      </div>
    </main>
  );
}
