import { describe, it, expect } from "vitest"
import { parseOcrText } from "./ocrParser"

const field = (fields: ReturnType<typeof parseOcrText>, key: string) =>
  fields.find((f) => f.key === key)!

describe("parseOcrText", () => {
  it("extracts name, age and diagnosis from labelled lines", () => {
    const fields = parseOcrText("Name: John Doe\nAge: 34\nDiagnosis: Malaria")
    expect(field(fields, "patientName").value).toBe("John Doe")
    expect(field(fields, "age").value).toBe("34")
    expect(field(fields, "diagnosis").value).toBe("Malaria")
    expect(field(fields, "age").confidence).toBeGreaterThan(0)
  })

  it("returns zero-confidence empty fields when nothing matches", () => {
    const fields = parseOcrText("some unrelated text\nwith no labels")
    for (const f of fields) {
      expect(f.value).toBe("")
      expect(f.confidence).toBe(0)
    }
  })

  it("rejects a name that is too short", () => {
    const fields = parseOcrText("Name: Jo")
    expect(field(fields, "patientName").value).toBe("")
    expect(field(fields, "patientName").confidence).toBe(0)
  })

  it("always returns the three expected fields", () => {
    const fields = parseOcrText("")
    expect(fields.map((f) => f.key)).toEqual(["patientName", "age", "diagnosis"])
  })
})
