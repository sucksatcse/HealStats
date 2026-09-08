/**
 * publicStaffApi.mjs
 * Server-side endpoint for GET /api/public/staff.
 *
 * Securely retrieves the active staff members and linked clinics
 * using the server environment secret key, sanitizes internal fields
 * (stripping auth_user_id, DB internal IDs, and private tokens),
 * and serves public-safe staff directory data to anonymous visitors.
 */

export function createPublicStaffMiddleware(config = {}) {
  const supabaseUrl =
    config.supabaseUrl || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const secretKey = config.supabaseSecretKey || process.env.SUPABASE_SECRET_KEY
  const anonKey =
    config.supabaseAnonKey ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY

  return async (req, res, next = () => {}) => {
    let url
    try {
      url = new URL(req.url ?? "/", "http://localhost")
    } catch {
      return next()
    }

    if (url.pathname !== "/api/public/staff") {
      return next()
    }

    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=120")
    res.setHeader("Content-Type", "application/json; charset=utf-8")
    res.setHeader("X-Content-Type-Options", "nosniff")

    if (req.method !== "GET") {
      res.statusCode = 405
      res.setHeader("Allow", "GET")
      res.end(JSON.stringify({ error: "Method Not Allowed" }))
      return
    }

    try {
      const apiKey = secretKey || anonKey
      if (!supabaseUrl || !apiKey) {
        throw new Error("Missing Supabase configuration")
      }

      const restUrl = new URL("/rest/v1/staff", supabaseUrl)
      restUrl.search = new URLSearchParams({
        select: "id,name,email,role,designation,is_active,clinics(name,zone,address)",
        order: "name.asc",
      }).toString()

      const response = await fetch(restUrl, {
        headers: {
          apikey: apiKey,
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Supabase REST responded with ${response.status}`)
      }

      const rawData = await response.json()
      const activeRows = (Array.isArray(rawData) ? rawData : []).filter(
        (r) => r.is_active !== false,
      )

      const clinicSet = new Set()
      const designationSet = new Set()

      const publicList = activeRows.map((row, idx) => {
        const rawClinic = Array.isArray(row.clinics)
          ? row.clinics[0]
          : row.clinics
        const clinicName =
          rawClinic?.name &&
          typeof rawClinic.name === "string" &&
          rawClinic.name.trim()
            ? rawClinic.name.trim()
            : "Unassigned"

        if (clinicName !== "Unassigned") {
          clinicSet.add(clinicName)
        }

        const clinicZone =
          rawClinic?.zone &&
          typeof rawClinic.zone === "string" &&
          rawClinic.zone.trim()
            ? rawClinic.zone.trim()
            : null

        const clinicAddress =
          rawClinic?.address &&
          typeof rawClinic.address === "string" &&
          rawClinic.address.trim()
            ? rawClinic.address.trim()
            : null

        let formattedDesig = "Community Health Worker"
        if (row.designation) {
          const d = String(row.designation).toLowerCase().trim()
          if (d === "community_health_worker" || d === "chw") {
            formattedDesig = "Community Health Worker"
          } else if (d === "nurse") {
            formattedDesig = "Staff Nurse"
          } else if (
            d === "clinical_officer" ||
            d === "doctor" ||
            d === "medical_officer"
          ) {
            formattedDesig = "Clinical Officer"
          } else if (d === "administrator" || d === "admin") {
            formattedDesig = "Clinic Administrator"
          } else {
            formattedDesig = d
              .replace(/[_-]+/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase())
          }
        } else if (row.role === "admin") {
          formattedDesig = "Clinic Administrator"
        }

        designationSet.add(formattedDesig)

        return {
          key: `staff-member-${idx}-${(row.name || "member").replace(/\s+/g, "-").toLowerCase()}`,
          name: (row.name || "Health Worker").trim(),
          email:
            row.email && typeof row.email === "string" && row.email.trim()
              ? row.email.trim()
              : null,
          role: row.role === "admin" ? "admin" : "worker",
          designation: formattedDesig,
          clinicName,
          clinicZone,
          clinicAddress,
          photoUrl: null,
        }
      })

      res.statusCode = 200
      res.end(
        JSON.stringify({
          data: publicList,
          totalCount: publicList.length,
          clinics: Array.from(clinicSet).sort(),
          designations: Array.from(designationSet).sort(),
          error: null,
        }),
      )
    } catch (err) {
      console.error("[publicStaffApi] Failed to fetch staff:", err)
      res.statusCode = 500
      res.end(
        JSON.stringify({
          data: [],
          totalCount: 0,
          clinics: [],
          designations: [],
          error: "Failed to retrieve public staff directory.",
        }),
      )
    }
  }
}
