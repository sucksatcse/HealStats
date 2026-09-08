export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const supabaseUrl =
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    'https://ckcovsgmiykenokkvxrk.supabase.co';

  const apiKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.VITE_SUPABASE_SECRET_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Server missing Supabase credentials' });
  }

  try {
    const restUrl = new URL('/rest/v1/staff', supabaseUrl);
    restUrl.search = new URLSearchParams({
      select: 'id,name,email,role,designation,is_active,clinics(name,zone,address)',
      order: 'name.asc',
    }).toString();

    const response = await fetch(restUrl, {
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Supabase returned ${response.status}`,
        data: [],
      });
    }

    const raw = await response.json();
    const rows = Array.isArray(raw) ? raw : [];
    const active = rows.filter((r) => r.is_active !== false);

    const clinicsSet = new Set();
    const designationsSet = new Set();

    const data = active.map((row, idx) => {
      const clinicObj = Array.isArray(row.clinics) ? row.clinics[0] : row.clinics;
      const clinicName =
        clinicObj?.name && typeof clinicObj.name === 'string' && clinicObj.name.trim()
          ? clinicObj.name.trim()
          : 'Unassigned';

      if (clinicName !== 'Unassigned') {
        clinicsSet.add(clinicName);
      }

      let designation = row.designation;
      if (!designation) {
        designation = row.role === 'admin' ? 'Clinic Administrator' : 'Community Health Worker';
      }
      designationsSet.add(designation);

      return {
        key: `staff-${idx + 1}-${String(row.id).slice(0, 8)}`,
        name: row.name || 'Healthcare Professional',
        email: row.email || null,
        role: row.role === 'admin' ? 'admin' : 'worker',
        designation,
        clinicName,
        clinicZone: clinicObj?.zone || null,
        clinicAddress: clinicObj?.address || null,
        photoUrl: null,
      };
    });

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    return res.status(200).json({
      data,
      totalCount: data.length,
      clinics: Array.from(clinicsSet).sort(),
      designations: Array.from(designationsSet).sort(),
    });
  } catch (err) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Unknown server error',
      data: [],
    });
  }
}
