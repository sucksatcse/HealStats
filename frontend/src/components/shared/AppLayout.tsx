import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '../LanguageToggle';
import { SyncStatusBadge } from './SyncStatusBadge';
import { OfflineBanner } from './OfflineBanner';
import { SurgeModeBanner } from './SurgeModeBanner';
import { useAppStore } from '../../store';

const navItems = [
  { to: '/dashboard', key: 'nav.dashboard' },
  { to: '/patients', key: 'nav.patients' },
  { to: '/encounters/new', key: 'nav.newEncounter' },
  { to: '/surveillance', key: 'nav.surveillance' },
  { to: '/audit', key: 'nav.audit' },
  { to: '/settings', key: 'nav.settings' }
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const active = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);

        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={[
              'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition',
              active
                ? 'bg-sky-50 text-sky-700 ring-1 ring-sky-200'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            ].join(' ')}
          >
            <span className={active ? 'text-sky-600' : 'text-slate-400'}>●</span>
            <span>{t(item.key)}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

export function AppLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppStore((state) => state.user);
  const clearAuth = useAppStore((state) => state.clearAuth);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const userLabel = useMemo(() => user?.name ?? t('common.unknown'), [t, user?.name]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!drawerOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDrawerOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [drawerOpen]);

  return (
    <div className="min-h-screen text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col lg:flex-row">
        <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white/95 px-4 py-5 shadow-sm lg:block">
          <div className="mb-6 rounded-[1.5rem] bg-sky-50 px-4 py-4 ring-1 ring-sky-100">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">{t('app.name')}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{t('app.tagline')}</p>
          </div>
          <NavList />
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <div className="sticky top-0 z-30 space-y-2 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur xl:px-6">
            <OfflineBanner />
            <SurgeModeBanner />
            <header className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 lg:hidden"
                aria-label={t('layout.openMenu')}
              >
                ☰
              </button>

              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500 text-lg font-black text-white shadow-soft">
                  H
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">{t('app.name')}</p>
                  <p className="truncate text-xs text-slate-500">{t('app.tagline')}</p>
                </div>
              </div>

              <div className="hidden flex-1 justify-center lg:flex">
                <SyncStatusBadge />
              </div>

              <div className="ml-auto flex items-center gap-3">
                <div className="hidden lg:block">
                  <LanguageToggle />
                </div>
                <div className="hidden items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 lg:flex">
                  <span className="font-medium text-slate-900">{userLabel}</span>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => {
                      clearAuth();
                      navigate('/login');
                    }}
                    className="font-semibold text-sky-700 transition hover:text-sky-900"
                  >
                    {t('layout.logout')}
                  </button>
                </div>
              </div>
            </header>
            <div className="flex justify-center lg:hidden">
              <SyncStatusBadge />
            </div>
          </div>

          <main className="flex-1 px-4 pb-24 pt-5 sm:px-6 lg:px-6 lg:pb-8">
            <Outlet />
          </main>

          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] pt-2 shadow-[0_-12px_36px_rgba(15,23,42,0.08)] lg:hidden">
            <div className="grid grid-cols-6 gap-1 overflow-x-auto pb-1 scrollbar-hide">
              {navItems.map((item) => {
                const active = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={[
                      'flex min-w-[72px] flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold transition',
                      active ? 'bg-sky-50 text-sky-700' : 'text-slate-500'
                    ].join(' ')}
                  >
                    <span className={active ? 'text-sky-600' : 'text-slate-400'}>●</span>
                    <span className="text-center leading-tight">{t(item.key)}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>

          {drawerOpen ? (
            <div className="fixed inset-0 z-40 lg:hidden">
              <button
                type="button"
                className="absolute inset-0 bg-slate-950/40"
                aria-label={t('layout.closeMenu')}
                onClick={() => setDrawerOpen(false)}
              />
              <aside className="absolute left-0 top-0 h-full w-[280px] max-w-[84vw] bg-white px-4 py-5 shadow-2xl shadow-slate-900/20">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">{t('app.name')}</p>
                    <p className="text-sm text-slate-500">{t('layout.menu')}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
                  >
                    ×
                  </button>
                </div>
                <NavList onNavigate={() => setDrawerOpen(false)} />
                <div className="mt-6 flex items-center justify-between rounded-[1.25rem] bg-slate-50 px-4 py-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{t('layout.loggedInAs')}</p>
                    <p className="text-sm font-semibold text-slate-900">{userLabel}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      clearAuth();
                      navigate('/login');
                    }}
                    className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white"
                  >
                    {t('layout.logout')}
                  </button>
                </div>
                <div className="mt-4 flex justify-center">
                  <LanguageToggle />
                </div>
              </aside>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}