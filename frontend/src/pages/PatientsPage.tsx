import { PageFrame } from '../components/PageFrame';
import { useTranslation } from 'react-i18next';

const demoPatients = [
  { id: 'p-1001', name: 'Amina Khatun', age: 34 },
  { id: 'p-1002', name: 'Mohammad Karim', age: 52 },
  { id: 'p-1003', name: 'Salma Akter', age: 19 }
];

export function PatientsPage() {
  const { t } = useTranslation();

  return (
    <PageFrame title={t('pages.patients.title')} description={t('pages.patients.description')}>
      <div className="grid gap-4 md:grid-cols-3">
        {demoPatients.map((patient) => (
          <article key={patient.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">{patient.id}</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-900">{patient.name}</h2>
            <p className="text-sm text-slate-600">Age {patient.age}</p>
          </article>
        ))}
      </div>
    </PageFrame>
  );
}