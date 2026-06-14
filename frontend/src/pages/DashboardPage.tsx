import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { useTranslation } from 'react-i18next';

const diagnosisTrend = [
  { day: 'Mon', dengue: 3, cholera: 1, pneumonia: 2 },
  { day: 'Tue', dengue: 4, cholera: 1, pneumonia: 1 },
  { day: 'Wed', dengue: 5, cholera: 2, pneumonia: 2 },
  { day: 'Thu', dengue: 7, cholera: 1, pneumonia: 3 },
  { day: 'Fri', dengue: 8, cholera: 2, pneumonia: 3 },
  { day: 'Sat', dengue: 9, cholera: 1, pneumonia: 2 },
  { day: 'Sun', dengue: 10, cholera: 1, pneumonia: 2 },
  { day: 'Mon', dengue: 11, cholera: 2, pneumonia: 3 },
  { day: 'Tue', dengue: 12, cholera: 1, pneumonia: 2 },
  { day: 'Wed', dengue: 11, cholera: 2, pneumonia: 1 },
  { day: 'Thu', dengue: 13, cholera: 1, pneumonia: 2 },
  { day: 'Fri', dengue: 14, cholera: 1, pneumonia: 3 },
  { day: 'Sat', dengue: 15, cholera: 2, pneumonia: 2 },
  { day: 'Sun', dengue: 16, cholera: 1, pneumonia: 2 }
];

const ageSexData = [
  { bucket: '0-9', male: 6, female: 5 },
  { bucket: '10-19', male: 10, female: 9 },
  { bucket: '20-39', male: 18, female: 15 },
  { bucket: '40-59', male: 12, female: 14 },
  { bucket: '60+', male: 8, female: 10 }
];

const statCards = [
  { labelKey: 'pages.dashboard.stats.patients', value: '142' },
  { labelKey: 'pages.dashboard.stats.encounters', value: '38' },
  { labelKey: 'pages.dashboard.stats.diagnosis', value: 'Dengue - A90' },
  { labelKey: 'pages.dashboard.stats.pendingSync', value: '3' }
];

export function DashboardPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-rose-200 bg-rose-50 px-5 py-4 text-rose-900 shadow-sm">
        <p className="text-sm font-semibold">{t('pages.dashboard.alerts.title')}</p>
        <p className="mt-1 text-sm leading-6">⚠️ {t('pages.dashboard.alerts.message')}</p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <article key={card.labelKey} className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-soft">
            <p className="text-sm font-medium text-slate-500">{t(card.labelKey)}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{card.value}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{t('pages.dashboard.charts.diagnosisTrend')}</h2>
              <p className="text-sm text-slate-500">Dengue, Cholera, and Pneumonia over the last 14 days</p>
            </div>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={diagnosisTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="dengue" name={t('pages.dashboard.charts.legendDengue')} stroke="#0EA5E9" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="cholera" name={t('pages.dashboard.charts.legendCholera')} stroke="#f59e0b" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="pneumonia" name={t('pages.dashboard.charts.legendPneumonia')} stroke="#64748b" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-semibold text-slate-900">{t('pages.dashboard.charts.ageSex')}</h2>
          <div className="mt-4 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageSexData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
                <XAxis dataKey="bucket" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="male" name={t('pages.dashboard.charts.male')} radius={[10, 10, 0, 0]}>
                  {ageSexData.map((entry, index) => (
                    <Cell key={`male-${entry.bucket}`} fill={index % 2 === 0 ? '#0EA5E9' : '#38c7ff'} />
                  ))}
                </Bar>
                <Bar dataKey="female" name={t('pages.dashboard.charts.female')} radius={[10, 10, 0, 0]}>
                  {ageSexData.map((entry, index) => (
                    <Cell key={`female-${entry.bucket}`} fill={index % 2 === 0 ? '#fb7185' : '#fda4af'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>
    </div>
  );
}