import { type FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '../components/LanguageToggle';
import { useAppStore } from '../store';

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const token = useAppStore((state) => state.token);
  const setAuth = useAppStore((state) => state.setAuth);
  const [staffId, setStaffId] = useState('DEMO001');
  const [pin, setPin] = useState('1234');
  const [showPin, setShowPin] = useState(false);

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setAuth({
      userId: 'DEMO001',
      user: { id: 'DEMO001', name: 'Dr. Rahman', role: 'doctor' },
      facilityId: 'FAC001',
      token: 'demo-token'
    });
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#dff5ff_0%,#f8fbff_32%,#eef6fb_100%)] px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl flex-col items-stretch justify-center gap-6 lg:flex-row lg:items-center">
        <div className="flex justify-end lg:absolute lg:right-6 lg:top-6">
          <LanguageToggle />
        </div>

        <section className="rounded-[2rem] border border-sky-100 bg-white p-6 shadow-[0_24px_80px_rgba(14,165,233,0.12)] sm:p-8 lg:w-[44%]">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-sky-500 text-2xl font-black text-white shadow-soft">
              H
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">{t('app.name')}</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{t('app.tagline')}</h1>
            </div>
          </div>

          <div className="mt-8 grid gap-4 rounded-[1.75rem] bg-slate-50 p-5 ring-1 ring-slate-100">
            <div>
              <p className="text-sm font-semibold text-slate-900">{t('auth.demoTitle')}</p>
              <p className="mt-2 text-sm text-slate-600">{t('auth.demoStaffId')}</p>
              <p className="text-sm text-slate-600">{t('auth.demoPin')}</p>
            </div>
            <p className="text-sm leading-6 text-slate-600">Offline-first access for rural hospitals with local data capture, queued sync, and bilingual workflows.</p>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft sm:p-8 lg:w-[40%]">
          <div className="space-y-1">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">{t('auth.welcome')}</p>
            <h2 className="text-2xl font-semibold text-slate-900">{t('auth.signIn')}</h2>
            <p className="text-sm text-slate-600">{t('auth.passwordHint')}</p>
          </div>

          <div className="mt-6 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">{t('auth.staffId')}</span>
              <input
                value={staffId}
                onChange={(event) => setStaffId(event.target.value.toUpperCase())}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                placeholder="DEMO001"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">{t('auth.pin')}</span>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-300 px-4 py-3 focus-within:border-sky-400 focus-within:ring-4 focus-within:ring-sky-100">
                <input
                  value={pin}
                  onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  maxLength={6}
                  type={showPin ? 'text' : 'password'}
                  className="min-w-0 flex-1 border-0 bg-transparent text-base outline-none"
                  placeholder="1234"
                />
                <button
                  type="button"
                  onClick={() => setShowPin((value) => !value)}
                  className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  {showPin ? t('auth.hidePin') : t('auth.showPin')}
                </button>
              </div>
            </label>

            <button
              type="submit"
              className="w-full rounded-2xl bg-primary px-4 py-3.5 text-base font-semibold text-white shadow-soft transition hover:bg-primary-600"
            >
              {t('auth.signIn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}