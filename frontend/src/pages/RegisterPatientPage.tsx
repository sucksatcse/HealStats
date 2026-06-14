import { type ChangeEvent, type FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { db } from '../db/localDb';
import { useAppStore } from '../store';

const districtMap: Record<string, string[]> = {
  Dhaka: ['Savar', 'Dhamrai', 'Keraniganj'],
  Mymensingh: ['Bhaluka', 'Nandail', 'Muktagacha'],
  Sherpur: ['Sherpur Sadar', 'Nalitabari', 'Jhenaigati'],
  CoxsBazar: ['Ramu', 'Ukhiya', 'Teknaf']
};

const nationalities = ['Bangladeshi', 'Rohingya', 'Other'];

export function RegisterPatientPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pushToast = useAppStore((state) => state.pushToast);
  const [refugeeMode, setRefugeeMode] = useState(false);
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [sex, setSex] = useState('');
  const [district, setDistrict] = useState('Dhaka');
  const [upazila, setUpazila] = useState('Savar');
  const [unionName, setUnionName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [campName, setCampName] = useState('');
  const [shelterBlock, setShelterBlock] = useState('');
  const [nationality, setNationality] = useState('Bangladeshi');
  const [photoName, setPhotoName] = useState('');
  const [error, setError] = useState('');

  const upazilaOptions = useMemo(() => districtMap[district] ?? [], [district]);

  const handleDistrictChange = (value: string) => {
    setDistrict(value);
    setUpazila(districtMap[value]?.[0] ?? '');
  };

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPhotoName(event.target.files?.[0]?.name ?? '');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!fullName.trim()) {
      setError(t('pages.newPatient.validation.fullName'));
      return;
    }

    if (!sex) {
      setError(t('pages.newPatient.validation.sex'));
      return;
    }

    const record = {
      id: crypto.randomUUID(),
      name: fullName.trim(),
      fullName: fullName.trim(),
      dateOfBirth: refugeeMode ? undefined : dateOfBirth,
      sex,
      district: refugeeMode ? undefined : district,
      upazila: refugeeMode ? undefined : upazila,
      unionName: refugeeMode ? undefined : unionName,
      phoneNumber: refugeeMode ? undefined : phoneNumber,
      photoName: photoName || undefined,
      refugeeMode,
      campName: refugeeMode ? campName : undefined,
      shelterBlock: refugeeMode ? shelterBlock : undefined,
      nationality: refugeeMode ? nationality : undefined,
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending' as const,
      _dirty: true
    };

    await db.patients.add(record);
    pushToast({ message: t('pages.newPatient.success'), tone: 'success' });
    navigate('/patients', { replace: true });
  };

  return (
    <div className="space-y-6">
      <section className="card rounded-2xl">
        <div className="max-w-3xl space-y-2">
          <p className="text-label text-slate-500">{t('pages.newPatient.title')}</p>
          <h1 className="mt-2 text-page-title">{t('pages.newPatient.title')}</h1>
          <p className="text-body">{t('pages.newPatient.description')}</p>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-slate-200">
          <div>
            <p className="text-section-title">{t('pages.newPatient.refugeeMode')}</p>
            <p className="text-body">Toggle for camp-based registrations</p>
          </div>
          <button
            type="button"
            onClick={() => setRefugeeMode((value) => !value)}
            className={['relative h-8 w-16 rounded-full transition', refugeeMode ? 'bg-blue-600' : 'bg-slate-300'].join(' ')}
          >
            <span className={['absolute top-1 h-6 w-6 rounded-full bg-white transition', refugeeMode ? 'left-9' : 'left-1'].join(' ')} />
          </button>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="md:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-slate-700">{t('pages.newPatient.fullName')}</span>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="w-full rounded-2xl px-4 py-3"
            />
          </label>

          {!refugeeMode ? (
            <>
              <label>
                <span className="mb-2 block text-sm font-semibold text-slate-700">{t('pages.newPatient.dob')}</span>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(event) => setDateOfBirth(event.target.value)}
                  className="w-full rounded-2xl px-4 py-3"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-semibold text-slate-700">{t('pages.newPatient.phone')}</span>
                <input
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  className="w-full rounded-2xl px-4 py-3"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-semibold text-slate-700">{t('pages.newPatient.district')}</span>
                <select
                  value={district}
                  onChange={(event) => handleDistrictChange(event.target.value)}
                  className="w-full rounded-2xl px-4 py-3"
                >
                  {Object.keys(districtMap).map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="mb-2 block text-sm font-semibold text-slate-700">{t('pages.newPatient.upazila')}</span>
                <select
                  value={upazila}
                  onChange={(event) => setUpazila(event.target.value)}
                  className="w-full rounded-2xl px-4 py-3"
                >
                  {upazilaOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="mb-2 block text-sm font-semibold text-slate-700">{t('pages.newPatient.union')}</span>
                <input
                  value={unionName}
                  onChange={(event) => setUnionName(event.target.value)}
                  className="w-full rounded-2xl px-4 py-3"
                />
              </label>
            </>
          ) : (
            <>
              <label>
                <span className="mb-2 block text-sm font-semibold text-slate-700">{t('pages.newPatient.campName')}</span>
                <input
                  value={campName}
                  onChange={(event) => setCampName(event.target.value)}
                  className="w-full rounded-2xl px-4 py-3"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-semibold text-slate-700">{t('pages.newPatient.shelterBlock')}</span>
                <input
                  value={shelterBlock}
                  onChange={(event) => setShelterBlock(event.target.value)}
                  className="w-full rounded-2xl px-4 py-3"
                />
              </label>

              <label className="md:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-slate-700">{t('pages.newPatient.nationality')}</span>
                <select
                  value={nationality}
                  onChange={(event) => setNationality(event.target.value)}
                  className="w-full rounded-2xl px-4 py-3"
                >
                  {nationalities.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}

          <fieldset className="md:col-span-2">
            <legend className="mb-2 block text-sm font-semibold text-slate-700">{t('pages.newPatient.sex')}</legend>
            <div className="flex flex-wrap gap-3">
              {['male', 'female', 'other'].map((option) => (
                <label key={option} className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
                  <input type="radio" name="sex" value={option} checked={sex === option} onChange={() => setSex(option)} />
                  {t(`patient.${option}`)}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="md:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-slate-700">{t('pages.newPatient.photo')}</span>
            <input type="file" onChange={handlePhotoChange} className="block w-full rounded-2xl bg-white px-4 py-3 text-sm" />
            {photoName ? <p className="mt-2 text-xs text-slate-500">{photoName}</p> : null}
          </label>

          <button
            type="submit"
            className="btn-primary md:col-span-2 w-full py-3.5 text-base"
          >
            {t('pages.newPatient.submit')}
          </button>
        </div>
      </form>
    </div>
  );
}