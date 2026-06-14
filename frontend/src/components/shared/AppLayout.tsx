import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '../LanguageToggle';
import { SyncStatusBadge } from './SyncStatusBadge';
import { OfflineBanner } from './OfflineBanner';
import { SurgeModeBanner } from './SurgeModeBanner';
import { useAppStore } from '../../store';

const navItems = [
  { to: '/dashboard', key: 'nav.dashboard', icon: '🏠' },
  { to: '/patients', key: 'nav.patients', icon: '👥' },
  { to: '/encounters/new', key: 'nav.newEncounter', icon: '➕' },
  { to: '/surveillance', key: 'nav.surveillance', icon: '📊' },
  { to: '/audit', key: 'nav.audit', icon: '📋' },
  { to: '/settings', key: 'nav.settings', icon: '⚙️' }
];

function getInitials(name?: string | null) {
  if (!name) {
    return 'HS';
  }

  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'HS';
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <nav className="space-y-2">
      {navItems.map((item) => {
        const active = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);

        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={[
              'flex items-center gap-3 rounded-2xl border-l-4 px-4 py-3 text-sm font-semibold transition',
              active
                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                : 'border-transparent text-white/60 hover:bg-white/8 hover:text-white'
            ].join(' ')}
          >
            <span className={active ? 'text-blue-600' : 'text-white/50'}>{item.icon}</span>
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
  const userInitials = useMemo(() => getInitials(user?.name), [user?.name]);

  const titleMap = useMemo(
    () => ({
      '/dashboard': t('nav.dashboard'),
      '/patients': t('nav.patients'),
      '/encounters/new': t('nav.newEncounter'),
      '/surveillance': t('nav.surveillance'),
      '/audit': t('nav.audit'),
      '/settings': t('nav.settings')
    }),
    [t]
  );

  const pageTitle = useMemo(() => {
    const active = navItems.find((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`));
    return active ? titleMap[active.to as keyof typeof titleMap] : t('app.name');
  }, [location.pathname, t, titleMap]);

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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="sticky top-0 z-50">
        <OfflineBanner />
        <SurgeModeBanner />
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-[1680px] gap-0 lg:pl-[260px]">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col bg-slate-950 px-5 py-5 text-white shadow-[20px_0_60px_rgba(15,23,42,0.24)] lg:flex">
          <div className="mb-7 flex items-center gap-3 rounded-2xl bg-white/6 px-4 py-4 ring-1 ring-white/10">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-lg shadow-teal-500/25">
              <span className="text-lg">♥</span>
            </div>
            <div>
              <p className="text-sm font-extrabold tracking-tight">HealthStats</p>
              <p className="text-xs text-white/60">{t('app.tagline')}</p>
            </div>
          </div>

          <div className="mb-6 rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
            <p className="text-label text-white/50">{t('layout.menu')}</p>
            <p className="mt-1 text-sm font-medium text-white/75">{pageTitle}</p>
          </div>

          <NavList />

          <div className="mt-auto space-y-4 rounded-2xl bg-white/6 p-4 ring-1 ring-white/10">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                {userInitials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{userLabel}</p>
                <p className="inline-flex rounded-full bg-teal-500/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-300">
                  {user?.role ?? 'staff'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                clearAuth();
                navigate('/login');
              }}
              className="w-full rounded-xl border border-white/15 bg-white/8 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/12"
            >
              {t('layout.logout')}
            </button>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 lg:hidden"
                aria-label={t('layout.openMenu')}
              >
                ☰
              </button>

              <div className="min-w-0 lg:hidden">
                <p className="truncate text-lg font-extrabold text-slate-900">{pageTitle}</p>
              </div>

              <div className="hidden min-w-0 flex-1 lg:block">
                <p className="text-page-title">{pageTitle}</p>
              </div>

              <div className="absolute left-1/2 hidden -translate-x-1/2 lg:block">
                <SyncStatusBadge />
              </div>

              <div className="ml-auto flex items-center gap-3">
                <div className="hidden lg:block">
                  <LanguageToggle />
                </div>
                <button type="button" className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 lg:inline-flex">
                  🔔
                </button>
                <div className="hidden items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 lg:flex">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                    {userInitials}
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-slate-200 px-4 py-3 lg:hidden">
              <div className="flex items-center justify-between gap-3">
                <SyncStatusBadge />
                <LanguageToggle />
                <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600">
                  🔔
                </button>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">{userInitials}</div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
            <div key={location.pathname} className="fade-in-up">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/55"
            aria-label={t('layout.closeMenu')}
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-[320px] max-w-[86vw] bg-slate-950 px-5 py-5 text-white shadow-[24px_0_80px_rgba(15,23,42,0.35)]">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-500 text-white">♥</div>
                <div>
                  <p className="text-sm font-extrabold">HealthStats</p>
                  <p className="text-xs text-white/60">{t('layout.menu')}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-sm font-semibold text-white"
              >
                ×
              </button>
            </div>
            <NavList onNavigate={() => setDrawerOpen(false)} />
            <div className="mt-6 rounded-2xl bg-white/6 p-4 ring-1 ring-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">{userInitials}</div>
                <div>
                  <p className="font-semibold text-white">{userLabel}</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-teal-300">{user?.role ?? 'staff'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  clearAuth();
                  navigate('/login');
                }}
                className="mt-4 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900"
              >
                {t('layout.logout')}
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}