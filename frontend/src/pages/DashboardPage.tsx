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
import { useAppStore } from '../store';

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
  { labelKey: 'pages.dashboard.stats.patients', value: '142', icon: '👥', border: 'border-l-blue-500', tint: 'bg-blue-50 text-blue-700' },
  { labelKey: 'pages.dashboard.stats.encounters', value: '38', icon: '🩺', border: 'border-l-teal-500', tint: 'bg-teal-50 text-teal-700' },
  { labelKey: 'pages.dashboard.stats.diagnosis', value: 'Dengue (A90)', icon: '🦟', border: 'border-l-amber-500', tint: 'bg-amber-50 text-amber-700' },
  { labelKey: 'pages.dashboard.stats.pendingSync', value: '3', icon: '🔄', border: 'border-l-rose-500', tint: 'bg-rose-50 text-rose-700' }
];

export function DashboardPage() {
  const { t } = useTranslation();
  const pendingCount = useAppStore((state) => state.ui.pendingCount);

  const chartTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ color?: string; name?: string; value?: number }>; label?: string }) => {
    if (!active || !payload?.length) {
      return null;
    }

    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
        <div className="mt-2 space-y-1">
          {payload.map((entry) => (
            <p key={entry.name} className="text-sm font-medium text-slate-700">
              <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-2 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-orange-500 px-5 py-4 text-white shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-label text-white/70">{t('pages.dashboard.alerts.title')}</p>
            <p className="mt-2 text-sm font-semibold leading-6">⚠️ {t('pages.dashboard.alerts.message')}</p>
          </div>
          <button type="button" className="rounded-full bg-white/15 px-3 py-2 text-sm font-semibold text-white">
            ×
          </button>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card, index) => (
          <article key={card.labelKey} className={`card card-hover rounded-2xl border-l-4 ${card.border} fade-in-up`} style={{ animationDelay: `${index * 50}ms` }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-label text-slate-500">{t(card.labelKey)}</p>
                <p className="mt-3 text-[clamp(1.6rem,3vw,2.5rem)] font-extrabold tracking-tight text-slate-900">{card.value}</p>
                <p className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${card.tint}`}>
                  {index === 3 ? (pendingCount > 0 ? 'Tap to sync now' : 'All caught up') : index === 2 ? '23 cases this week' : index === 1 ? '↑ 5 from last week' : '↑ 12 this month'}
                </p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.tint}`}>{card.icon}</div>
            </div>
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <article className="card rounded-2xl fade-in-up">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-label text-slate-500">{t('pages.dashboard.charts.diagnosisTrend')}</p>
              <h2 className="mt-2 text-section-title">Diagnosis Trend — Last 14 Days</h2>
            </div>
            <p className="text-sm text-slate-500">Dengue, Cholera, Pneumonia</p>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={diagnosisTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip content={chartTooltip} />
                <Legend />
                <Line type="monotone" dataKey="dengue" name={t('pages.dashboard.charts.legendDengue')} stroke="#2563EB" strokeWidth={3} dot={{ r: 4, strokeWidth: 3, fill: '#fff' }} activeDot={{ r: 7 }} />
                <Line type="monotone" dataKey="cholera" name={t('pages.dashboard.charts.legendCholera')} stroke="#D97706" strokeWidth={3} dot={{ r: 4, strokeWidth: 3, fill: '#fff' }} activeDot={{ r: 7 }} />
                <Line type="monotone" dataKey="pneumonia" name={t('pages.dashboard.charts.legendPneumonia')} stroke="#0D9488" strokeWidth={3} dot={{ r: 4, strokeWidth: 3, fill: '#fff' }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="card rounded-2xl fade-in-up">
          <p className="text-label text-slate-500">{t('pages.dashboard.charts.ageSex')}</p>
          <h2 className="mt-2 text-section-title">Age & Sex Distribution</h2>
          <div className="mt-4 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageSexData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="bucket" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip content={chartTooltip} />
                <Legend />
                <Bar dataKey="male" name={t('pages.dashboard.charts.male')} radius={[12, 12, 0, 0]}>
                  {ageSexData.map((entry, index) => (
                    <Cell key={`male-${entry.bucket}`} fill={index % 2 === 0 ? '#2563EB' : '#60A5FA'} />
                  ))}
                </Bar>
                <Bar dataKey="female" name={t('pages.dashboard.charts.female')} radius={[12, 12, 0, 0]}>
                  {ageSexData.map((entry, index) => (
                    <Cell key={`female-${entry.bucket}`} fill={index % 2 === 0 ? '#0D9488' : '#2DD4BF'} />
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