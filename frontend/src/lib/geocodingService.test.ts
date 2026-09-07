import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }))
vi.mock("./supabase", () => ({ supabase: { auth: { getSession } } }))
import { searchPlaces } from "./geocodingService"

const place = {
  id: "node/1",
  label: "Example clinic, Bangladesh",
  latitude: 23.8,
  longitude: 90.4,
}
const fetchMock = vi.fn()

beforeEach(() => {
  getSession
    .mockReset()
    .mockResolvedValue({
      data: { session: { access_token: "test-token" } },
      error: null,
    })
  fetchMock.mockReset()
  vi.stubGlobal("fetch", fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

describe("explicit place search", () => {
  it("uses the existing session and same-origin API only when invoked", async () => {
    expect(fetchMock).not.toHaveBeenCalled()
    fetchMock.mockResolvedValue(new Response(JSON.stringify([place])))
    const signal = new AbortController().signal
    expect(await searchPlaces("Dhaka clinic", signal)).toEqual([place])
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock).toHaveBeenCalledWith("/api/geocode?q=Dhaka+clinic", {
      headers: {
        Authorization: "Bearer test-token",
        Accept: "application/json",
      },
      cache: "no-store",
      signal,
    })
  })

  it("returns empty results without a retry", async () => {
    fetchMock.mockResolvedValue(new Response("[]"))
    expect(await searchPlaces("No match")).toEqual([])
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it.each([401, 403, 429, 503, 500])(
    "maps HTTP %i to a translation key without raw errors or retries",
    async (status) => {
      fetchMock.mockResolvedValue(
        new Response("private upstream details", { status }),
      )
      const key =
        status === 401 || status === 403
          ? "map:loginRequired"
          : status === 429
            ? "map:rateLimited"
            : "map:placeSearchError"
      await expect(searchPlaces("Dhaka")).rejects.toThrow(key)
      expect(fetchMock).toHaveBeenCalledOnce()
    },
  )

  it("rejects missing sessions, session errors and malformed queries without fetch", async () => {
    getSession.mockResolvedValueOnce({ data: { session: null }, error: null })
    await expect(searchPlaces("Dhaka")).rejects.toThrow("map:loginRequired")
    getSession.mockRejectedValueOnce(new Error("private"))
    await expect(searchPlaces("Dhaka")).rejects.toThrow("map:loginRequired")
    for (const query of ["", "x", "x".repeat(201), "Dhaka\nclinic"]) {
      await expect(searchPlaces(query)).rejects.toThrow("map:placeSearchError")
    }
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([
    "{}",
    "null",
    "bad json",
    JSON.stringify([{ ...place, latitude: 40 }]),
    "[null]",
  ])("rejects malformed results %s", async (body) => {
    fetchMock.mockResolvedValue(new Response(body))
    await expect(searchPlaces("Dhaka")).rejects.toThrow("map:placeSearchError")
  })

  it("sanitizes network/abort errors", async () => {
    fetchMock.mockRejectedValue(new Error("private error"))
    await expect(searchPlaces("Dhaka")).rejects.toThrow("map:placeSearchError")
    expect(fetchMock).toHaveBeenCalledOnce()
  })
})
