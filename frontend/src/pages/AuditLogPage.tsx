import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store';

const auditRows = [
  { timestamp: '2026-06-15 09:10', user: 'Dr. Rahman', action: 'CREATE_PATIENT', target: 'patients', recordId: 'PT-1008' },
  { timestamp: '2026-06-15 09:18', user: 'Dr. Rahman', action: 'CREATE_ENCOUNTER', target: 'encounters', recordId: 'ENC-2001' },
  { timestamp: '2026-06-15 09:33', user: 'Admin User', action: 'LOGIN', target: 'auth', recordId: 'AUTH-01' },
  { timestamp: '2026-06-14 17:25', user: 'Nurse Asha', action: 'UPDATE_PATIENT', target: 'patients', recordId: 'PT-1003' },
  { timestamp: '2026-06-14 12:40', user: 'Dr. Rahman', action: 'CREATE_PRESCRIPTION', target: 'prescriptions', recordId: 'RX-901' },
  { timestamp: '2026-06-13 15:05', user: 'Admin User', action: 'EXPORT_REPORT', target: 'dashboard', recordId: 'RPT-12' },
  { timestamp: '2026-06-12 10:15', user: 'Nurse Asha', action: 'LOGIN', target: 'auth', recordId: 'AUTH-02' },
  { timestamp: '2026-06-11 14:55', user: 'Dr. Rahman', action: 'SYNC_QUEUE', target: 'sync', recordId: 'SYNC-07' },
  { timestamp: '2026-06-10 08:20', user: 'Admin User', action: 'DELETE_RECORD', target: 'patients', recordId: 'PT-0991' },
  { timestamp: '2026-06-09 11:45', user: 'Nurse Asha', action: 'LOGIN', target: 'auth', recordId: 'AUTH-03' }
];

export function AuditLogPage() {
  const { t } = useTranslation();
  const role = useAppStore((state) => state.role);
  const [actionFilter, setActionFilter] = useState('All');
  const [userFilter, setUserFilter] = useState('All');
  const [page, setPage] = useState(1);

  const users = useMemo(() => ['All', ...new Set(auditRows.map((row) => row.user))], []);
  const actions = useMemo(() => ['All', ...new Set(auditRows.map((row) => row.action))], []);

  if (role !== 'admin') {
    return (
      <div className="card rounded-2xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-3xl">⛔</div>
        <h1 className="mt-5 text-page-title">{t('common.accessDenied')}</h1>
        <p className="mt-3 text-body">{t('pages.audit.accessDenied')}</p>
      </div>
    );
  }

  const filteredRows = auditRows.filter((row) =>
    (actionFilter === 'All' || row.action === actionFilter) && (userFilter === 'All' || row.user === userFilter)
  );

  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const visibleRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      <section className="card rounded-2xl">
        <div>
          <p className="text-label text-slate-500">{t('pages.audit.title')}</p>
          <h1 className="mt-2 text-page-title">{t('pages.audit.title')}</h1>
          <p className="mt-3 text-body">{t('pages.audit.description')}</p>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <select value={actionFilter} onChange={(event) => setActionFilter(event.target.value)} className="rounded-2xl px-4 py-3">
            {actions.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select value={userFilter} onChange={(event) => setUserFilter(event.target.value)} className="rounded-2xl px-4 py-3">
            {users.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
      </section>

      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">{t('pages.audit.columns.timestamp')}</th>
                <th className="px-5 py-3 font-semibold">{t('pages.audit.columns.user')}</th>
                <th className="px-5 py-3 font-semibold">{t('pages.audit.columns.action')}</th>
                <th className="px-5 py-3 font-semibold">{t('pages.audit.columns.target')}</th>
                <th className="px-5 py-3 font-semibold">{t('pages.audit.columns.recordId')}</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {visibleRows.map((row) => (
                <tr key={`${row.timestamp}-${row.recordId}`} className="odd:bg-slate-50">
                  <td className="px-5 py-4 font-mono text-xs text-slate-500">{row.timestamp}</td>
                  <td className="px-5 py-4 font-semibold text-slate-900">{row.user}</td>
                  <td className="px-5 py-4">
                    <span className={[
                      'rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-[0.16em]',
                      row.action.includes('CREATE') ? 'bg-emerald-100 text-emerald-700' : row.action === 'LOGIN' ? 'bg-slate-100 text-slate-600' : row.action.includes('UPDATE') ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                    ].join(' ')}>
                      {row.action}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{row.target}</td>
                  <td className="px-5 py-4 font-mono text-xs text-slate-500">{row.recordId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">{t('pages.audit.pagination.pageOf', { page, total: totalPages })}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              className="btn-secondary rounded-2xl disabled:opacity-40"
              disabled={page === 1}
            >
              {t('pages.audit.pagination.previous')}
            </button>
            <button
              type="button"
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              className="btn-secondary rounded-2xl disabled:opacity-40"
              disabled={page === totalPages}
            >
              {t('pages.audit.pagination.next')}
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}