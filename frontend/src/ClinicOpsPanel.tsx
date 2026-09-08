import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { divIcon, type Marker as LeafletMarker } from "leaflet"
import {
  AttributionControl,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet"
import { useTheme } from "./ThemeContext"
import { useAuth } from "./AuthContext"
import {
  fetchClinicMapData,
  saveClinic,
  type ClinicActivity,
  type ClinicMapEntry,
} from "./lib/adminService"
import {
  BANGLADESH_BOUNDS,
  BANGLADESH_CENTER,
  filterClinics,
  hasCoordinates,
} from "./lib/clinicMapUtils"
import { searchPlaces, type PlaceResult } from "./lib/geocodingService"
import "leaflet/dist/leaflet.css"
import "./ClinicOpsPanel.css"

type Filter = "all" | ClinicActivity
type Focus = {
  latitude: number
  longitude: number
  zoom: number
} | null
type Draft = {
  id?: string
  name: string
  zone: string
  address: string
  latitude: string
  longitude: string
}
const COLORS = { active: "#22c55e", recent: "#f59e0b", quiet: "#94a3b8" }
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
const CARTO_ATTRIBUTION = `${OSM_ATTRIBUTION} &copy; <a href="https://carto.com/attributions">CARTO</a>`

function coordinates(draft: Draft | null) {
  if (!draft || !draft.latitude.trim() || !draft.longitude.trim()) return null
  const point = {
    latitude: Number(draft.latitude),
    longitude: Number(draft.longitude),
  }
  return hasCoordinates(point) ? point : null
}

function ClinicDetails({ clinic }: { clinic: ClinicMapEntry }) {
  const { t } = useTranslation()
  return (
    <div className="hs-clinic-details">
      <strong>{clinic.name}</strong>
      <p>
        {clinic.zone || t("map:unzoned")}
        {clinic.address ? ` · ${clinic.address}` : ""}
      </p>
      <p>
        <span
          className="hs-map-status"
          style={{ background: COLORS[clinic.activity] }}
        />
        {t(`map:${clinic.activity}`)}
      </p>
      <dl>
        <div>
          <dt>{t("map:detailPatients")}</dt>
          <dd>{clinic.patientCount}</dd>
        </div>
        <div>
          <dt>{t("map:detailVisits24h")}</dt>
          <dd>{clinic.visitsLast24h}</dd>
        </div>
        <div>
          <dt>{t("map:detailVisits7d")}</dt>
          <dd>{clinic.visitsLast7d}</dd>
        </div>
        <div>
          <dt>{t("map:detailHighRisk")}</dt>
          <dd>{clinic.highRisk}</dd>
        </div>
        <div>
          <dt>{t("map:detailPendingSync")}</dt>
          <dd>{clinic.pendingSync}</dd>
        </div>
      </dl>
      <p>
        {t("map:detailLastVisit", {
          time: clinic.lastVisitAt
            ? new Date(clinic.lastVisitAt).toLocaleString(t("map:dateLocale"))
            : t("map:timeNoVisits"),
        })}
      </p>
      {!hasCoordinates(clinic) && <p>{t("map:missingCoordinates")}</p>}
    </div>
  )
}

function ClinicMarker({
  clinic,
  selected,
  spotlight,
  onSelect,
  selectionFocus,
}: {
  clinic: ClinicMapEntry & {
    latitude: number
    longitude: number
  }
  selected: boolean
  spotlight: boolean
  onSelect: () => void
  selectionFocus: Focus
}) {
  const marker = useRef<LeafletMarker>(null)
  const icon = useMemo(
    () =>
      divIcon({
        className: `hs-clinic-marker ${selected ? "is-selected" : ""} ${
          spotlight ? "is-spotlit" : ""
        }`,
        html: `<span style="background:${COLORS[clinic.activity]}"></span>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14],
      }),
    [clinic.activity, selected, spotlight],
  )
  useEffect(() => {
    if (selected) marker.current?.openPopup()
    else marker.current?.closePopup()
  }, [selected, selectionFocus])
  return (
    <Marker
      ref={marker}
      position={[clinic.latitude, clinic.longitude]}
      icon={icon}
      title={clinic.name}
      alt={clinic.name}
      eventHandlers={{ click: onSelect }}
    >
      <Tooltip direction="top">
        <ClinicDetails clinic={clinic} />
      </Tooltip>
      <Popup autoPan={false} maxHeight={140}>
        <ClinicDetails clinic={clinic} />
      </Popup>
    </Marker>
  )
}

function MapBehavior({
  focus,
  placing,
  onPlace,
}: {
  focus: Focus
  placing: boolean
  onPlace: (latitude: number, longitude: number) => void
}) {
  const { t } = useTranslation()
  const map = useMapEvents({
    click: (event) => {
      if (placing) onPlace(event.latlng.lat, event.latlng.lng)
    },
  })
  useEffect(() => {
    if (!focus) return
    map.flyTo([focus.latitude, focus.longitude], focus.zoom, {
      animate: !matchMedia("(prefers-reduced-motion: reduce)").matches,
      duration: 0.6,
    })
  }, [focus, map])
  useEffect(() => {
    const container = map.getContainer()
    container.setAttribute("aria-label", t("map:ariaMap"))
    container
      .querySelector(".leaflet-control-zoom-in")
      ?.setAttribute("aria-label", t("map:zoomIn"))
    container
      .querySelector(".leaflet-control-zoom-out")
      ?.setAttribute("aria-label", t("map:zoomOut"))
  }, [map, t])
  useEffect(() => {
    const container = map.getContainer()
    const update = () => {
      const center = map.getCenter()
      container.dataset.latitude = String(center.lat)
      container.dataset.longitude = String(center.lng)
      container.dataset.zoom = String(map.getZoom())
    }
    update()
    map.on("moveend zoomend", update)
    const observer = new ResizeObserver(() =>
      map.invalidateSize({ pan: false }),
    )
    observer.observe(container)
    return () => {
      observer.disconnect()
      map.off("moveend zoomend", update)
    }
  }, [map])
  return null
}

function TileStatus({ dark }: { dark: boolean }) {
  const { t } = useTranslation()
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const map = useMap()
  useEffect(() => {
    setFailed(false)
  }, [dark])
  return (
    <>
      <TileLayer
        key={`${dark}-${attempt}`}
        className={dark ? "leaflet-dark-tiles" : ""}
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution={OSM_ATTRIBUTION}
        maxZoom={19}
        eventHandlers={{ tileerror: () => setFailed(true) }}
      />
      {failed && (
        <div
          className="hs-map-tile-error"
          role="status"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {t("map:tilesUnavailable")}
          <button
            type="button"
            onClick={() => {
              setFailed(false)
              setAttempt((n) => n + 1)
              map.invalidateSize()
            }}
          >
            {t("common:retry")}
          </button>
        </div>
      )}
    </>
  )
}

export default function ClinicOpsPanel() {
  const { dark } = useTheme()
  const { profile } = useAuth()
  const { t } = useTranslation()
  const [entries, setEntries] = useState<ClinicMapEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [coordinatesAvailable, setCoordinatesAvailable] = useState(false)
  const [loadedAt, setLoadedAt] = useState<Date | null>(null)
  const [filter, setFilter] = useState<Filter>("all")
  const [query, setQuery] = useState("")
  const [spotlight, setSpotlight] = useState(false)
  const [listOpen, setListOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [focus, setFocus] = useState<Focus>(null)
  const [places, setPlaces] = useState<PlaceResult[]>([])
  const [placeTarget, setPlaceTarget] = useState<"map" | "editor">("map")
  const [placeStatus, setPlaceStatus] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)
  const searchAbort = useRef<AbortController | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [placing, setPlacing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const editorHeading = useRef<HTMLHeadingElement>(null)
  const loadVersion = useRef(0)
  const canEdit =
    profile?.role === "admin" &&
    !["nurse", "clinical_officer"].includes(profile.designation ?? "")

  const load = useCallback(async () => {
    const version = ++loadVersion.current
    setLoading(true)
    setError(false)
    try {
      const result = await fetchClinicMapData()
      if (version !== loadVersion.current) return
      setError(!!result.error)
      setEntries(result.error ? [] : result.clinics)
      setCoordinatesAvailable(result.coordinatesAvailable === true)
      if (!result.error) setLoadedAt(new Date())
    } catch {
      if (version !== loadVersion.current) return
      setError(true)
      setEntries([])
    } finally {
      if (version === loadVersion.current) setLoading(false)
    }
  }, [])
  useEffect(() => {
    void load()
    return () => {
      ++loadVersion.current
      searchAbort.current?.abort()
    }
  }, [load])
  useEffect(() => {
    if (draft) editorHeading.current?.focus()
  }, [draft?.id, draft !== null])

  const filtered = useMemo(
    () => filterClinics(entries, filter, query, spotlight),
    [entries, filter, query, spotlight],
  )
  const mapped = filtered.filter(hasCoordinates)
  const unmapped = entries.filter((clinic) => !hasCoordinates(clinic))
  const selected = entries.find((clinic) => clinic.id === selectedId) ?? null
  const draftPoint = coordinates(draft)

  function selectClinic(clinic: ClinicMapEntry) {
    setSelectedId(clinic.id)
    setPlaces([])
    if (hasCoordinates(clinic))
      setFocus({
        latitude: clinic.latitude,
        longitude: clinic.longitude,
        zoom: 14,
      })
  }
  function cancelSearch() {
    searchAbort.current?.abort()
    searchAbort.current = null
    setSearching(false)
    setPlaces([])
    setPlaceStatus(null)
  }
  async function findPlaces(text: string, target: "map" | "editor") {
    cancelSearch()
    const controller = new AbortController()
    searchAbort.current = controller
    setSearching(true)
    setPlaceTarget(target)
    try {
      const results = await searchPlaces(text, controller.signal)
      if (controller.signal.aborted) return
      setPlaces(results)
      if (!results.length) setPlaceStatus("map:noPlaces")
    } catch (err) {
      if (!controller.signal.aborted)
        setPlaceStatus(
          err instanceof Error ? err.message : "map:placeSearchError",
        )
    } finally {
      if (!controller.signal.aborted) setSearching(false)
    }
  }
  function beginEdit(clinic?: ClinicMapEntry) {
    cancelSearch()
    setSaved(false)
    setSaveError(null)
    setPlacing(false)
    setDraft({
      id: clinic?.id,
      name: clinic?.name ?? "",
      zone: clinic?.zone ?? "",
      address: clinic?.address ?? "",
      latitude: clinic?.latitude?.toString() ?? "",
      longitude: clinic?.longitude?.toString() ?? "",
    })
  }
  function placeClinic(latitude: number, longitude: number) {
    if (!hasCoordinates({ latitude, longitude })) {
      setSaveError("map:invalidCoordinates")
      return
    }
    setDraft((current) =>
      current
        ? {
            ...current,
            latitude: latitude.toFixed(6),
            longitude: longitude.toFixed(6),
          }
        : null,
    )
    setSaveError(null)
    setPlacing(false)
  }
  async function submitClinic(event: React.FormEvent) {
    event.preventDefault()
    if (!draft || !draftPoint || !canEdit || saving) return
    setSaving(true)
    setSaveError(null)
    try {
      const result = await saveClinic({ ...draft, ...draftPoint })
      if (result.error || !result.data) {
        setSaveError(result.error ?? "map:saveError")
        return
      }
      setSelectedId(result.data.id)
      setFocus({ ...draftPoint, zoom: 14 })
      setDraft(null)
      setPlacing(false)
      setSaved(true)
      cancelSearch()
      await load()
    } catch {
      setSaveError("map:saveError")
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="hs-ops-map" aria-label={t("map:title")}>
      <header className="hs-map-toolbar">
        <div>
          <h2>{t("map:title")}</h2>
          <p>
            {t("map:databaseSnapshot")}
            {loadedAt &&
              ` · ${loadedAt.toLocaleTimeString(t("map:dateLocale"))}`}
          </p>
        </div>
        <div className="hs-map-actions">
          <button
            type="button"
            className="hs-map-button"
            onClick={() => void load()}
            disabled={loading || saving}
            aria-label={t("map:refreshAria")}
          >
            {t("map:refreshAction")}
          </button>
          <button
            type="button"
            className="hs-map-button"
            onClick={() =>
              setFocus({
                latitude: BANGLADESH_CENTER[0],
                longitude: BANGLADESH_CENTER[1],
                zoom: 7,
              })
            }
          >
            {t("map:resetView")}
          </button>
          {canEdit && (
            <button
              type="button"
              className="hs-map-button primary"
              disabled={loading || error || !coordinatesAvailable || !!draft}
              onClick={() => beginEdit()}
            >
              {t("map:addClinic")}
            </button>
          )}
        </div>
      </header>

      {!loading && !error && !coordinatesAvailable && (
        <p className="hs-map-notice" role="status">
          {t("map:migrationRequired")}
        </p>
      )}
      {saved && (
        <p className="hs-map-notice" role="status">
          {t("map:clinicSaved")}
        </p>
      )}
      <div className="hs-map-search">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void findPlaces(query, "map")
          }}
        >
          <label htmlFor="clinic-map-search">{t("map:searchLabel")}</label>
          <div className="hs-map-search-row">
            <input
              id="clinic-map-search"
              type="search"
              maxLength={200}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                cancelSearch()
              }}
              placeholder={t("map:searchPlaceholder")}
            />
            <button
              type="submit"
              className="hs-map-button"
              disabled={searching || query.trim().length < 2}
            >
              {searching ? t("common:loading") : t("map:searchPlaces")}
            </button>
            <button
              type="button"
              className="hs-map-button"
              onClick={() => {
                setQuery("")
                setFilter("all")
                setSpotlight(false)
                cancelSearch()
              }}
            >
              {t("common:clear")}
            </button>
          </div>
        </form>
        <p className="hs-map-muted">
          {t("map:searchPrivacy")}{" "}
          <a
            href="https://operations.osmfoundation.org/policies/nominatim/"
            target="_blank"
            rel="noreferrer"
          >
            {t("map:searchPolicy")}
          </a>
        </p>
        {query.trim() && (
          <div
            className="hs-map-search-results"
            aria-label={t("map:clinicResults")}
          >
            {filtered.slice(0, 8).map((clinic) => (
              <button
                type="button"
                key={clinic.id}
                onClick={() => selectClinic(clinic)}
              >
                {clinic.name} · {clinic.zone || t("map:unzoned")}
                {!hasCoordinates(clinic) && ` · ${t("map:missingCoordinates")}`}
              </button>
            ))}
            {!filtered.length && <p role="status">{t("map:noMatches")}</p>}
          </div>
        )}
        {placeStatus && <p role="status">{t(placeStatus)}</p>}
        {places.length > 0 && (
          <div
            className="hs-map-search-results"
            aria-label={t("map:placeResults")}
          >
            <p>{t("map:placeAttribution")}</p>
            {places.map((place) => (
              <button
                type="button"
                key={place.id}
                onClick={() => {
                  setFocus({
                    latitude: place.latitude,
                    longitude: place.longitude,
                    zoom: 13,
                  })
                  if (placeTarget === "editor" && draft)
                    placeClinic(place.latitude, place.longitude)
                  else {
                    setQuery("")
                    setFilter("all")
                    setSpotlight(false)
                    setSelectedId(null)
                  }
                  setPlaces([])
                }}
              >
                {place.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {draft && (
        <form
          className="hs-clinic-editor"
          onSubmit={submitClinic}
          aria-label={draft.id ? t("map:editClinic") : t("map:addClinic")}
        >
          <h3 ref={editorHeading} tabIndex={-1}>
            {draft.id ? t("map:editClinic") : t("map:addClinic")}
          </h3>
          <fieldset disabled={saving}>
            <div className="hs-editor-fields">
              {([
                "name",
                "zone",
                "address",
                "latitude",
                "longitude",
              ] as const).map((field) => (
                <label key={field}>
                  {t(`map:clinicField_${field}`)}
                  <input
                    type={
                      field === "latitude" || field === "longitude"
                        ? "number"
                        : "text"
                    }
                    step="any"
                    required
                    maxLength={field === "address" ? 150 : 100}
                    value={draft[field]}
                    onChange={(event) => {
                      setDraft({ ...draft, [field]: event.target.value })
                      setSaveError(null)
                    }}
                  />
                </label>
              ))}
            </div>
            <p className="hs-map-muted">{t("map:placementHelp")}</p>
            <div className="hs-map-actions">
              <button
                type="button"
                className="hs-map-button"
                aria-pressed={placing}
                onClick={() => setPlacing(!placing)}
              >
                {t("map:placeOnMap")}
              </button>
              <button
                type="button"
                className="hs-map-button"
                disabled={
                  searching || !draft.address.trim() || !draft.zone.trim()
                }
                onClick={() =>
                  void findPlaces(
                    `${draft.address}, ${draft.zone}, Bangladesh`,
                    "editor",
                  )
                }
              >
                {t("map:geocodeAddress")}
              </button>
              <button
                className="hs-map-button primary"
                type="submit"
                disabled={!draftPoint || !draft.name.trim()}
              >
                {saving ? t("common:loading") : t("map:saveClinic")}
              </button>
              <button
                type="button"
                className="hs-map-button"
                onClick={() => {
                  setDraft(null)
                  setPlacing(false)
                  cancelSearch()
                }}
              >
                {t("map:cancel")}
              </button>
            </div>
          </fieldset>
          {saveError && <p role="alert">{t(saveError)}</p>}
        </form>
      )}
      {placing && (
        <p className="hs-map-notice" role="status">
          {t("map:clickToPlace")}
        </p>
      )}

      <div className="hs-map-body">
        <aside className="hs-map-sidebar" aria-label={t("map:clinicList")}>
          <button
            type="button"
            className="hs-map-button hs-map-list-toggle"
            aria-expanded={listOpen}
            aria-controls="ops-clinic-list"
            onClick={() => setListOpen(!listOpen)}
          >
            {t("map:clinicsCount", { count: entries.length })} ·{" "}
            {t("map:toggleList")}
          </button>
          <div
            className={`hs-map-sidebar-content ${listOpen ? "is-open" : ""}`}
            id="ops-clinic-list"
          >
            <div className="hs-map-counts">
              {(["active", "recent", "quiet"] as const).map((activity) => (
                <span key={activity}>
                  <span
                    className="hs-map-status"
                    style={{ background: COLORS[activity] }}
                  />
                  {t(`map:${activity}`)}{" "}
                  {entries.filter((c) => c.activity === activity).length}
                </span>
              ))}
            </div>
            <div
              className="hs-map-filters"
              role="group"
              aria-label={t("map:activityFilter")}
            >
              {(["all", "active", "recent", "quiet"] as const).map((value) => (
                <button
                  type="button"
                  key={value}
                  aria-pressed={filter === value}
                  onClick={() => setFilter(value)}
                >
                  {value === "all" ? t("common:all") : t(`map:${value}`)}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="hs-map-button"
              aria-pressed={spotlight}
              disabled={loading || error}
              onClick={() => {
                setSpotlight(!spotlight)
                if (!spotlight) setFilter("all")
              }}
            >
              {t("map:quietSpotlight")}
            </button>
            {loading ? (
              <p role="status">{t("map:loadingClinics")}</p>
            ) : error ? (
              <div role="alert">
                <p>{t("map:loadError")}</p>
                <button className="hs-map-button" onClick={() => void load()}>
                  {t("common:retry")}
                </button>
              </div>
            ) : entries.length === 0 ? (
              <p role="status">{t("map:noClinics")}</p>
            ) : (
              <>
                {!filtered.length && <p role="status">{t("map:noMatches")}</p>}
                <div className="hs-map-clinic-list">
                  {filtered.map((clinic) => (
                    <button
                      type="button"
                      key={clinic.id}
                      aria-pressed={selectedId === clinic.id}
                      onClick={() => selectClinic(clinic)}
                    >
                      <strong>{clinic.name}</strong>
                      <span>{clinic.zone || t("map:unzoned")}</span>
                      <span>
                        <span
                          className="hs-map-status"
                          style={{ background: COLORS[clinic.activity] }}
                        />
                        {t(`map:${clinic.activity}`)} · {clinic.patientCount}{" "}
                        {t("map:detailPatients")}
                      </span>
                      {clinic.pendingSync > 0 && (
                        <span>
                          {t("map:queued", { count: clinic.pendingSync })}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                {unmapped.length > 0 && (
                  <section
                    className="hs-map-unmapped"
                    aria-label={t("map:notOnMapTitle")}
                  >
                    <h3>{t("map:notOnMap", { count: unmapped.length })}</h3>
                    <p>{t("map:missingCoordinatesHelp")}</p>
                    {unmapped.map((clinic) => (
                      <button
                        type="button"
                        key={clinic.id}
                        onClick={() => selectClinic(clinic)}
                      >
                        {clinic.name}
                      </button>
                    ))}
                  </section>
                )}
              </>
            )}
          </div>
        </aside>

        <div className="hs-map-canvas-column">
          {spotlight && (
            <p className="hs-map-notice">
              {t("map:spotlightBanner", {
                count: entries.filter((c) => c.activity === "quiet").length,
              })}
            </p>
          )}
          {loading && <p role="status">{t("map:loadingClinics")}</p>}
          {error && (
            <p className="hs-map-notice" role="alert">
              {t("map:loadError")}
            </p>
          )}
          <MapContainer
            attributionControl={false}
            center={BANGLADESH_CENTER}
            zoom={7}
            minZoom={6}
            maxZoom={19}
            maxBounds={BANGLADESH_BOUNDS}
            fadeAnimation={false}
            maxBoundsViscosity={0.8}
            scrollWheelZoom
            touchZoom
            dragging
            className={`hs-leaflet-map ${placing ? "is-placing" : ""}`}
          >
            <TileStatus dark={dark} />
            <AttributionControl position="bottomleft" />
            <MapBehavior
              focus={focus}
              placing={placing && !saving}
              onPlace={placeClinic}
            />
            {!loading &&
              !error &&
              mapped.map((clinic) => (
                <ClinicMarker
                  key={clinic.id}
                  clinic={clinic}
                  selected={selectedId === clinic.id}
                  selectionFocus={focus}
                  spotlight={spotlight && clinic.activity === "quiet"}
                  onSelect={() => selectClinic(clinic)}
                />
              ))}
            {draftPoint && (
              <Marker
                position={[draftPoint.latitude, draftPoint.longitude]}
                title={t("map:draftLocation")}
                alt={t("map:draftLocation")}
                draggable={!saving}
                eventHandlers={{
                  dragend: (event) => {
                    const point = event.target.getLatLng()
                    placeClinic(point.lat, point.lng)
                  },
                }}
                icon={divIcon({
                  className: "hs-clinic-marker is-draft",
                  html: '<span style="background:#0f766e"></span>',
                  iconSize: [28, 28],
                  iconAnchor: [14, 14],
                })}
              />
            )}
          </MapContainer>
          {selected && (
            <section
              className="hs-map-selection"
              aria-label={t("map:selectedClinic")}
            >
              <ClinicDetails clinic={selected} />
              <div className="hs-map-actions">
                {canEdit && (
                  <button
                    type="button"
                    className="hs-map-button"
                    disabled={!coordinatesAvailable || !!draft}
                    onClick={() => beginEdit(selected)}
                  >
                    {t("map:editClinic")}
                  </button>
                )}
                <button
                  type="button"
                  className="hs-map-button"
                  onClick={() => setSelectedId(null)}
                >
                  {t("common:close")}
                </button>
              </div>
            </section>
          )}
          <footer className="hs-map-legend">
            {(["active", "recent", "quiet"] as const).map((activity) => (
              <span key={activity}>
                <span
                  className="hs-map-status"
                  style={{ background: COLORS[activity] }}
                />
                {t(
                  `map:legend${activity[0].toUpperCase()}${activity.slice(1)}`,
                )}
              </span>
            ))}
            <p>{t("map:metricCaveat")}</p>
          </footer>
        </div>
      </div>
    </section>
  )
}
