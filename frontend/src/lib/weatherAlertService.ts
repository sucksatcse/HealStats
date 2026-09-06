// ── External Weather & Disaster Alert Service for HealStats ──
// Fetches live meteorological conditions and evaluates cyclone, flood, and extreme
// weather risks for rural clinic regions in Bangladesh using Open-Meteo public API.

export interface RegionalWeatherHazard {
  id: string
  region: string
  zone: string
  coordinates: { lat: number; lon: number }
  temperature: number
  humidity: number
  windSpeed: number
  precipitation: number
  weatherCode: number
  riskLevel: "critical" | "warning" | "advisory" | "normal"
  hazardTitle: string
  advisoryText: string
  updatedAt: string
}

export const MONITORED_REGIONS = [
  {
    region: "Char Fasson, Bhola",
    zone: "Coastal Delta / Island",
    lat: 22.18,
    lon: 90.71,
  },
  {
    region: "Sunamganj Haor Basin",
    zone: "Northeast Wetland (Flash Flood)",
    lat: 25.07,
    lon: 91.4,
  },
  {
    region: "Cox's Bazar / Teknaf",
    zone: "Bay of Bengal Cyclone Corridor",
    lat: 21.43,
    lon: 91.98,
  },
  {
    region: "Kurigram / Chilmari",
    zone: "Brahmaputra Flood Plain",
    lat: 25.81,
    lon: 89.65,
  },
]

export function evaluateHazard(
  regionName: string,
  zone: string,
  lat: number,
  lon: number,
  temp: number,
  humidity: number,
  windSpeed: number,
  rain: number,
  weatherCode: number
): RegionalWeatherHazard {
  let riskLevel: "critical" | "warning" | "advisory" | "normal" = "normal"
  let hazardTitle = `Normal Conditions · ${regionName}`
  let advisoryText = `Wind ${windSpeed} km/h, Temp ${temp}°C, Humidity ${humidity}%. Standard clinic operations.`

  // Weather codes per WMO standard: 95-99 thunderstorm/severe, 65/82 heavy rain, 75 heavy snow
  const isSevereThunderstorm = weatherCode >= 95
  const isHeavyRain = weatherCode === 65 || weatherCode === 82 || rain >= 15

  if (windSpeed >= 55 || (isSevereThunderstorm && windSpeed >= 40)) {
    riskLevel = "critical"
    hazardTitle = `Cyclone Alert · Severe Gale Warning (${regionName})`
    advisoryText = `High coastal wind gusts (${windSpeed} km/h) detected. Threat of storm surge and power outage. Secure mobile EHR units and prep shelter clinic supplies.`
  } else if (rain >= 25 || (isHeavyRain && zone.includes("Flood"))) {
    riskLevel = "warning"
    hazardTitle = `Heavy Inundation & Flash Flood Watch (${regionName})`
    advisoryText = `Excessive rainfall (${rain} mm) recorded in low-lying catchment. Risk of road cut-off and waterborne diarrhea outbreak. Ready ORS and emergency triage kits.`
  } else if (temp >= 38 && humidity >= 65) {
    riskLevel = "warning"
    hazardTitle = `Severe Heat Stress Warning (${regionName})`
    advisoryText = `Dangerous heat index with ambient temp ${temp}°C and ${humidity}% humidity. Monitor elderly and dehydration cases; ensure drinking water supplies.`
  } else if (windSpeed >= 30 || rain >= 8 || isSevereThunderstorm) {
    riskLevel = "advisory"
    hazardTitle = `Inclement Weather Advisory (${regionName})`
    advisoryText = `Elevated wind/squalls (${windSpeed} km/h) and showers. Monitor clinic solar/battery backup and sync queues ahead of potential grid outages.`
  }

  return {
    id: `weather-${lat}-${lon}`,
    region: regionName,
    zone,
    coordinates: { lat, lon },
    temperature: temp,
    humidity,
    windSpeed,
    precipitation: rain,
    weatherCode,
    riskLevel,
    hazardTitle,
    advisoryText,
    updatedAt: new Date().toISOString(),
  }
}

export async function fetchLiveWeatherAlerts(): Promise<RegionalWeatherHazard[]> {
  try {
    const promises = MONITORED_REGIONS.map(async (reg) => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${reg.lat}&longitude=${reg.lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code`
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
      if (!res.ok) throw new Error(`Weather API returned ${res.status}`)
      const data = await res.json()
      const current = data.current || {}

      return evaluateHazard(
        reg.region,
        reg.zone,
        reg.lat,
        reg.lon,
        Number(current.temperature_2m ?? 28),
        Number(current.relative_humidity_2m ?? 70),
        Number(current.wind_speed_10m ?? 12),
        Number(current.precipitation ?? 0),
        Number(current.weather_code ?? 0)
      )
    })

    const results = await Promise.allSettled(promises)
    const hazards: RegionalWeatherHazard[] = []

    for (let i = 0; i < results.length; i++) {
      const r = results[i]
      if (r.status === "fulfilled") {
        hazards.push(r.value)
      } else {
        // Fallback baseline for this region if offline or network error
        const reg = MONITORED_REGIONS[i]
        hazards.push(
          evaluateHazard(
            reg.region,
            reg.zone,
            reg.lat,
            reg.lon,
            28,
            75,
            14,
            0,
            1
          )
        )
      }
    }

    return hazards
  } catch (err) {
    console.warn("[HealStats] Weather alert fetch failed, using fallback regional models:", err)
    return MONITORED_REGIONS.map((reg) =>
      evaluateHazard(reg.region, reg.zone, reg.lat, reg.lon, 28, 75, 14, 0, 1)
    )
  }
}
