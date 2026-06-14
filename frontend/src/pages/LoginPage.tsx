import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { useAppStore, type UserRole } from '../store';
import { LanguageToggle } from '../components/LanguageToggle';

const roles: UserRole[] = ['doctor', 'admin', 'nurse', 'staff'];

export function LoginPage() {
  const { t } = useTranslation();
  const token = useAppStore((state) => state.token);
  const setAuth = useAppStore((state) => state.setAuth);
  const [name, setName] = useState('Dr. Rahman');
  const [role, setRole] = useState<UserRole>('doctor');

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuth({
      user: { id: 'demo-user', name, role },
      facilityId: 'demo-facility',
      token: 'demo-token'
    });
  };

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col justify-center gap-6 lg:flex-row lg:items-center">
        <section className="max-w-xl space-y-5 rounded-[2rem] bg-slate-950 p-8 text-white shadow-2xl shadow-sky-950/20">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-200">{t('app.name')}</p>
          <h1 className="text-4xl font-semibold tracking-tight">{t('app.tagline')}</h1>
          <p className="text-sm leading-6 text-slate-300">
            Offline-first access for rural hospitals, with local storage, queued sync, and bilingual workflows.
          </p>
          <div className="flex gap-3">
            <LanguageToggle />
          </div>
        </section>

        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md space-y-5 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-soft"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">{t('auth.username')}</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none ring-0 transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">{t('auth.role')}</label>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as UserRole)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            >
              {roles.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">{t('auth.password')}</label>
            <input
              type="password"
              defaultValue="offline-demo"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-primary px-4 py-3 font-semibold text-white shadow-soft transition hover:bg-sky-500"
          >
            {t('auth.login')}
          </button>
        </form>
      </div>
    </div>
  );
}