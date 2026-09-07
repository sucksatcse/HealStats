import { supabase } from "./supabase"

export type PlaceResult = {
  id: string
  label: string
  latitude: number
  longitude: number
}

/** Explicit form submit only. No autocomplete, effects, retries or direct Nominatim calls. */
export async function searchPlaces(
  query: string,
  signal?: AbortSignal,
): Promise<PlaceResult[]> {
  let token: string | undefined
  try {
    const { data, error } = await supabase.auth.getSession()
    if (!error) token = data.session?.access_token
  } catch {
    throw new Error("map:loginRequired")
  }
  if (!token) throw new Error("map:loginRequired")
  if (
    query.length > 200 ||
    query.trim().length < 2 ||
    /[\u0000-\u001f\u007f]/u.test(query)
  ) {
    throw new Error("map:placeSearchError")
  }
  let response: Response
  try {
    response = await fetch(
      `/api/geocode?${new URLSearchParams({ q: query.trim() })}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
        signal,
      },
    )
  } catch {
    throw new Error("map:placeSearchError")
  }
  if (response.status === 401 || response.status === 403)
    throw new Error("map:loginRequired")
  if (response.status === 429) throw new Error("map:rateLimited")
  if (!response.ok) throw new Error("map:placeSearchError")
  try {
    const results: unknown = await response.json()
    if (
      !Array.isArray(results) ||
      results.length > 5 ||
      !results.every(
        (place: PlaceResult) =>
          place !== null &&
          typeof place === "object" &&
          typeof place.id === "string" &&
          place.id.length > 0 &&
          typeof place.label === "string" &&
          place.label.trim().length > 0 &&
          Number.isFinite(place.latitude) &&
          place.latitude >= 20.5 &&
          place.latitude <= 26.7 &&
          Number.isFinite(place.longitude) &&
          place.longitude >= 88 &&
          place.longitude <= 92.7,
      )
    )
      throw new Error()
    return results.map(({ id, label, latitude, longitude }) => ({
      id,
      label,
      latitude,
      longitude,
    }))
  } catch {
    throw new Error("map:placeSearchError")
  }
}
