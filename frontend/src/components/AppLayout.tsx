import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from './LanguageToggle';
import { useAppStore } from '../store';

const navItems = [
  { to: '/dashboard', key: 'nav.dashboard' },
  { to: '/patients', key: 'nav.patients' },
  { to: '/patients/new', key: 'nav.newPatient' },
  { to: '/encounters/new', key: 'nav.newEncounter' }
];

export function AppLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAppStore((state) => state.user);
  const syncStatus = useAppStore((state) => state.syncStatus);
  const pendingCount = useAppStore((state) => state.pendingCount);
  const clearAuth = useAppStore((state) => state.clearAuth);
  const setSyncStatus = useAppStore((state) => state.setSyncStatus);

  const statusLabel =
    syncStatus === 'syncing'
      ? t('status.syncing')
      : syncStatus === 'offline'
        ? t('status.offline')
        : t('status.online');

  return (
    <div className="min-h-screen px-4 py-4 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl flex-col gap-6">
        <header className="rounded-3xl border border-slate-200 bg-slate-950 px-5 py-4 text-white shadow-2xl shadow-sky-950/20 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-sky-200">{t('app.name')}</p>
              <h1 className="mt-1 text-2xl font-semibold">{t('app.tagline')}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">{statusLabel}</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                {t('status.pending')}: {pendingCount}
              </span>
              <LanguageToggle />
              <button
                type="button"
                onClick={() => {
                  setSyncStatus('syncing');
                  window.setTimeout(() => setSyncStatus('idle'), 1200);
                }}
                className="rounded-full bg-sky-500 px-3 py-1.5 font-medium text-white transition hover:bg-sky-400"
              >
                {statusLabel}
              </button>
              <button
                type="button"
                onClick={() => {
                  clearAuth();
                  navigate('/login');
                }}
                className="rounded-full border border-white/15 px-3 py-1.5 font-medium text-white transition hover:bg-white/10"
              >
                {t('auth.logout')}
              </button>
            </div>
          </div>
          <nav className="mt-5 flex flex-wrap gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    'rounded-full px-4 py-2 text-sm font-medium transition',
                    isActive ? 'bg-sky-400 text-slate-950' : 'bg-white/5 text-white hover:bg-white/10'
                  ].join(' ')
                }
              >
                {t(item.key)}
              </NavLink>
            ))}
          </nav>
          {user ? <p className="mt-4 text-sm text-sky-100">{user.name}</p> : null}
        </header>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}