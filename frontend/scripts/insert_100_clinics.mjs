import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://ckcovsgmiykenokkvxrk.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_SECRET_KEY || process.env.SUPABASE_SECRET_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function insert100() {
  const clinics = JSON.parse(fs.readFileSync('./scripts/final_100_clinics.json', 'utf8'));
  console.log(`Loaded ${clinics.length} clinics to insert.`);

  // Prepare database rows matching public.clinics schema: (name, zone, address, latitude, longitude)
  const rows = clinics.map((c) => ({
    name: c.name,
    zone: c.district,
    address: c.address,
    latitude: c.latitude,
    longitude: c.longitude,
  }));

  // Batch insert in chunks of 25
  let insertedCount = 0;
  for (let i = 0; i < rows.length; i += 25) {
    const chunk = rows.slice(i, i + 25);
    const { data, error } = await supabase.from('clinics').insert(chunk).select('id, name');
    if (error) {
      console.error(`Error inserting chunk ${i}-${i + chunk.length}:`, error);
      process.exit(1);
    }
    insertedCount += data.length;
    console.log(`Inserted chunk ${i / 25 + 1}: ${data.length} rows.`);
  }

  console.log(`\nSuccessfully inserted all ${insertedCount} new clinic records!`);

  // Verification from Supabase
  const { count, error: countErr } = await supabase
    .from('clinics')
    .select('*', { count: 'exact', head: true });
  console.log(`Total clinics now in database: ${count}`);
}

insert100();
