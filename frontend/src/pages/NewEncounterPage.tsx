import { type FormEvent, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { db } from '../db/localDb';
import { useAppStore } from '../store';

const icd10 = [
  { code: 'A00', name: 'Cholera', nameBn: 'কলেরা' },
  { code: 'A90', name: 'Dengue fever', nameBn: 'ডেঙ্গু জ্বর' },
  { code: 'B34', name: 'Viral infection, unspecified', nameBn: 'অপরিচিত ভাইরাস সংক্রমণ' },
  { code: 'E11', name: 'Type 2 diabetes mellitus', nameBn: 'টাইপ ২ ডায়াবেটিস মেলিটাস' },
  { code: 'I10', name: 'Essential (primary) hypertension', nameBn: 'প্রাথমিক উচ্চ রক্তচাপ' },
  { code: 'J00', name: 'Acute nasopharyngitis', nameBn: 'তীব্র নাসোফ্যারিঞ্জাইটিস' },
  { code: 'J18', name: 'Pneumonia, unspecified organism', nameBn: 'অজানা জীবাণুর নিউমোনিয়া' },
  { code: 'K52', name: 'Gastroenteritis and colitis', nameBn: 'গ্যাস্ট্রোএন্টেরাইটিস ও কোলাইটিস' },
  { code: 'L20', name: 'Atopic dermatitis', nameBn: 'অ্যাটোপিক ডার্মাটাইটিস' },
  { code: 'M54', name: 'Dorsalgia', nameBn: 'পিঠে ব্যথা' },
  { code: 'N39', name: 'Urinary tract disorder', nameBn: 'মূত্রনালীর সমস্যা' },
  { code: 'R05', name: 'Cough', nameBn: 'কাশি' },
  { code: 'R50', name: 'Fever of other and unknown origin', nameBn: 'অজানা জ্বর' },
  { code: 'S93', name: 'Dislocation and sprain of ankle', nameBn: 'গোড়ালির মচকানো/বিস্ফোরণ' },
  { code: 'Z00', name: 'General examination', nameBn: 'সাধারণ পরীক্ষা' }
];

const medicines = [
  'Paracetamol',
  'ORS',
  'Cetirizine',
  'Omeprazole',
  'Amoxicillin',
  'Azithromycin',
  'Metformin',
  'Amlodipine',
  'Ibuprofen',
  'Ondansetron'
];

const quickChips = ['Fever', 'Cough', 'Diarrhea', 'Headache', 'Pain', 'Vomiting', 'Rash'] as const;

export function NewEncounterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pushToast = useAppStore((state) => state.pushToast);
  const patientId = searchParams.get('patientId') ?? 'PT-1001';
  const [step, setStep] = useState(1);
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [temperature, setTemperature] = useState('');
  const [pulse, setPulse] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [diagnosisQuery, setDiagnosisQuery] = useState('');
  const [selectedDiagnosis, setSelectedDiagnosis] = useState(icd10[1]);
  const [rows, setRows] = useState([
    { id: crypto.randomUUID(), drugName: 'Paracetamol', dosage: '500 mg', frequency: '3x/day', duration: '5 days' }
  ]);

  const stepTitles = [
    t('pages.newEncounter.steps.vitals'),
    t('pages.newEncounter.steps.complaint'),
    t('pages.newEncounter.steps.diagnosis'),
    t('pages.newEncounter.steps.prescriptions')
  ];

  const diagnosisOptions = useMemo(() => {
    const query = diagnosisQuery.trim().toLowerCase();
    if (!query) {
      return icd10;
    }
    return icd10.filter((item) => `${item.code} ${item.name} ${item.nameBn}`.toLowerCase().includes(query));
  }, [diagnosisQuery]);

  const updateRow = (id: string, field: 'drugName' | 'dosage' | 'frequency' | 'duration', value: string) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const removeRow = (id: string) => {
    setRows((current) => current.filter((row) => row.id !== id));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await db.encounters.add({
      id: crypto.randomUUID(),
      patientId,
      createdAt: new Date().toISOString(),
      vitals: { systolic, diastolic, temperature, pulse, weight, height },
      chiefComplaint,
      diagnosis: selectedDiagnosis,
      prescriptions: rows,
      _dirty: true
    });

    pushToast({ message: t('pages.newEncounter.success'), tone: 'success' });
    navigate(`/patients/${patientId}`, { replace: true });
  };

  const stepMeta = stepTitles.map((title, index) => ({ title, number: index + 1 }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="card rounded-2xl">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-label text-slate-500">{t('pages.newEncounter.title')}</p>
            <h1 className="mt-2 text-page-title">{t('pages.newEncounter.title')}</h1>
            <p className="mt-3 text-body">{t('pages.newEncounter.description')}</p>
          </div>
          <p className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
            {t('pages.newEncounter.patient')}: {patientId}
          </p>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          {stepMeta.map((item) => {
            const completed = step > item.number;
            const active = step === item.number;

            return (
              <div key={item.title} className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className={[
                    'flex h-11 w-11 items-center justify-center rounded-full border-2 text-sm font-bold transition',
                    completed ? 'border-blue-600 bg-blue-600 text-white' : active ? 'border-blue-600 bg-white text-blue-600 pulse-ring' : 'border-slate-300 bg-white text-slate-400'
                  ].join(' ')}>
                    {completed ? '✓' : item.number}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                      {t('pages.newEncounter.step')} {item.number} {t('pages.newEncounter.stepOf')} 4
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{item.title}</p>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-slate-200">
                  <div className="h-1.5 rounded-full bg-blue-600 transition-all" style={{ width: step >= item.number ? '100%' : '0%' }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {step === 1 ? (
        <section className="card rounded-2xl fade-in-up">
          <h2 className="text-section-title">{t('pages.newEncounter.steps.vitals')}</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              { label: t('pages.newEncounter.vitals.bp'), fields: [
                <div key="sys" className="relative"><input value={systolic} onChange={(event) => setSystolic(event.target.value)} className="w-full rounded-2xl px-4 py-3 pr-16" placeholder="120" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">mmHg</span></div>,
                <div key="dia" className="relative"><input value={diastolic} onChange={(event) => setDiastolic(event.target.value)} className="w-full rounded-2xl px-4 py-3 pr-16" placeholder="80" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">mmHg</span></div>
              ] },
              { label: t('pages.newEncounter.vitals.temperature'), fields: [<div key="temp" className="relative"><input value={temperature} onChange={(event) => setTemperature(event.target.value)} className="w-full rounded-2xl px-4 py-3 pr-16" placeholder="38.2" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">°C</span></div>] },
              { label: t('pages.newEncounter.vitals.pulse'), fields: [<div key="pulse" className="relative"><input value={pulse} onChange={(event) => setPulse(event.target.value)} className="w-full rounded-2xl px-4 py-3 pr-16" placeholder="96" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">bpm</span></div>] },
              { label: t('pages.newEncounter.vitals.weight'), fields: [<div key="weight" className="relative"><input value={weight} onChange={(event) => setWeight(event.target.value)} className="w-full rounded-2xl px-4 py-3 pr-16" placeholder="54" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">kg</span></div>] },
              { label: t('pages.newEncounter.vitals.height'), fields: [<div key="height" className="relative"><input value={height} onChange={(event) => setHeight(event.target.value)} className="w-full rounded-2xl px-4 py-3 pr-16" placeholder="162" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">cm</span></div>] }
            ].map((item) => (
              <div key={item.label} className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-700">{item.label}</p>
                <div className="grid gap-3 sm:grid-cols-2">{item.fields}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="card rounded-2xl fade-in-up">
          <h2 className="text-section-title">{t('pages.newEncounter.complaint.title')}</h2>
          <textarea
            value={chiefComplaint}
            onChange={(event) => setChiefComplaint(event.target.value)}
            rows={6}
            className="mt-4 w-full rounded-2xl px-4 py-3"
            placeholder={t('pages.newEncounter.complaint.title')}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            {quickChips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setChiefComplaint((current) => `${current}${current ? ' ' : ''}${chip}`)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50"
              >
                {t(`pages.newEncounter.complaint.chips.${chip}`)}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="card rounded-2xl fade-in-up">
          <h2 className="text-section-title">{t('pages.newEncounter.diagnosis.title')}</h2>
          <div className="mt-4 space-y-4">
            <input
              value={diagnosisQuery}
              onChange={(event) => setDiagnosisQuery(event.target.value)}
              className="w-full rounded-2xl px-4 py-3"
              placeholder={t('pages.newEncounter.diagnosis.placeholder')}
            />

            <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              {diagnosisOptions.slice(0, 8).map((item) => {
                const active = selectedDiagnosis.code === item.code;
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setSelectedDiagnosis(item)}
                    className={[
                      'rounded-2xl px-4 py-3 text-left transition',
                      active ? 'bg-blue-50 text-blue-800 ring-1 ring-blue-200' : 'bg-white text-slate-700 hover:bg-slate-100'
                    ].join(' ')}
                  >
                    <p className="text-sm font-semibold"><span className="mr-2 rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white">{item.code}</span>{item.name}</p>
                    <p className="text-sm text-slate-500">{item.nameBn}</p>
                  </button>
                );
              })}
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-medium text-blue-800">
              {t('pages.newEncounter.diagnosis.selected')}: {selectedDiagnosis.code} - {selectedDiagnosis.name} / {selectedDiagnosis.nameBn}
            </div>
          </div>
        </section>
      ) : null}

      {step === 4 ? (
        <section className="card rounded-2xl fade-in-up">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-section-title">{t('pages.newEncounter.prescriptions.title')}</h2>
            <button
              type="button"
              onClick={() => setRows((current) => [...current, { id: crypto.randomUUID(), drugName: '', dosage: '', frequency: '', duration: '' }])}
              className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700"
            >
              {t('pages.newEncounter.prescriptions.add')}
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {rows.map((row) => (
              <div key={row.id} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-[1.3fr_1fr_1fr_1fr_auto]">
                <label className="relative">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">{t('pages.newEncounter.prescriptions.drug')}</span>
                  <input
                    list={`medicines-${row.id}`}
                    value={row.drugName}
                    onChange={(event) => updateRow(row.id, 'drugName', event.target.value)}
                    className="w-full rounded-2xl px-4 py-3"
                  />
                  <datalist id={`medicines-${row.id}`}>
                    {medicines.map((medicine) => <option key={medicine} value={medicine} />)}
                  </datalist>
                </label>
                <label>
                  <span className="mb-2 block text-sm font-semibold text-slate-700">{t('pages.newEncounter.prescriptions.dosage')}</span>
                  <input value={row.dosage} onChange={(event) => updateRow(row.id, 'dosage', event.target.value)} className="w-full rounded-2xl px-4 py-3" />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-semibold text-slate-700">{t('pages.newEncounter.prescriptions.frequency')}</span>
                  <input value={row.frequency} onChange={(event) => updateRow(row.id, 'frequency', event.target.value)} className="w-full rounded-2xl px-4 py-3" />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-semibold text-slate-700">{t('pages.newEncounter.prescriptions.duration')}</span>
                  <input value={row.duration} onChange={(event) => updateRow(row.id, 'duration', event.target.value)} className="w-full rounded-2xl px-4 py-3" />
                </label>
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  className="mt-7 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600"
                  aria-label="Remove prescription"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="flex flex-col-reverse gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => setStep((current) => Math.max(1, current - 1))}
          disabled={step === 1}
          className="btn-secondary rounded-2xl disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t('pages.newEncounter.previous')}
        </button>

        {step < 4 ? (
          <button
            type="button"
            onClick={() => setStep((current) => Math.min(4, current + 1))}
            className="btn-primary rounded-2xl"
          >
            {t('pages.newEncounter.next')}
          </button>
        ) : (
          <button type="submit" className="btn-primary rounded-2xl">
            {t('pages.newEncounter.submit')}
          </button>
        )}
      </div>
    </form>
  );
}