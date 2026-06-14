import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store';

const diagnosisTrend = [
  { day: 'Mon', dengue: 6, cholera: 1, pneumonia: 2 },
  { day: 'Tue', dengue: 8, cholera: 2, pneumonia: 2 },
  { day: 'Wed', dengue: 9, cholera: 1, pneumonia: 3 },
  { day: 'Thu', dengue: 12, cholera: 1, pneumonia: 2 },
  { day: 'Fri', dengue: 13, cholera: 2, pneumonia: 3 },
  { day: 'Sat', dengue: 15, cholera: 1, pneumonia: 2 },
  { day: 'Sun', dengue: 18, cholera: 1, pneumonia: 3 }
];

const ageSex = [
  { label: '0-9', male: 8, female: 7 },
  { label: '10-19', male: 10, female: 9 },
  { label: '20-39', male: 18, female: 16 },
  { label: '40-59', male: 11, female: 13 },
  { label: '60+', male: 7, female: 9 }
];

const geoRows = [
  { upazila: 'Sherpur Sadar', patientCount: 42, topDiagnosis: 'Dengue - A90', trend: '↑' },
  { upazila: 'Savar', patientCount: 38, topDiagnosis: 'Gastritis', trend: '→' },
  { upazila: 'Bhaluka', patientCount: 29, topDiagnosis: 'Pneumonia - J18', trend: '↑' },
  { upazila: 'Ramu', patientCount: 24, topDiagnosis: 'Cholera - A00', trend: '↓' }
];

export function SurveillancePage() {
  const { t } = useTranslation();
  const role = useAppStore((state) => state.role);
  const [dateRange, setDateRange] = useState('7d');
  const [district, setDistrict] = useState('All');
  const [upazila, setUpazila] = useState('All');

  const csv = useMemo(() => {
    return ['Upazila,Patient Count,Top Diagnosis,Trend', ...geoRows.map((row) => `${row.upazila},${row.patientCount},${row.topDiagnosis},${row.trend}`)].join('\n');
  }, []);

  if (role !== 'doctor' && role !== 'admin') {
    return (
      <div className="card rounded-2xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-3xl">⛔</div>
        <h1 className="mt-5 text-page-title">{t('common.accessDenied')}</h1>
        <p className="mt-3 text-body">{t('pages.surveillance.accessDenied')}</p>
      </div>
    );
  }

  const handleExport = () => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'surveillance-mock-data.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <section className="card rounded-2xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-label text-slate-500">{t('pages.surveillance.title')}</p>
            <h1 className="mt-2 text-page-title">{t('pages.surveillance.title')}</h1>
            <p className="mt-3 text-body">{t('pages.surveillance.description')}</p>
          </div>
          <button onClick={handleExport} className="btn-primary inline-flex items-center justify-center gap-2">
            ⬇️
            {t('pages.surveillance.export')}
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <select value={dateRange} onChange={(event) => setDateRange(event.target.value)} className="rounded-2xl px-4 py-3">
            <option value="7d">7 days</option>
            <option value="14d">14 days</option>
            <option value="30d">30 days</option>
          </select>
          <select value={district} onChange={(event) => setDistrict(event.target.value)} className="rounded-2xl px-4 py-3">
            <option>All districts</option>
            <option>Dhaka</option>
            <option>Mymensingh</option>
            <option>Sherpur</option>
          </select>
          <select value={upazila} onChange={(event) => setUpazila(event.target.value)} className="rounded-2xl px-4 py-3">
            <option>All upazilas</option>
            <option>Sherpur Sadar</option>
            <option>Savar</option>
            <option>Bhaluka</option>
          </select>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <article className="card rounded-2xl">
          <h2 className="text-section-title">{t('pages.surveillance.charts.diagnosisTrend')}</h2>
          <div className="mt-4 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={diagnosisTrend}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Line dataKey="dengue" stroke="#2563EB" strokeWidth={3} dot={{ r: 4, fill: '#fff' }} />
                <Line dataKey="cholera" stroke="#D97706" strokeWidth={3} dot={{ r: 4, fill: '#fff' }} />
                <Line dataKey="pneumonia" stroke="#0D9488" strokeWidth={3} dot={{ r: 4, fill: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="card rounded-2xl">
          <h2 className="text-section-title">{t('pages.surveillance.charts.ageSex')}</h2>
          <div className="mt-4 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageSex}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="male" radius={[10, 10, 0, 0]}>
                  {ageSex.map((entry, index) => <Cell key={entry.label} fill={index % 2 === 0 ? '#2563EB' : '#60A5FA'} />)}
                </Bar>
                <Bar dataKey="female" radius={[10, 10, 0, 0]}>
                  {ageSex.map((entry, index) => <Cell key={entry.label} fill={index % 2 === 0 ? '#0D9488' : '#2DD4BF'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>

      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-section-title">Geographic Summary</h2>
            <button className="btn-secondary inline-flex items-center justify-center gap-2 px-4 py-2" type="button">
              ⬇️ Export
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">{t('pages.surveillance.geography.upazila')}</th>
                <th className="px-5 py-3 font-semibold">{t('pages.surveillance.geography.patientCount')}</th>
                <th className="px-5 py-3 font-semibold">{t('pages.surveillance.geography.topDiagnosis')}</th>
                <th className="px-5 py-3 font-semibold">{t('pages.surveillance.geography.trend')}</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {geoRows.map((row) => (
                <tr key={row.upazila} className="odd:bg-slate-50">
                  <td className="px-5 py-4 font-semibold text-slate-900">{row.upazila}</td>
                  <td className="px-5 py-4 text-slate-600">{row.patientCount}</td>
                  <td className="px-5 py-4 text-slate-600">{row.topDiagnosis}</td>
                  <td className={['px-5 py-4 font-semibold', row.trend === '↓' ? 'text-rose-600' : row.trend === '↑' ? 'text-emerald-600' : 'text-slate-500'].join(' ')}>
                    {row.trend === '↓' ? '↓ Declining' : row.trend === '↑' ? '↑ Rising' : '→ Stable'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}