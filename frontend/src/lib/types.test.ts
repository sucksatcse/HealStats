import { describe, it, expect } from "vitest"
import {
  urgencyFromScore,
  urgencyScoreRange,
  shortId,
  initials,
} from "./types"

describe("urgencyFromScore", () => {
  it("maps the 1-5 scale to categorical levels", () => {
    expect(urgencyFromScore(5)).toBe("Critical")
    expect(urgencyFromScore(4)).toBe("High")
    expect(urgencyFromScore(3)).toBe("Moderate")
    expect(urgencyFromScore(2)).toBe("Low")
    expect(urgencyFromScore(1)).toBe("Stable")
  })

  it("treats null/undefined as Stable", () => {
    expect(urgencyFromScore(null)).toBe("Stable")
    expect(urgencyFromScore(undefined)).toBe("Stable")
  })

  it("clamps out-of-range scores", () => {
    expect(urgencyFromScore(9)).toBe("Critical")
    expect(urgencyFromScore(0)).toBe("Stable")
  })
})

describe("urgencyScoreRange", () => {
  it("returns an open-ended range for Critical", () => {
    expect(urgencyScoreRange("Critical")).toEqual({ min: 5, max: null })
  })

  it("returns bounded ranges for mid levels", () => {
    expect(urgencyScoreRange("High")).toEqual({ min: 4, max: 5 })
    expect(urgencyScoreRange("Moderate")).toEqual({ min: 3, max: 4 })
    expect(urgencyScoreRange("Low")).toEqual({ min: 2, max: 3 })
    expect(urgencyScoreRange("Stable")).toEqual({ min: 0, max: 2 })
  })
})

describe("shortId", () => {
  it("returns the first 8 hex chars upper-cased, stripping dashes", () => {
    expect(shortId("11111111-2222-3333-4444-555555555555")).toBe("11111111")
    expect(shortId("abcdef01-2345-6789-abcd-ef0123456789")).toBe("ABCDEF01")
  })
})

describe("initials", () => {
  it("takes up to two initials", () => {
    expect(initials("Nasrin Akter")).toBe("NA")
    expect(initials("Rafiqul")).toBe("R")
  })

  it("skips common honorifics", () => {
    expect(initials("Dr. Rafiqul Islam")).toBe("RI")
  })

  it("falls back to NA for empty input", () => {
    expect(initials("   ")).toBe("NA")
  })
})
