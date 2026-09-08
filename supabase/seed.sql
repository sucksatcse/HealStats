-- HealStats demo/test seed — FICTIONAL DATA ONLY. Idempotent. INSERTs only.
DO $$
BEGIN
  IF (SELECT count(*) FROM public.clinics) = 0 THEN
    RAISE EXCEPTION 'No clinics found. Add clinics before running this seed.';
  END IF;
END $$;

WITH pool AS (
  SELECT id, (row_number() OVER (ORDER BY id) - 1) AS pn, count(*) OVER () AS n
  FROM (SELECT id, (row_number() OVER (ORDER BY id) - 1) AS rn FROM public.clinics) c
  WHERE rn % 2 = 0
),
base AS (
  SELECT i,
    (ARRAY['Rahim','Karim','Fatima','Ayesha','Hasan','Jahangir','Nasrin','Shirin','Rafiq','Kamal',
           'Salma','Rumana','Imran','Tariq','Nadia','Sadia','Mizanur','Anwar','Rokeya','Farhana'])[1 + (i*7) % 20]  AS first_name,
    (ARRAY['Ahmed','Khan','Islam','Hossain','Chowdhury','Rahman','Akter','Begum','Ali','Uddin',
           'Sarkar','Miah','Sheikh','Bhuiyan','Haque','Mollah','Das','Roy','Kabir','Sultana'])[1 + (i*13) % 20] AS last_name,
    CASE WHEN i <= 35 THEN 'community_health_worker'
         WHEN i <= 65 THEN 'nurse'
         WHEN i <= 90 THEN 'clinical_officer'
         ELSE 'administrator' END AS designation,
    CASE WHEN i > 90 THEN 'admin' ELSE 'worker' END AS role
  FROM generate_series(1,100) AS g(i)
)
INSERT INTO public.staff (id, name, role, clinic_id, auth_user_id, email, is_active, designation)
SELECT
  uuid_generate_v5('a7c9e2d0-0000-4000-8000-000000000000'::uuid, 'staff-'||b.i),
  b.first_name||' '||b.last_name, b.role,
  CASE WHEN b.role='admin' THEN NULL ELSE p.id END,
  NULL,
  lower(b.first_name)||'.'||lower(b.last_name)||b.i||'@seed.healstats.invalid',
  TRUE, b.designation
FROM base b
LEFT JOIN pool p ON b.role <> 'admin' AND p.pn = (b.i % NULLIF(p.n,0))
ON CONFLICT (id) DO NOTHING;

WITH pool AS (
  SELECT id, (row_number() OVER (ORDER BY id) - 1) AS pn, count(*) OVER () AS n
  FROM (SELECT id, (row_number() OVER (ORDER BY id) - 1) AS rn FROM public.clinics) c
  WHERE rn % 2 = 0
),
base AS (
  SELECT i,
    (ARRAY['Rahim','Karim','Fatima','Ayesha','Hasan','Jahangir','Nasrin','Shirin','Rafiq','Kamal',
           'Salma','Rumana','Imran','Tariq','Nadia','Sadia','Mizanur','Anwar','Rokeya','Farhana'])[1 + (i*11) % 20] AS first_name,
    (ARRAY['Ahmed','Khan','Islam','Hossain','Chowdhury','Rahman','Akter','Begum','Ali','Uddin',
           'Sarkar','Miah','Sheikh','Bhuiyan','Haque','Mollah','Das','Roy','Kabir','Sultana'])[1 + (i*17) % 20] AS last_name,
    (ARRAY['Char Fasson','Hatiya','Sandwip','Kutubdia','Teknaf','Ramgati','Daulatkhan','Monpura','Subarnachar','Kamalnagar',
           'Rajapur','Mathbaria','Sarankhola','Koyra','Dacope','Shyamnagar','Tala','Assasuni','Kalapara','Galachipa'])[1 + (i*5) % 20] AS village
  FROM generate_series(1,100) AS g(i)
)
INSERT INTO public.patients (id, name, age, sex, village, clinic_id, created_at)
SELECT
  uuid_generate_v5('a7c9e2d0-0000-4000-8000-000000000000'::uuid, 'patient-'||b.i),
  b.first_name||' '||b.last_name,
  1 + (b.i*7) % 84,
  CASE WHEN b.i % 2 = 0 THEN 'Female' ELSE 'Male' END,
  b.village, p.id,
  now() - ((b.i % 45)||' days')::interval
FROM base b
JOIN pool p ON p.pn = (b.i % NULLIF(p.n,0))
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.visits
  (id, patient_id, staff_id, vitals, symptoms, symptom_category, diagnosis, urgency_score, created_at, synced_at)
SELECT
  uuid_generate_v5('a7c9e2d0-0000-4000-8000-000000000000'::uuid, 'visit-'||v.i),
  uuid_generate_v5('a7c9e2d0-0000-4000-8000-000000000000'::uuid, 'patient-'||(1 + (v.i-1) % 100)),
  uuid_generate_v5('a7c9e2d0-0000-4000-8000-000000000000'::uuid, 'staff-'||(1 + (v.i*3) % 90)),
  jsonb_build_object(
    'bp', (110 + v.i % 35)||'/'||(68 + v.i % 22),
    'pulse', 66 + v.i % 44,
    'temperature', round((36.4 + (v.i % 6)*0.4)::numeric, 1),
    'spo2', 93 + v.i % 7,
    'respiratory_rate', 15 + v.i % 10,
    'weight', 42 + v.i % 45
  ),
  (ARRAY['watery stool, cramps','fever, chills','cough, breathlessness','itchy rash','headache, fatigue',
         'vomiting','sore throat','joint pain','abdominal pain','dizziness'])[1 + v.i % 10],
  (ARRAY['diarrhea/gastrointestinal','fever','respiratory','skin/rash','other'])[1 + v.i % 5],
  (ARRAY['Acute watery diarrhoea','Uncomplicated malaria','Acute respiratory infection','Scabies','Hypertension',
         'Enteric fever','Pneumonia','Dehydration','Skin infection','Routine review'])[1 + v.i % 10],
  1 + v.i % 5,
  CASE v.i % 3
    WHEN 0 THEN now() - ((v.i % 23)||' hours')::interval
    WHEN 1 THEN now() - ((2 + v.i % 5)||' days')::interval
    ELSE        now() - ((8 + v.i % 40)||' days')::interval
  END,
  CASE v.i % 3
    WHEN 0 THEN now() - ((v.i % 23)||' hours')::interval
    WHEN 1 THEN now() - ((2 + v.i % 5)||' days')::interval
    ELSE        now() - ((8 + v.i % 40)||' days')::interval
  END
FROM generate_series(1,300) AS v(i)
ON CONFLICT (id) DO NOTHING;
