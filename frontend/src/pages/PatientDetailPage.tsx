import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const patient = {
  id: 'PT-1001',
  fullName: 'Amina Khatun',
  age: 34,
  sex: 'female',
  district: 'Sherpur',
  upazila: 'Sherpur Sadar',
  union: 'Vatshala',
  phone: '01711-234567',
  photo: 'amiina.jpg',
  dob: '1992-05-11',
  refugeeMode: false,
  nationality: 'Bangladeshi',
  campName: '',
  shelterBlock: ''
};

const visits = [
  {
    id: 'ENC-2001',
    date: '2026-06-12',
    vitals: 'BP 110/70, Temp 38.4°C, Pulse 98, Weight 54kg',
    diagnosis: 'Dengue - A90',
    notes: 'Fever for 3 days, oral hydration advised.',
    prescriptions: [
      { drugName: 'Paracetamol', dosage: '500 mg', frequency: '3x/day', duration: '5 days' },
      { drugName: 'ORS', dosage: '1 sachet', frequency: 'After each loose stool', duration: 'As needed' }
    ]
  },
  {
    id: 'ENC-1893',
    date: '2026-05-23',
    vitals: 'BP 118/74, Temp 37.2°C, Pulse 86, Weight 53kg',
    diagnosis: 'Gastritis',
    notes: 'Epigastric pain after meals.',
    prescriptions: [
      { drugName: 'Omeprazole', dosage: '20 mg', frequency: '1x/day', duration: '14 days' }
    ]
  },
  {
    id: 'ENC-1764',
    date: '2026-04-18',
    vitals: 'BP 112/72, Temp 36.8°C, Pulse 84, Weight 52kg',
    diagnosis: 'Allergic rhinitis',
    notes: 'Seasonal sneezing and congestion.',
    prescriptions: [
      { drugName: 'Cetirizine', dosage: '10 mg', frequency: '1x/day', duration: '7 days' }
    ]
  }
];

const demographics = [
  ['pages.patientDetail.demographics.fullName', patient.fullName],
  ['pages.patientDetail.demographics.dob', patient.dob],
  ['pages.patientDetail.demographics.sex', 'patient.female'],
  ['pages.patientDetail.demographics.district', patient.district],
  ['pages.patientDetail.demographics.upazila', patient.upazila],
  ['pages.patientDetail.demographics.union', patient.union],
  ['pages.patientDetail.demographics.phone', patient.phone],
  ['pages.patientDetail.demographics.photo', patient.photo],
  ['pages.patientDetail.demographics.refugeeMode', patient.refugeeMode ? 'Yes' : 'No'],
  ['pages.patientDetail.demographics.campName', patient.campName || '-'],
  ['pages.patientDetail.demographics.shelterBlock', patient.shelterBlock || '-'],
  ['pages.patientDetail.demographics.nationality', patient.nationality]
] as const;

export function PatientDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [tab, setTab] = useState<'history' | 'prescriptions' | 'demographics'>('history');
  const [expandedVisit, setExpandedVisit] = useState<string>(visits[0].id);

  const prescriptionRows = useMemo(
    () => visits.flatMap((visit) => visit.prescriptions.map((item) => ({ ...item, encounter: visit.id, date: visit.date }))),
    []
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{patient.fullName}</h1>
              <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
                {t('pages.patientDetail.patientId')}: {id ?? patient.id}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {patient.age} years, {t(`patient.${patient.sex}`)} · {t('pages.patientDetail.districtUpazila')}: {patient.district} / {patient.upazila}
            </p>
          </div>
          <Link
            to={`/encounters/new?patientId=${id ?? patient.id}`}
            className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-primary-600"
          >
            {t('pages.patientDetail.newEncounter')}
          </Link>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-3 shadow-soft">
        <div className="flex flex-wrap gap-2 border-b border-slate-200 px-2 pb-3">
          {[
            ['history', t('pages.patientDetail.tabs.history')],
            ['prescriptions', t('pages.patientDetail.tabs.prescriptions')],
            ['demographics', t('pages.patientDetail.tabs.demographics')]
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key as typeof tab)}
              className={[
                'rounded-2xl px-4 py-2 text-sm font-semibold transition',
                tab === key ? 'bg-sky-50 text-sky-700 ring-1 ring-sky-200' : 'text-slate-500 hover:bg-slate-50'
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="p-3 sm:p-5">
          {tab === 'history' ? (
            <div className="space-y-4">
              {visits.map((visit) => {
                const open = expandedVisit === visit.id;

                return (
                  <article key={visit.id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                    <button
                      type="button"
                      onClick={() => setExpandedVisit(open ? '' : visit.id)}
                      className="flex w-full items-center justify-between gap-4 text-left"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{visit.id}</p>
                        <p className="text-sm text-slate-500">{visit.date}</p>
                      </div>
                      <span className="text-sm font-semibold text-sky-700">{open ? '−' : '+'}</span>
                    </button>
                    {open ? (
                      <div className="mt-4 grid gap-4 lg:grid-cols-3">
                        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{t('pages.patientDetail.vitals')}</p>
                          <p className="mt-2 text-sm leading-6 text-slate-700">{visit.vitals}</p>
                        </div>
                        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{t('pages.patientDetail.diagnosis')}</p>
                          <p className="mt-2 text-sm leading-6 text-slate-700">{visit.diagnosis}</p>
                        </div>
                        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100 lg:col-span-1">
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{t('pages.patientDetail.notes')}</p>
                          <p className="mt-2 text-sm leading-6 text-slate-700">{visit.notes}</p>
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : null}

          {tab === 'prescriptions' ? (
            <div className="overflow-x-auto rounded-[1.5rem] border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">{t('pages.patientDetail.prescriptionsTable.drug')}</th>
                    <th className="px-4 py-3 font-semibold">{t('pages.patientDetail.prescriptionsTable.dosage')}</th>
                    <th className="px-4 py-3 font-semibold">{t('pages.patientDetail.prescriptionsTable.frequency')}</th>
                    <th className="px-4 py-3 font-semibold">{t('pages.patientDetail.prescriptionsTable.duration')}</th>
                    <th className="px-4 py-3 font-semibold">Encounter</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {prescriptionRows.map((row, index) => (
                    <tr key={`${row.encounter}-${index}`}>
                      <td className="px-4 py-3 font-medium text-slate-900">{row.drugName}</td>
                      <td className="px-4 py-3 text-slate-600">{row.dosage}</td>
                      <td className="px-4 py-3 text-slate-600">{row.frequency}</td>
                      <td className="px-4 py-3 text-slate-600">{row.duration}</td>
                      <td className="px-4 py-3 text-slate-600">{row.encounter}</td>
                      <td className="px-4 py-3 text-slate-600">{row.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {tab === 'demographics' ? (
            <div className="grid gap-4 md:grid-cols-2">
              {demographics.map(([labelKey, value]) => (
                <div key={labelKey} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{t(labelKey)}</p>
                  <p className="mt-2 text-sm font-medium text-slate-900">{t(value)}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}