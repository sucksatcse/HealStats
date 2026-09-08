import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync('../.env', 'utf8');
function getEnv(key) {
  const match = envContent.match(new RegExp(`^${key}="?([^"\\r\\n]+)"?`, 'm'));
  return match ? match[1] : '';
}

const url = getEnv('VITE_SUPABASE_URL');
const key = getEnv('VITE_SUPABASE_SECRET_KEY');

const sb = createClient(url, key);

async function check() {
  const clinics = await sb.from('clinics').select('id, name, latitude, longitude', { count: 'exact' });
  console.log('Clinics count:', clinics.count, 'sample:', clinics.data ? clinics.data.slice(0, 2) : clinics.error);

  const staff = await sb.from('staff').select('id, name, email, designation, is_active', { count: 'exact' });
  console.log('Staff count:', staff.count, 'sample:', staff.data ? staff.data.slice(0, 2) : staff.error);

  const seedStaff = await sb.from('staff').select('id', { count: 'exact' }).like('email', '%@seed.healstats.invalid');
  console.log('Seed staff count:', seedStaff.count);

  const patients = await sb.from('patients').select('id, name', { count: 'exact' });
  console.log('Patients count:', patients.count);

  const visits = await sb.from('visits').select('id', { count: 'exact' });
  console.log('Visits count:', visits.count);
}

check();
