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
      <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-soft lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{t('pages.patients.title')}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{t('pages.patients.description')}</p>
        </div>
        <Link
          to="/patients/new"
          className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-primary-600"
        >
          {t('pages.patients.register')}
        </Link>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-soft">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">{t('pages.patients.search')}</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('pages.patients.search')}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          />
        </label>
      </div>

      {filteredPatients.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-slate-500 shadow-soft">
          {t('pages.patients.empty')}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredPatients.map((patient) => (
            <Link
              key={patient.id}
              to={`/patients/${patient.id}`}
              className="group rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-[0_18px_45px_rgba(14,165,233,0.12)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">{patient.id}</p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">{patient.name}</h2>
                </div>
                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                  {t(`patient.${patient.sex}`)}
                </span>
              </div>

              <dl className="mt-5 grid gap-3 text-sm text-slate-600">
                <div className="flex justify-between gap-4">
                  <dt>{t('pages.patients.age')}</dt>
                  <dd className="font-medium text-slate-900">{patient.age}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>{t('pages.patients.upazila')}</dt>
                  <dd className="font-medium text-slate-900">{patient.upazila}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>{t('pages.patients.district')}</dt>
                  <dd className="font-medium text-slate-900">{patient.district}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>{t('pages.patients.lastVisit')}</dt>
                  <dd className="font-medium text-slate-900">{patient.lastVisit}</dd>
                </div>
              </dl>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}