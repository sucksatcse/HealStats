import { useTranslation } from 'react-i18next';
import { PageFrame } from '../components/PageFrame';

export function SurveillancePage() {
  const { t } = useTranslation();

  return <PageFrame title={t('pages.surveillance.title')} description={t('pages.surveillance.description')} />;
}