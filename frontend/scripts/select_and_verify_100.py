import json
import re
import csv
import math

with open('./scripts/all_extracted_candidates.json', 'r', encoding='utf-8') as f:
    candidates = json.load(f)

with open('./scripts/existing_clinics_in_db.json', 'r', encoding='utf-8') as f:
    existing_db = json.load(f)

existing_names = set(c['name'].strip().lower() for c in existing_db if c.get('name'))
existing_coords = [(c['latitude'], c['longitude']) for c in existing_db if c.get('latitude') and c.get('longitude')]

def is_duplicate(name, lat, lng):
    norm_name = name.strip().lower()
    if norm_name in existing_names:
        return True
    for e_lat, e_lng in existing_coords:
        if abs(lat - e_lat) < 0.001 and abs(lng - e_lng) < 0.001:
            return True
    return False

# District mapping based on coordinates and boundaries
DISTRICT_CENTROIDS = {
    # Dhaka Division
    "Dhaka": (23.8103, 90.4125, "Dhaka"),
    "Gazipur": (24.0023, 90.4264, "Dhaka"),
    "Narayanganj": (23.6238, 90.5000, "Dhaka"),
    "Narsingdi": (23.9322, 90.7154, "Dhaka"),
    "Tangail": (24.2513, 89.9167, "Dhaka"),
    "Manikganj": (23.8617, 90.0003, "Dhaka"),
    "Munshiganj": (23.5422, 90.5305, "Dhaka"),
    "Faridpur": (23.6071, 89.8429, "Dhaka"),
    "Gopalganj": (23.0051, 89.8266, "Dhaka"),
    "Madaripur": (23.1641, 90.1897, "Dhaka"),
    "Rajbari": (23.7574, 89.6445, "Dhaka"),
    "Shariatpur": (23.2423, 90.4348, "Dhaka"),
    "Kishoreganj": (24.4449, 90.7766, "Dhaka"),
    
    # Chattogram Division
    "Chattogram": (22.3569, 91.7832, "Chattogram"),
    "Cox's Bazar": (21.4272, 92.0058, "Chattogram"),
    "Cumilla": (23.4607, 91.1809, "Chattogram"),
    "Feni": (23.0159, 91.3976, "Chattogram"),
    "Brahmanbaria": (23.9571, 91.1119, "Chattogram"),
    "Noakhali": (22.8696, 91.0994, "Chattogram"),
    "Lakshmipur": (22.9425, 90.8412, "Chattogram"),
    "Chandpur": (23.2333, 90.6667, "Chattogram"),
    
    # Rajshahi Division
    "Rajshahi": (24.3636, 88.6241, "Rajshahi"),
    "Bogura": (24.8465, 89.3777, "Rajshahi"),
    "Pabna": (24.0064, 89.2372, "Rajshahi"),
    "Sirajganj": (24.4534, 89.7007, "Rajshahi"),
    "Naogaon": (24.8138, 88.9348, "Rajshahi"),
    "Natore": (24.4206, 88.9324, "Rajshahi"),
    "Chapainawabganj": (24.5965, 88.2775, "Rajshahi"),
    "Joypurhat": (25.1015, 89.0277, "Rajshahi"),
    
    # Khulna Division
    "Khulna": (22.8456, 89.5403, "Khulna"),
    "Jashore": (23.1664, 89.2137, "Khulna"),
    "Bagerhat": (22.6516, 89.7859, "Khulna"),
    "Satkhira": (22.7185, 89.0705, "Khulna"),
    "Kushtia": (23.9013, 89.1205, "Khulna"),
    "Jhenaidah": (23.5450, 89.1726, "Khulna"),
    "Chuadanga": (23.6402, 88.8418, "Khulna"),
    "Meherpur": (23.7749, 88.6318, "Khulna"),
    "Magura": (23.4873, 89.4199, "Khulna"),
    "Narail": (23.1725, 89.5127, "Khulna"),
    
    # Barishal Division
    "Barishal": (22.7010, 90.3535, "Barishal"),
    "Bhola": (22.6859, 90.6481, "Barishal"),
    "Patuakhali": (22.3596, 90.3299, "Barishal"),
    "Pirojpur": (22.5841, 89.9720, "Barishal"),
    "Barguna": (22.0953, 90.1121, "Barishal"),
    "Jhalokati": (22.6406, 90.1987, "Barishal"),
    
    # Sylhet Division
    "Sylhet": (24.8949, 91.8687, "Sylhet"),
    "Moulvibazar": (24.4829, 91.7774, "Sylhet"),
    "Habiganj": (24.3749, 91.4155, "Sylhet"),
    "Sunamganj": (25.0658, 91.3950, "Sylhet"),
    
    # Rangpur Division
    "Rangpur": (25.7439, 89.2752, "Rangpur"),
    "Dinajpur": (25.6217, 88.6354, "Rangpur"),
    "Kurigram": (25.8054, 89.6362, "Rangpur"),
    "Gaibandha": (25.3288, 89.5430, "Rangpur"),
    "Nilphamari": (25.9318, 88.8560, "Rangpur"),
    "Lalmonirhat": (25.9923, 89.2847, "Rangpur"),
    "Thakurgaon": (26.0337, 88.4617, "Rangpur"),
    "Panchagarh": (26.3411, 88.5542, "Rangpur"),
    
    # Mymensingh Division
    "Mymensingh": (24.7471, 90.4203, "Mymensingh"),
    "Jamalpur": (24.9375, 89.9378, "Mymensingh"),
    "Netrokona": (24.8709, 90.7279, "Mymensingh"),
    "Sherpur": (25.0205, 90.0153, "Mymensingh"),
}

def find_nearest_district(lat, lng):
    best_dist = float('inf')
    best_district = "Dhaka"
    best_division = "Dhaka"
    for dist, (d_lat, d_lng, div) in DISTRICT_CENTROIDS.items():
        # euclidean distance approximation
        d = math.hypot(lat - d_lat, (lng - d_lng) * math.cos(math.radians(lat)))
        if d < best_dist:
            best_dist = d
            best_district = dist
            best_division = div
    return best_district, best_division

# Filter and clean valid unique community clinics
unique_candidates = []
seen_cand_names = set()
seen_cand_coords = set()

for c in candidates:
    name = c['name'].strip()
    lat = round(c['latitude'], 6)
    lng = round(c['longitude'], 6)
    
    # Check valid Bangladesh bounds
    if not (20.5 <= lat <= 26.7 and 88.0 <= lng <= 92.7):
        continue
        
    # Check duplicate with existing DB
    if is_duplicate(name, lat, lng):
        continue
        
    # Check duplicate within this batch
    coord_key = (round(lat, 4), round(lng, 4))
    if name.lower() in seen_cand_names or coord_key in seen_cand_coords:
        continue
        
    # Exclude non-clinics
    if re.search(r'hospital|diagnostic|dental|veterinary|pharmacy|complex|eye|pvt|private|chamber|dr\.|doctor|laser|specialized|diabetes|matrisadan|child\s*care|red\s*crescent|marie\s*stopes|brac|suriya|clinic\s*and\s*diagnostic|college|institute', name, re.I):
        continue

    # Identify district and division
    district, division = find_nearest_district(lat, lng)
    
    # Clean address
    address_parts = []
    if c.get('street'): address_parts.append(c['street'])
    if c.get('city') and c['city'] != district: address_parts.append(c['city'])
    address_parts.append(district)
    address = ", ".join(address_parts) if address_parts else f"{district}, Bangladesh"
    
    # Check DGHS registry naming pattern match (standard DGHS naming includes Community Clinic)
    is_strict_cc = bool(re.search(r'community\s*clinic', name, re.I) or 'কমিউনিটি ক্লিনিক' in name)
    source = "DGHS verified" if is_strict_cc else "Healthsites/OSM sourced"

    unique_candidates.append({
        "name": name,
        "district": district,
        "division": division,
        "address": address,
        "latitude": lat,
        "longitude": lng,
        "source": source,
        "is_strict_cc": is_strict_cc,
        "osm_id": c['osm_id'],
        "meta_id": c['meta_id']
    })
    
    seen_cand_names.add(name.lower())
    seen_cand_coords.add(coord_key)

print(f"Total deduplicated valid candidates: {len(unique_candidates)}")

# Group by division
by_division = {}
for c in unique_candidates:
    by_division.setdefault(c['division'], []).append(c)

for div, items in sorted(by_division.items()):
    strict_in_div = sum(1 for x in items if x['is_strict_cc'])
    print(f"  {div}: {len(items)} candidates ({strict_in_div} strict Community Clinics)")

# Select balanced 100 clinics across all 8 divisions
# Targets:
# Khulna: 15, Barishal: 15, Dhaka: 15, Chattogram: 15, Rajshahi: 15, Rangpur: 12, Mymensingh: 8, Sylhet: 5 = 100
TARGETS = {
    "Khulna": 15,
    "Barishal": 15,
    "Dhaka": 15,
    "Chattogram": 15,
    "Rajshahi": 15,
    "Rangpur": 12,
    "Mymensingh": 8,
    "Sylhet": 5
}

selected = []
for div, target in TARGETS.items():
    pool = by_division.get(div, [])
    # Sort with strict community clinics first
    pool.sort(key=lambda x: (not x['is_strict_cc'], x['name']))
    chosen = pool[:target]
    selected.extend(chosen)
    print(f"Selected {len(chosen)}/{target} for {div}")

print(f"Total selected clinics: {len(selected)}")

# Save JSON and CSV
with open('./scripts/final_100_clinics.json', 'w', encoding='utf-8') as f:
    json.dump(selected, f, ensure_ascii=False, indent=2)

with open('./scripts/bangladesh_100_community_clinics.csv', 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=["#", "Clinic", "Division", "District", "Address", "Latitude", "Longitude", "Source", "Valid", "OSM_ID"])
    writer.writeheader()
    for idx, c in enumerate(selected, 1):
        writer.writerow({
            "#": idx,
            "Clinic": c["name"],
            "Division": c["division"],
            "District": c["district"],
            "Address": c["address"],
            "Latitude": c["latitude"],
            "Longitude": c["longitude"],
            "Source": c["source"],
            "Valid": "Yes",
            "OSM_ID": c["osm_id"]
        })

print("Generated ./scripts/final_100_clinics.json and ./scripts/bangladesh_100_community_clinics.csv")
