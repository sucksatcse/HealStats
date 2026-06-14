import { useTranslation } from 'react-i18next';
import { PageFrame } from '../components/PageFrame';

export function AuditLogPage() {
  const { t } = useTranslation();

  return <PageFrame title={t('pages.audit.title')} description={t('pages.audit.description')} />;
}