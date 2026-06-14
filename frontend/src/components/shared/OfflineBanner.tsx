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
    <div className="rounded-xl bg-gradient-to-r from-amber-100 via-amber-50 to-orange-100 px-4 py-2.5 text-center text-sm font-semibold text-amber-900 shadow-sm ring-1 ring-amber-200">
      {t('common.offlineBanner')}
    </div>
  );
}