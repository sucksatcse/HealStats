import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageFrame } from '../components/PageFrame';

export function PatientDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation();

  return (
    <PageFrame title={t('pages.patientDetail.title')} description={t('pages.patientDetail.description')}>
      <p className="text-sm text-slate-600">Patient ID: {id ?? 'unknown'}</p>
    </PageFrame>
  );
}