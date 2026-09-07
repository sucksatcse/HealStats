import json
import re

with open('./scripts/all_extracted_candidates.json', 'r', encoding='utf-8') as f:
    candidates = json.load(f)

print(f"Total candidate clinics: {len(candidates)}")

# Approximate division classifier based on Bangladesh administrative geography
def get_division(lat, lng):
    if lat >= 25.1 and lng <= 89.8:
        return "Rangpur"
    if lat >= 24.4 and lng >= 91.0:
        return "Sylhet"
    if lat >= 24.3 and 89.6 <= lng <= 91.0:
        return "Mymensingh"
    if 23.8 <= lat <= 25.3 and lng <= 89.7:
        return "Rajshahi"
    if lat <= 23.2 and 89.9 <= lng <= 91.0:
        return "Barishal"
    if lng <= 89.9 and lat <= 24.0:
        return "Khulna"
    if lng >= 90.8 and lat <= 24.3:
        return "Chattogram"
    return "Dhaka"

# Filter strictly for Community Clinics or rural public clinics
community_clinics = []
for c in candidates:
    name = c['name']
    
    # Priority 1: Explicitly named Community Clinic
    is_cc_name = bool(re.search(r'community\s*clinic', name, re.I) or 'কমিউনিটি ক্লিনিক' in name)
    
    # Priority 2: Government/Rural Health Center / Sub-Center / Clinic
    is_rural_clinic = bool(re.search(r'(health\s*sub\s*cent(er|re)|union\s*health|sub\s*cent(er|re)|clinic)', name, re.I) or 'উপ-স্বাস্থ্য কেন্দ্র' in name or 'স্বাস্থ্য কেন্দ্র' in name)
    
    # Exclusions
    is_excluded = bool(re.search(r'hospital|diagnostic|dental|veterinary|pharmacy|complex|eye|pvt|private|chamber|dr\.|doctor|laser|specialized|diabetes|matrisadan|child\s*care|red\s*crescent|marie\s*stopes|brac|suriya|clinic\s*and\s*diagnostic|college|institute', name, re.I))
    
    if (is_cc_name or is_rural_clinic) and not is_excluded:
        div = get_division(c['latitude'], c['longitude'])
        c['division'] = div
        c['is_strict_cc'] = is_cc_name
        community_clinics.append(c)

print(f"Filtered community / rural public clinics: {len(community_clinics)}")
strict_count = sum(1 for c in community_clinics if c['is_strict_cc'])
print(f"Strict 'Community Clinic' in name: {strict_count}")

# Count by division
div_counts = {}
for c in community_clinics:
    d = c['division']
    div_counts[d] = div_counts.get(d, 0) + 1

print("Distribution by Division:")
for d, count in sorted(div_counts.items()):
    print(f"  {d}: {count}")
