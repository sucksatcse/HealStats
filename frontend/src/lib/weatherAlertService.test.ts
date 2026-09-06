import { describe, it, expect } from "vitest"
import { evaluateHazard, MONITORED_REGIONS } from "./weatherAlertService"

describe("weatherAlertService", () => {
  it("defines primary monitored climate-vulnerable clinic regions in Bangladesh", () => {
    expect(MONITORED_REGIONS.length).toBeGreaterThanOrEqual(4)
    expect(MONITORED_REGIONS.some((r) => r.region.includes("Bhola"))).toBe(true)
    expect(MONITORED_REGIONS.some((r) => r.region.includes("Sunamganj"))).toBe(true)
  })

  it("evaluates severe gale as critical cyclone alert", () => {
    const hazard = evaluateHazard(
      "Char Fasson, Bhola",
      "Coastal Delta",
      22.18,
      90.71,
      29,
      88,
      62, // High wind
      10,
      95
    )
    expect(hazard.riskLevel).toBe("critical")
    expect(hazard.hazardTitle).toContain("Cyclone Alert")
  })

  it("evaluates heavy rainfall in flood basin as warning", () => {
    const hazard = evaluateHazard(
      "Sunamganj",
      "Flash Flood Basin",
      25.07,
      91.4,
      26,
      92,
      20,
      35, // 35mm rain
      65
    )
    expect(hazard.riskLevel).toBe("warning")
    expect(hazard.hazardTitle).toContain("Flash Flood")
  })

  it("evaluates benign conditions as normal", () => {
    const hazard = evaluateHazard(
      "Kurigram",
      "River Basin",
      25.81,
      89.65,
      28,
      60,
      12,
      0,
      1
    )
    expect(hazard.riskLevel).toBe("normal")
  })
})
