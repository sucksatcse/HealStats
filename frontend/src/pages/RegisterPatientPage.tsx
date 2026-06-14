import { useTranslation } from 'react-i18next';
import { PageFrame } from '../components/PageFrame';

export function RegisterPatientPage() {
  const { t } = useTranslation();

  return (
    <PageFrame title={t('pages.newPatient.title')} description={t('pages.newPatient.description')}>
      <div className="grid gap-4 md:grid-cols-2">
        <input className="rounded-2xl border border-slate-300 px-4 py-3" placeholder="Patient name" />
        <input className="rounded-2xl border border-slate-300 px-4 py-3" placeholder="National ID / local ID" />
      </div>
    </PageFrame>
  );
}