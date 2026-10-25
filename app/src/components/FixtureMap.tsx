import { cellBounds, type StayCell, type VenueInfo } from '@siro/shared'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'

export interface FixtureMapProps {
  stadium: { lat: number; lng: number; name: string }
  venues: VenueInfo[]
  /** Where fans are staying (going fans only). */
  cells: StayCell[]
  selectedId: string | null
  onSelect: (id: string) => void
  /** Suggest mode: tapping the map drops a pin and calls this. */
  onPick?: (lat: number, lng: number) => void
  picked?: { lat: number; lng: number } | null
}

const ORANGE = '#F97316'

const pin = (label: string, cls: string) =>
  L.divIcon({ className: '', html: `<span class="map-pin ${cls}">${label}</span>`, iconSize: [28, 28], iconAnchor: [14, 14] })

/** Fixture map: stadium, numbered venue pins (orange = away-friendly) and stay squares. Default export for React.lazy. */
export default function FixtureMap(props: FixtureMapProps) {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const layer = useRef<L.LayerGroup | null>(null)
  const fitted = useRef(false)
  const handlers = useRef({ onPick: props.onPick, onSelect: props.onSelect })

  useEffect(() => {
    handlers.current = { onPick: props.onPick, onSelect: props.onSelect }
  })

  useEffect(() => {
    if (!el.current) return
    const m = L.map(el.current).setView([props.stadium.lat, props.stadium.lng], 14)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(m)
    m.attributionControl.setPrefix(false)
    m.on('click', (e: L.LeafletMouseEvent) => handlers.current.onPick?.(e.latlng.lat, e.latlng.lng))
    layer.current = L.layerGroup().addTo(m)
    map.current = m
    fitted.current = false
    return () => {
      m.remove()
      map.current = null
    }
  }, [props.stadium.lat, props.stadium.lng])

  useEffect(() => {
    const g = layer.current
    const m = map.current
    if (!g || !m) return
    g.clearLayers()
    const max = Math.max(1, ...props.cells.map((c) => c.count))
    for (const c of props.cells) {
      L.rectangle(cellBounds(c.lat, c.lng), {
        color: ORANGE,
        fillColor: ORANGE,
        fillOpacity: 0.15 + 0.35 * (c.count / max),
        weight: 1,
        interactive: false,
      })
        .bindTooltip(`${c.count} ${c.count === 1 ? 'fan' : 'fans'} staying`)
        .addTo(g)
    }
    L.marker([props.stadium.lat, props.stadium.lng], { icon: pin('', 'map-pin--stadium'), keyboard: false })
      .bindTooltip(props.stadium.name)
      .addTo(g)
    props.venues.forEach((v, i) => {
      const cls = [v.awayFriendly ? 'map-pin--away' : '', v.id === props.selectedId ? 'map-pin--on' : ''].join(' ')
      L.marker([v.lat, v.lng], { icon: pin(String(i + 1), cls), title: v.name, zIndexOffset: v.id === props.selectedId ? 1000 : 0 })
        .on('click', () => handlers.current.onSelect(v.id))
        .addTo(g)
    })
    if (props.picked) L.marker([props.picked.lat, props.picked.lng], { icon: pin('+', 'map-pin--new'), interactive: false }).addTo(g)

    if (!fitted.current && props.venues.length) {
      fitted.current = true
      const pts: L.LatLngExpression[] = [[props.stadium.lat, props.stadium.lng], ...props.venues.map((v) => [v.lat, v.lng] as [number, number])]
      m.fitBounds(L.latLngBounds(pts).pad(0.15), { maxZoom: 15 })
    }
  }, [props.venues, props.cells, props.selectedId, props.picked, props.stadium])

  // Toggle pick mode on the element directly – a React className would wipe Leaflet's own classes.
  useEffect(() => {
    el.current?.classList.toggle('fixture-map--pick', !!props.onPick)
  }, [props.onPick])

  // Pan to a venue picked from the list.
  useEffect(() => {
    const v = props.venues.find((x) => x.id === props.selectedId)
    if (v && map.current && !map.current.getBounds().pad(-0.1).contains([v.lat, v.lng])) map.current.panTo([v.lat, v.lng])
  }, [props.selectedId, props.venues])

  return (
    <div
      ref={el}
      className="fixture-map"
      role="region"
      aria-label={props.onPick ? 'Map – tap to place your suggestion' : 'Map of the stadium and recommended places'}
    />
  )
}
