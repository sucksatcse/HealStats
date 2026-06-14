import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const mockPatients = [
  { id: 'PT-1001', name: 'Amina Khatun', age: 34, sex: 'female', upazila: 'Sherpur Sadar', district: 'Sherpur', lastVisit: '2026-06-12' },
  { id: 'PT-1002', name: 'Mohammad Karim', age: 52, sex: 'male', upazila: 'Nandail', district: 'Mymensingh', lastVisit: '2026-06-10' },
  { id: 'PT-1003', name: 'Salma Akter', age: 19, sex: 'female', upazila: 'Bhaluka', district: 'Mymensingh', lastVisit: '2026-06-08' },
  { id: 'PT-1004', name: 'Faruk Hossain', age: 41, sex: 'male', upazila: 'Ramu', district: 'Coxs Bazar', lastVisit: '2026-06-13' },
  { id: 'PT-1005', name: 'Rina Begum', age: 27, sex: 'female', upazila: 'Savar', district: 'Dhaka', lastVisit: '2026-06-14' },
  { id: 'PT-1006', name: 'Shahidul Islam', age: 63, sex: 'male', upazila: 'Companiganj', district: 'Noakhali', lastVisit: '2026-06-11' },
  { id: 'PT-1007', name: 'Nusrat Jahan', age: 12, sex: 'female', upazila: 'Patiya', district: 'Chattogram', lastVisit: '2026-06-09' },
  { id: 'PT-1008', name: 'Rahim Uddin', age: 45, sex: 'male', upazila: 'Gaibandha Sadar', district: 'Gaibandha', lastVisit: '2026-06-07' }
];

export function PatientsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const filteredPatients = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return mockPatients;
    }

    return mockPatients.filter((patient) =>
      [patient.id, patient.name, patient.upazila, patient.district].some((value) => value.toLowerCase().includes(query))
    );
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="card rounded-2xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-label text-slate-500">{t('pages.patients.title')}</p>
            <h1 className="mt-2 text-page-title">{t('pages.patients.title')}</h1>
            <p className="mt-3 text-body">{t('pages.patients.description')}</p>
          </div>
          <Link to="/patients/new" className="btn-primary inline-flex items-center justify-center">
            {t('pages.patients.register')}
          </Link>
        </div>
      </div>

      <div className="card rounded-2xl">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">{t('pages.patients.search')}</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('pages.patients.search')}
            className="w-full rounded-2xl px-4 py-3"
          />
        </label>
      </div>

      {filteredPatients.length === 0 ? (
        <div className="card rounded-2xl border-dashed text-center text-slate-500">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-4xl">🩺</div>
          <h3 className="mt-5 text-section-title">No patients found</h3>
          <p className="mt-2 text-body">{t('pages.patients.empty')}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredPatients.map((patient) => (
            <Link
              key={patient.id}
              to={`/patients/${patient.id}`}
              className="group card-hover rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200"
            >
              <div className="flex items-start gap-4">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-bold text-white ${patient.name.charCodeAt(0) % 2 === 0 ? 'bg-blue-600' : 'bg-teal-600'}`}>
                  {patient.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{patient.name}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">{patient.age} yrs</span>
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">{t(`patient.${patient.sex}`)}</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-500">{patient.upazila}, {patient.district}</p>
                  <p className="mt-1 text-xs text-slate-400">Last visit {patient.lastVisit}</p>
                </div>
                <span className="text-slate-400 transition group-hover:translate-x-1">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}