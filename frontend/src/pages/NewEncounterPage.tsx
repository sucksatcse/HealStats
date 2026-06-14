import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageFrame } from '../components/PageFrame';

export function NewEncounterPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patientId');

  return (
    <PageFrame title={t('pages.newEncounter.title')} description={t('pages.newEncounter.description')}>
      <p className="text-sm text-slate-600">Patient: {patientId ?? 'not selected'}</p>
    </PageFrame>
  );
}