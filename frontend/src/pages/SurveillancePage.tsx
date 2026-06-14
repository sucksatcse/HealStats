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
      <div className="rounded-[2rem] border border-rose-200 bg-white p-8 text-center shadow-soft">
        <h1 className="text-2xl font-semibold text-slate-900">{t('common.accessDenied')}</h1>
        <p className="mt-3 text-sm text-slate-600">{t('pages.surveillance.accessDenied')}</p>
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
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{t('pages.surveillance.title')}</h1>
            <p className="mt-2 text-sm text-slate-600">{t('pages.surveillance.description')}</p>
          </div>
          <button onClick={handleExport} className="rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-soft">
            {t('pages.surveillance.export')}
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <select value={dateRange} onChange={(event) => setDateRange(event.target.value)} className="rounded-2xl border border-slate-300 px-4 py-3">
            <option value="7d">7 days</option>
            <option value="14d">14 days</option>
            <option value="30d">30 days</option>
          </select>
          <select value={district} onChange={(event) => setDistrict(event.target.value)} className="rounded-2xl border border-slate-300 px-4 py-3">
            <option>All districts</option>
            <option>Dhaka</option>
            <option>Mymensingh</option>
            <option>Sherpur</option>
          </select>
          <select value={upazila} onChange={(event) => setUpazila(event.target.value)} className="rounded-2xl border border-slate-300 px-4 py-3">
            <option>All upazilas</option>
            <option>Sherpur Sadar</option>
            <option>Savar</option>
            <option>Bhaluka</option>
          </select>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-semibold text-slate-900">{t('pages.surveillance.charts.diagnosisTrend')}</h2>
          <div className="mt-4 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={diagnosisTrend}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Line dataKey="dengue" stroke="#0EA5E9" strokeWidth={3} dot={false} />
                <Line dataKey="cholera" stroke="#f59e0b" strokeWidth={3} dot={false} />
                <Line dataKey="pneumonia" stroke="#64748b" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-semibold text-slate-900">{t('pages.surveillance.charts.ageSex')}</h2>
          <div className="mt-4 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageSex}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="male" radius={[10, 10, 0, 0]}>
                  {ageSex.map((entry, index) => <Cell key={entry.label} fill={index % 2 === 0 ? '#0EA5E9' : '#38c7ff'} />)}
                </Bar>
                <Bar dataKey="female" radius={[10, 10, 0, 0]}>
                  {ageSex.map((entry, index) => <Cell key={entry.label} fill={index % 2 === 0 ? '#fb7185' : '#fda4af'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>

      <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-soft">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Geographic Summary</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">{t('pages.surveillance.geography.upazila')}</th>
                <th className="px-5 py-3 font-semibold">{t('pages.surveillance.geography.patientCount')}</th>
                <th className="px-5 py-3 font-semibold">{t('pages.surveillance.geography.topDiagnosis')}</th>
                <th className="px-5 py-3 font-semibold">{t('pages.surveillance.geography.trend')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {geoRows.map((row) => (
                <tr key={row.upazila}>
                  <td className="px-5 py-4 font-medium text-slate-900">{row.upazila}</td>
                  <td className="px-5 py-4 text-slate-600">{row.patientCount}</td>
                  <td className="px-5 py-4 text-slate-600">{row.topDiagnosis}</td>
                  <td className="px-5 py-4 text-slate-600">{row.trend}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}