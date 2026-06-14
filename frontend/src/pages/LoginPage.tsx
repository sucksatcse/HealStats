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
    <div className="min-h-screen bg-slate-50">
      <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
        <aside className="relative hidden overflow-hidden bg-slate-950 px-10 py-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.35),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(13,148,136,0.22),transparent_26%)]" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-blue-600 shadow-2xl shadow-blue-500/20">
                <span className="text-xl">♥</span>
              </div>
              <div>
                <p className="text-label text-white/55">HealthStats</p>
                <p className="mt-1 text-sm text-white/70">Empowering Rural Healthcare</p>
              </div>
            </div>
            <div className="hidden lg:block">
              <LanguageToggle />
            </div>
          </div>

          <div className="relative z-10 max-w-xl space-y-6">
            <div className="space-y-5">
              <h1 className="text-[clamp(2.5rem,5vw,4.5rem)] font-extrabold leading-none tracking-tight text-white">
                HealthStats
              </h1>
              <p className="max-w-lg text-lg leading-8 text-white/72">
                Offline-first clinical workflows for the realities of rural care, designed for speed, clarity, and resilience.
              </p>
            </div>

            <div className="grid gap-4">
              {[
                ['Offline First', 'Captured once, available everywhere, even without a signal.'],
                ['Bilingual Support', 'Switch seamlessly between English and বাংলা.'],
                ['Real-time Sync', 'Queued updates sync automatically when the network returns.']
              ].map(([title, description]) => (
                <div key={title} className="flex items-start gap-4 rounded-2xl bg-white/8 p-4 ring-1 ring-white/10 backdrop-blur">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-500/20 text-lg text-teal-200">✓</div>
                  <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-white/70">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 max-w-sm rounded-2xl bg-white/8 p-5 ring-1 ring-white/10 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">{t('auth.demoTitle')}</p>
            <p className="mt-3 text-sm text-white/75">{t('auth.demoStaffId')}</p>
            <p className="text-sm text-white/75">{t('auth.demoPin')}</p>
            <p className="mt-4 text-sm leading-6 text-white/65">Offline-first access for rural hospitals with local data capture, queued sync, and bilingual workflows.</p>
          </div>
        </aside>

        <section className="relative flex flex-col justify-center px-5 py-6 sm:px-8 lg:px-12">
          <div className="mb-8 flex justify-end lg:hidden">
            <LanguageToggle />
          </div>

          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 flex justify-center lg:hidden">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-2xl font-black text-white shadow-lg shadow-blue-600/25">
                ♥
              </div>
            </div>

            <form onSubmit={handleSubmit} className="card rounded-2xl border-0 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
              <div className="text-center">
                <p className="text-label text-blue-700">{t('auth.welcome')}</p>
                <h2 className="mt-3 text-page-title">{t('auth.signIn')}</h2>
                <p className="mt-3 text-body">{t('auth.passwordHint')}</p>
              </div>

              <div className="mt-8 space-y-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">{t('auth.staffId')}</span>
                  <input
                    value={staffId}
                    onChange={(event) => setStaffId(event.target.value.toUpperCase())}
                    className="w-full rounded-2xl px-4 py-3 text-base"
                    placeholder="DEMO001"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">{t('auth.pin')}</span>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
                    <input
                      value={pin}
                      onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 6))}
                      inputMode="numeric"
                      maxLength={6}
                      type={showPin ? 'text' : 'password'}
                      className="min-w-0 flex-1 border-0 bg-transparent px-0 py-0 text-base shadow-none"
                      placeholder="••••"
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

                <button type="submit" className="btn-primary w-full py-3.5 text-base">
                  {t('auth.signIn')}
                </button>
              </div>

              <p className="mt-6 text-center text-sm text-slate-500">
                Demo: Staff ID <span className="font-semibold text-slate-700">DEMO001</span> · PIN <span className="font-semibold text-slate-700">1234</span>
              </p>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}