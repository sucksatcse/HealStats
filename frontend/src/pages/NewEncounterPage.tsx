import { type FormEvent, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { db } from '../db/localDb';
import { useAppStore } from '../store';

const icd10 = [
  { code: 'A00', name: 'Cholera', bn: 'কলেরা' },
  { code: 'A90', name: 'Dengue fever', bn: 'ডেঙ্গু জ্বর' },
  { code: 'B34', name: 'Viral infection, unspecified', bn: 'অপরিচিত ভাইরাস সংক্রমণ' },
  { code: 'E11', name: 'Type 2 diabetes mellitus', bn: 'টাইপ ২ ডায়াবেটিস মেলিটাস' },
  { code: 'I10', name: 'Essential (primary) hypertension', bn: 'প্রাথমিক উচ্চ রক্তচাপ' },
  { code: 'J00', name: 'Acute nasopharyngitis', bn: 'তীব্র নাসোফ্যারিঞ্জাইটিস' },
  { code: 'J18', name: 'Pneumonia, unspecified organism', bn: 'অজানা জীবাণুর নিউমোনিয়া' },
  { code: 'K52', name: 'Gastroenteritis and colitis', bn: 'গ্যাস্ট্রোএন্টেরাইটিস ও কোলাইটিস' },
  { code: 'L20', name: 'Atopic dermatitis', bn: 'অ্যাটোপিক ডার্মাটাইটিস' },
  { code: 'M54', name: 'Dorsalgia', bn: 'পিঠে ব্যথা' },
  { code: 'N39', name: 'Urinary tract disorder', bn: 'মূত্রনালীর সমস্যা' },
  { code: 'R05', name: 'Cough', bn: 'কাশি' },
  { code: 'R50', name: 'Fever of other and unknown origin', bn: 'অজানা জ্বর' },
  { code: 'S93', name: 'Dislocation and sprain of ankle', bn: 'গোড়ালির মচকানো/বিস্ফোরণ' },
  { code: 'Z00', name: 'General examination', bn: 'সাধারণ পরীক্ষা' }
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

  const diagnosisOptions = useMemo(() => {
    const query = diagnosisQuery.trim().toLowerCase();
    if (!query) {
      return icd10;
    }
    return icd10.filter((item) => `${item.code} ${item.name} ${item.bn}`.toLowerCase().includes(query));
  }, [diagnosisQuery]);

  const updateRow = (id: string, field: 'drugName' | 'dosage' | 'frequency' | 'duration', value: string) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
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

  const stepTitles = [
    t('pages.newEncounter.steps.vitals'),
    t('pages.newEncounter.steps.complaint'),
    t('pages.newEncounter.steps.diagnosis'),
    t('pages.newEncounter.steps.prescriptions')
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{t('pages.newEncounter.title')}</h1>
            <p className="mt-2 text-sm text-slate-600">{t('pages.newEncounter.description')}</p>
          </div>
          <p className="rounded-full bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700">
            {t('pages.newEncounter.patient')}: {patientId}
          </p>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          {stepTitles.map((title, index) => {
            const active = step === index + 1;
            return (
              <div key={title} className={[
                'rounded-2xl border px-4 py-3 text-sm font-semibold transition',
                active ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-slate-200 bg-slate-50 text-slate-500'
              ].join(' ')}>
                <p className="text-xs uppercase tracking-[0.24em]">{t('pages.newEncounter.step')} {index + 1} {t('pages.newEncounter.stepOf')} 4</p>
                <p className="mt-1">{title}</p>
              </div>
            );
          })}
        </div>
      </section>

      {step === 1 ? (
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-xl font-semibold text-slate-900">{t('pages.newEncounter.steps.vitals')}</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              { label: t('pages.newEncounter.vitals.bp'), fields: [
                <input key="sys" value={systolic} onChange={(event) => setSystolic(event.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Systolic" />,
                <input key="dia" value={diastolic} onChange={(event) => setDiastolic(event.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Diastolic" />
              ] },
              { label: t('pages.newEncounter.vitals.temperature'), fields: [<input key="temp" value={temperature} onChange={(event) => setTemperature(event.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="38.2" />] },
              { label: t('pages.newEncounter.vitals.pulse'), fields: [<input key="pulse" value={pulse} onChange={(event) => setPulse(event.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="96" />] },
              { label: t('pages.newEncounter.vitals.weight'), fields: [<input key="weight" value={weight} onChange={(event) => setWeight(event.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="54" />] },
              { label: t('pages.newEncounter.vitals.height'), fields: [<input key="height" value={height} onChange={(event) => setHeight(event.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="162" />] }
            ].map((item) => (
              <div key={item.label} className="space-y-2 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-700">{item.label}</p>
                <div className="grid gap-3 sm:grid-cols-2">{item.fields}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-xl font-semibold text-slate-900">{t('pages.newEncounter.complaint.title')}</h2>
          <textarea
            value={chiefComplaint}
            onChange={(event) => setChiefComplaint(event.target.value)}
            rows={6}
            className="mt-4 w-full rounded-[1.5rem] border border-slate-300 px-4 py-3 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            placeholder={t('pages.newEncounter.complaint.title')}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            {quickChips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setChiefComplaint((current) => `${current}${current ? ' ' : ''}${chip}`)}
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50"
              >
                {t(`pages.newEncounter.complaint.chips.${chip}`)}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-xl font-semibold text-slate-900">{t('pages.newEncounter.diagnosis.title')}</h2>
          <div className="mt-4 space-y-4">
            <input
              value={diagnosisQuery}
              onChange={(event) => setDiagnosisQuery(event.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              placeholder={t('pages.newEncounter.diagnosis.placeholder')}
            />

            <div className="grid gap-2 rounded-[1.5rem] border border-slate-200 p-3">
              {diagnosisOptions.slice(0, 8).map((item) => {
                const active = selectedDiagnosis.code === item.code;
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setSelectedDiagnosis(item)}
                    className={[
                      'rounded-2xl px-4 py-3 text-left transition',
                      active ? 'bg-sky-50 text-sky-800 ring-1 ring-sky-200' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    ].join(' ')}
                  >
                    <p className="text-sm font-semibold">{item.code} - {item.name}</p>
                    <p className="text-sm text-slate-500">{item.bn}</p>
                  </button>
                );
              })}
            </div>

            <div className="rounded-[1.5rem] border border-sky-200 bg-sky-50 p-4 text-sm font-medium text-sky-800">
              {t('pages.newEncounter.diagnosis.selected')}: {selectedDiagnosis.code} - {selectedDiagnosis.name} / {selectedDiagnosis.bn}
            </div>
          </div>
        </section>
      ) : null}

      {step === 4 ? (
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-xl font-semibold text-slate-900">{t('pages.newEncounter.prescriptions.title')}</h2>
            <button
              type="button"
              onClick={() => setRows((current) => [...current, { id: crypto.randomUUID(), drugName: '', dosage: '', frequency: '', duration: '' }])}
              className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700"
            >
              {t('pages.newEncounter.prescriptions.add')}
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {rows.map((row) => (
              <div key={row.id} className="grid gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-4">
                <label className="relative">
                  <span className="mb-2 block text-sm font-medium text-slate-700">{t('pages.newEncounter.prescriptions.drug')}</span>
                  <input
                    list={`medicines-${row.id}`}
                    value={row.drugName}
                    onChange={(event) => updateRow(row.id, 'drugName', event.target.value)}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  />
                  <datalist id={`medicines-${row.id}`}>
                    {medicines.map((medicine) => <option key={medicine} value={medicine} />)}
                  </datalist>
                </label>
                <label>
                  <span className="mb-2 block text-sm font-medium text-slate-700">{t('pages.newEncounter.prescriptions.dosage')}</span>
                  <input value={row.dosage} onChange={(event) => updateRow(row.id, 'dosage', event.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3" />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-medium text-slate-700">{t('pages.newEncounter.prescriptions.frequency')}</span>
                  <input value={row.frequency} onChange={(event) => updateRow(row.id, 'frequency', event.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3" />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-medium text-slate-700">{t('pages.newEncounter.prescriptions.duration')}</span>
                  <input value={row.duration} onChange={(event) => updateRow(row.id, 'duration', event.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3" />
                </label>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="flex flex-col-reverse gap-3 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => setStep((current) => Math.max(1, current - 1))}
          disabled={step === 1}
          className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t('pages.newEncounter.previous')}
        </button>

        {step < 4 ? (
          <button
            type="button"
            onClick={() => setStep((current) => Math.min(4, current + 1))}
            className="rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-soft"
          >
            {t('pages.newEncounter.next')}
          </button>
        ) : (
          <button type="submit" className="rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-soft">
            {t('pages.newEncounter.submit')}
          </button>
        )}
      </div>
    </form>
  );
}