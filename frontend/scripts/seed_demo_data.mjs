import fs from 'node:fs';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync('../.env', 'utf8');
function getEnv(key) {
  const match = envContent.match(new RegExp(`^${key}="?([^"\\r\\n]+)"?`, 'm'));
  return match ? match[1] : '';
}

const url = getEnv('VITE_SUPABASE_URL');
const key = getEnv('VITE_SUPABASE_SECRET_KEY');
if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SECRET_KEY');
  process.exit(1);
}

const sb = createClient(url, key);

const NAMESPACE = 'a7c9e2d0-0000-4000-8000-000000000000';

function uuidv5(namespace, name) {
  const cleanNs = namespace.replace(/-/g, '');
  const nsBuffer = Buffer.from(cleanNs, 'hex');
  const nameBuffer = Buffer.from(name, 'utf8');
  const hash = crypto.createHash('sha1').update(Buffer.concat([nsBuffer, nameBuffer])).digest();
  const buf = Buffer.alloc(16);
  hash.copy(buf, 0, 0, 16);
  buf[6] = (buf[6] & 0x0f) | 0x50; // RFC 4122 v5
  buf[8] = (buf[8] & 0x3f) | 0x80; // RFC 4122 variant
  const hex = buf.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const firstNames = ['Rahim','Karim','Fatima','Ayesha','Hasan','Jahangir','Nasrin','Shirin','Rafiq','Kamal',
                    'Salma','Rumana','Imran','Tariq','Nadia','Sadia','Mizanur','Anwar','Rokeya','Farhana'];
const lastNames = ['Ahmed','Khan','Islam','Hossain','Chowdhury','Rahman','Akter','Begum','Ali','Uddin',
                   'Sarkar','Miah','Sheikh','Bhuiyan','Haque','Mollah','Das','Roy','Kabir','Sultana'];
const villages = ['Char Fasson','Hatiya','Sandwip','Kutubdia','Teknaf','Ramgati','Daulatkhan','Monpura','Subarnachar','Kamalnagar',
                  'Rajapur','Mathbaria','Sarankhola','Koyra','Dacope','Shyamnagar','Tala','Assasuni','Kalapara','Galachipa'];
const symptomsList = ['watery stool, cramps','fever, chills','cough, breathlessness','itchy rash','headache, fatigue',
                      'vomiting','sore throat','joint pain','abdominal pain','dizziness'];
const symptomCategories = ['diarrhea/gastrointestinal','fever','respiratory','skin/rash','other'];
const diagnoses = ['Acute watery diarrhoea','Uncomplicated malaria','Acute respiratory infection','Scabies','Hypertension',
                   'Enteric fever','Pneumonia','Dehydration','Skin infection','Routine review'];

async function runSeed() {
  console.log('Fetching clinics to establish seed pool...');
  // Query all clinics ordered by id
  const { data: allClinics, error: clinicsErr } = await sb
    .from('clinics')
    .select('id')
    .order('id', { ascending: true });

  if (clinicsErr || !allClinics || allClinics.length === 0) {
    console.error('Failed to fetch clinics or no clinics found:', clinicsErr);
    process.exit(1);
  }

  console.log(`Found ${allClinics.length} total clinics.`);
  // Filter rn % 2 == 0 (0-indexed in JS matches 0-indexed rn)
  const pool = allClinics.filter((_, idx) => idx % 2 === 0);
  console.log(`Pool size (rn % 2 = 0): ${pool.length} clinics.`);
  const n = pool.length;
  if (n === 0) {
    console.error('No clinics in pool!');
    process.exit(1);
  }

  // 1. Generate Staff (1 to 100)
  console.log('\nGenerating 100 fictional staff...');
  const staffRows = [];
  for (let i = 1; i <= 100; i++) {
    const fn = firstNames[(i * 7) % 20];
    const ln = lastNames[(i * 13) % 20];
    const designation = i <= 35 ? 'community_health_worker'
      : i <= 65 ? 'nurse'
      : i <= 90 ? 'clinical_officer'
      : 'administrator';
    const role = i > 90 ? 'admin' : 'worker';
    const clinicId = role === 'admin' ? null : pool[i % n].id;
    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@seed.healstats.invalid`;
    const id = uuidv5(NAMESPACE, `staff-${i}`);

    staffRows.push({
      id,
      name: `${fn} ${ln}`,
      role,
      clinic_id: clinicId,
      auth_user_id: null,
      email,
      is_active: true,
      designation
    });
  }

  // Upsert/Insert staff in chunks of 50
  for (let i = 0; i < staffRows.length; i += 50) {
    const chunk = staffRows.slice(i, i + 50);
    const { error } = await sb.from('staff').upsert(chunk, { onConflict: 'id', ignoreDuplicates: true });
    if (error) {
      console.error('Error seeding staff chunk:', error);
      process.exit(1);
    }
  }
  console.log(`Seeded ${staffRows.length} staff.`);

  // 2. Generate Patients (1 to 100)
  console.log('\nGenerating 100 fictional patients...');
  const patientRows = [];
  const now = Date.now();
  for (let i = 1; i <= 100; i++) {
    const fn = firstNames[(i * 11) % 20];
    const ln = lastNames[(i * 17) % 20];
    const village = villages[(i * 5) % 20];
    const age = 1 + ((i * 7) % 84);
    const sex = i % 2 === 0 ? 'Female' : 'Male';
    const clinicId = pool[i % n].id;
    const createdAt = new Date(now - (i % 45) * 24 * 3600 * 1000).toISOString();
    const id = uuidv5(NAMESPACE, `patient-${i}`);

    patientRows.push({
      id,
      name: `${fn} ${ln}`,
      age,
      sex,
      village,
      clinic_id: clinicId,
      created_at: createdAt
    });
  }

  for (let i = 0; i < patientRows.length; i += 50) {
    const chunk = patientRows.slice(i, i + 50);
    const { error } = await sb.from('patients').upsert(chunk, { onConflict: 'id', ignoreDuplicates: true });
    if (error) {
      console.error('Error seeding patients chunk:', error);
      process.exit(1);
    }
  }
  console.log(`Seeded ${patientRows.length} patients.`);

  // 3. Generate Visits (1 to 300)
  console.log('\nGenerating 300 fictional visits...');
  const visitRows = [];
  for (let i = 1; i <= 300; i++) {
    const patientId = uuidv5(NAMESPACE, `patient-${1 + ((i - 1) % 100)}`);
    const staffId = uuidv5(NAMESPACE, `staff-${1 + ((i * 3) % 90)}`);
    const vitals = {
      bp: `${110 + (i % 35)}/${68 + (i % 22)}`,
      pulse: 66 + (i % 44),
      temperature: Number((36.4 + (i % 6) * 0.4).toFixed(1)),
      spo2: 93 + (i % 7),
      respiratory_rate: 15 + (i % 10),
      weight: 42 + (i % 45)
    };
    const symptoms = symptomsList[i % 10];
    const symptomCategory = symptomCategories[i % 5];
    const diagnosis = diagnoses[i % 10];
    const urgencyScore = 1 + (i % 5);

    let offsetMs = 0;
    if (i % 3 === 0) {
      offsetMs = (i % 23) * 3600 * 1000;
    } else if (i % 3 === 1) {
      offsetMs = (2 + (i % 5)) * 24 * 3600 * 1000;
    } else {
      offsetMs = (8 + (i % 40)) * 24 * 3600 * 1000;
    }
    const timestamp = new Date(now - offsetMs).toISOString();
    const id = uuidv5(NAMESPACE, `visit-${i}`);

    visitRows.push({
      id,
      patient_id: patientId,
      staff_id: staffId,
      vitals,
      symptoms,
      symptom_category: symptomCategory,
      diagnosis,
      urgency_score: urgencyScore,
      created_at: timestamp,
      synced_at: timestamp
    });
  }

  for (let i = 0; i < visitRows.length; i += 50) {
    const chunk = visitRows.slice(i, i + 50);
    const { error } = await sb.from('visits').upsert(chunk, { onConflict: 'id', ignoreDuplicates: true });
    if (error) {
      console.error('Error seeding visits chunk:', error);
      process.exit(1);
    }
  }
  console.log(`Seeded ${visitRows.length} visits.`);

  // Final verification counts
  console.log('\n--- VERIFICATION ---');
  const { count: staffCount } = await sb.from('staff').select('id', { count: 'exact', head: true });
  const { count: seedStaffCount } = await sb.from('staff').select('id', { count: 'exact', head: true }).like('email', '%@seed.healstats.invalid');
  const { count: patientCount } = await sb.from('patients').select('id', { count: 'exact', head: true });
  const { count: visitCount } = await sb.from('visits').select('id', { count: 'exact', head: true });
  const { count: clinicCount } = await sb.from('clinics').select('id', { count: 'exact', head: true });

  console.log(`Clinics count: ${clinicCount}`);
  console.log(`Total Staff count: ${staffCount}`);
  console.log(`Seed Staff count (@seed.healstats.invalid): ${seedStaffCount}`);
  console.log(`Total Patients count: ${patientCount}`);
  console.log(`Total Visits count: ${visitCount}`);
}

runSeed();
