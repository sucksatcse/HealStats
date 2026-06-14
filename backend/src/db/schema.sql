CREATE TABLE IF NOT EXISTS facilities (
  id TEXT PRIMARY KEY, name TEXT NOT NULL,
  type TEXT CHECK(type IN ('hospital','clinic','ngo_post','camp')) NOT NULL,
  union_name TEXT, upazila TEXT, district TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, name TEXT NOT NULL,
  role TEXT CHECK(role IN ('doctor','nurse','chw','admin','ngo_staff')) NOT NULL,
  facility_id TEXT REFERENCES facilities(id),
  pin_hash TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY, full_name TEXT NOT NULL,
  date_of_birth TEXT, sex TEXT CHECK(sex IN ('male','female','other')),
  union_name TEXT, upazila TEXT, district TEXT,
  phone_number TEXT, photo_url TEXT, refugee_mode INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')), synced_at TEXT
);
CREATE TABLE IF NOT EXISTS encounters (
  id TEXT PRIMARY KEY, patient_id TEXT NOT NULL REFERENCES patients(id),
  facility_id TEXT NOT NULL REFERENCES facilities(id),
  visit_date TEXT NOT NULL, chief_complaint TEXT,
  vitals TEXT, diagnosis_code TEXT, diagnosis_label_bn TEXT,
  notes TEXT, triage_level TEXT, created_by TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS prescriptions (
  id TEXT PRIMARY KEY, encounter_id TEXT NOT NULL REFERENCES encounters(id),
  drug_name TEXT NOT NULL, dosage TEXT, frequency TEXT,
  duration TEXT, allergy_flag INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id),
  action TEXT NOT NULL, target_table TEXT, target_id TEXT,
  timestamp TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(full_name);
CREATE INDEX IF NOT EXISTS idx_encounters_patient ON encounters(patient_id);
CREATE INDEX IF NOT EXISTS idx_encounters_date ON encounters(visit_date);
CREATE INDEX IF NOT EXISTS idx_encounters_diagnosis ON encounters(diagnosis_code);