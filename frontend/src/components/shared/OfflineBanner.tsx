import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export function OfflineBanner() {
  const { t } = useTranslation();
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const updateOnline = () => setOffline(false);
    const updateOffline = () => setOffline(true);

    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOffline);

    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOffline);
    };
  }, []);

  if (!offline) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 shadow-sm">
      {t('common.offlineBanner')}
    </div>
  );
}