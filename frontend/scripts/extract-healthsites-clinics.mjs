import fs from 'node:fs';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchRemaining() {
  const existing = fs.existsSync('./scripts/raw_healthsites_clinics.json')
    ? JSON.parse(fs.readFileSync('./scripts/raw_healthsites_clinics.json', 'utf8'))
    : [];

  console.log(`Starting with ${existing.length} existing candidate clinics.`);
  const seenIds = new Set(existing.map((c) => c.osm_id));
  let offset = 3400;

  while (offset < 7600) {
    const url = `https://datasets-server.huggingface.co/rows?dataset=electricsheepasia%2Fasia-health-facilities-bangladesh-healthsites&config=default&split=train&offset=${offset}&limit=100`;
    try {
      const res = await fetch(url);
      if (res.status === 429) {
        console.log(`Rate limited at offset ${offset}, waiting 3s...`);
        await delay(3000);
        continue;
      }
      if (!res.ok) {
        console.error(`HTTP ${res.status} at offset ${offset}`);
        break;
      }
      const data = await res.json();
      if (!data.rows || !data.rows.length) break;

      for (const r of data.rows) {
        const row = r.row;
        if (seenIds.has(row.osm_id)) continue;

        const name = (row['#loc +name'] || '').trim();
        const amenity = (row['#loc+amenity'] || '').toLowerCase();
        const healthcare = (row['#meta+healthcare'] || '').toLowerCase();

        const isCC = /community\s*clinic/i.test(name) || /কমিউনিটি\s*ক্লিনিক/i.test(name) ||
          ((amenity === 'clinic' || healthcare === 'clinic') && !/hospital|pharmacy|diagnostic|dental|veterinary|complex|pvt|private|dr\.|doctor|chamber|optics|optical|eye\s*care/i.test(name));

        const isExcluded = /hospital|pharmacy|diagnostic|dental|veterinary|complex|pvt|private|dr\.|doctor|chamber|optics|optical|eye\s*care/i.test(name);

        if (isCC && !isExcluded && name.length > 3) {
          let coords = null;
          const rawGeom = row['geometry'] || '';
          const match = rawGeom.match(/\[\s*([0-9.]+)\s*,\s*([0-9.]+)\s*\]/);
          if (match) {
            const lng = parseFloat(match[1]);
            const lat = parseFloat(match[2]);
            if (lat >= 20.5 && lat <= 26.7 && lng >= 88.0 && lng <= 92.7) {
              coords = { lat, lng };
            }
          }

          if (coords) {
            existing.push({
              name,
              amenity,
              healthcare,
              latitude: coords.lat,
              longitude: coords.lng,
              city: (row['addr_city'] || '').trim(),
              street: (row['addr_street'] || '').trim(),
              osm_id: row['osm_id'],
              meta_id: row['#meta +id'] || '',
            });
            seenIds.add(row.osm_id);
          }
        }
      }
      offset += 100;
      process.stdout.write(`Processed offset ${offset}, total clinics so far: ${existing.length}...\r`);
      await delay(600); // polite delay
    } catch (err) {
      console.error(`Error at offset ${offset}:`, err.message);
      await delay(2000);
    }
  }

  console.log(`\nCompleted! Total candidate clinics found: ${existing.length}`);
  fs.writeFileSync('./scripts/raw_healthsites_clinics.json', JSON.stringify(existing, null, 2));
}

fetchRemaining();
