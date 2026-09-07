import duckdb
import json
import re

con = duckdb.connect()

# Query columns and total row count
count = con.execute("SELECT COUNT(*) FROM './scripts/train.parquet'").fetchone()[0]
print(f"Total rows in train.parquet: {count}")

# Inspect distinct amenity and healthcare values
amenities = con.execute("SELECT DISTINCT \"#loc+amenity\" FROM './scripts/train.parquet'").fetchall()
print("Amenities:", [a[0] for a in amenities])

# Query candidates from both train and test parquets
query = """
SELECT 
    osm_id,
    "#loc +name" AS name,
    "#loc+amenity" AS amenity,
    "#meta+healthcare" AS healthcare,
    addr_city AS city,
    addr_street AS street,
    addr_postcode AS postcode,
    geometry,
    "#meta +id" AS meta_id
FROM read_parquet(['./scripts/train.parquet', './scripts/test.parquet'])
WHERE (
    LOWER("#loc+amenity") = 'clinic' 
    OR LOWER("#meta+healthcare") = 'clinic'
    OR LOWER("#loc +name") LIKE '%community clinic%'
    OR "#loc +name" LIKE '%কমিউনিটি ক্লিনিক%'
)
AND NOT (
    LOWER("#loc +name") LIKE '%hospital%'
    OR LOWER("#loc +name") LIKE '%pharmacy%'
    OR LOWER("#loc +name") LIKE '%diagnostic%'
    OR LOWER("#loc +name") LIKE '%dental%'
    OR LOWER("#loc +name") LIKE '%veterinary%'
    OR LOWER("#loc +name") LIKE '%complex%'
    OR LOWER("#loc +name") LIKE '%private%'
    OR LOWER("#loc +name") LIKE '%pvt%'
    OR LOWER("#loc +name") LIKE '%optics%'
    OR LOWER("#loc +name") LIKE '%eye%'
    OR LOWER("#loc +name") LIKE '%chamber%'
)
"""

rows = con.execute(query).fetchall()
print(f"Matched candidate clinics: {len(rows)}")

clinics = []
for r in rows:
    osm_id, name, amenity, healthcare, city, street, postcode, geom, meta_id = r
    if not name or len(name.strip()) < 3:
        continue
    
    # Parse coordinates from geometry: "{'type': 'Point', 'coordinates': [lng, lat]}"
    m = re.search(r'\[\s*([0-9.]+)\s*,\s*([0-9.]+)\s*\]', str(geom))
    if not m:
        continue
    lng = float(m.group(1))
    lat = float(m.group(2))
    
    # Sanity check for Bangladesh
    if not (20.5 <= lat <= 26.7 and 88.0 <= lng <= 92.7):
        continue
        
    clinics.append({
        "osm_id": osm_id,
        "name": name.strip(),
        "amenity": amenity or "",
        "healthcare": healthcare or "",
        "city": (city or "").strip(),
        "street": (street or "").strip(),
        "postcode": (postcode or "").strip(),
        "latitude": lat,
        "longitude": lng,
        "meta_id": meta_id or ""
    })

print(f"Valid clinics inside Bangladesh: {len(clinics)}")
with open('./scripts/all_extracted_candidates.json', 'w', encoding='utf-8') as f:
    json.dump(clinics, f, ensure_ascii=False, indent=2)
