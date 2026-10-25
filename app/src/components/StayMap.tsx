import { cellBounds, snapToGrid, type MyStay, type StayCell } from '@siro/shared'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'

export interface StayMapProps {
  stadium: { lat: number; lng: number; name: string }
  cells: StayCell[]
  mine: MyStay | null
  /** When set, tapping the map chooses a square and calls this with the tapped point. */
  onPick?: (lat: number, lng: number) => void
  /** The square being chosen (pick mode). */
  picked?: { lat: number; lng: number } | null
  label: string
}

const ORANGE = '#F97316'
const INK = '#0B0B0C'

/** OpenStreetMap with shaded ~500m squares (darker = more fans) and the stadium. Default export for React.lazy. */
export default function StayMap(props: StayMapProps) {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const layer = useRef<L.LayerGroup | null>(null)
  const onPick = useRef(props.onPick)

  useEffect(() => {
    onPick.current = props.onPick
  })

  // Create the map once.
  useEffect(() => {
    if (!el.current) return
    const m = L.map(el.current, { zoomControl: true, attributionControl: true }).setView([props.stadium.lat, props.stadium.lng], 13)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(m)
    m.attributionControl.setPrefix(false)
    m.on('click', (e: L.LeafletMouseEvent) => onPick.current?.(e.latlng.lat, e.latlng.lng))
    // Counts only fit inside the squares when zoomed in; zoomed out, the shading does the work.
    const toggleCounts = () => el.current?.classList.toggle('stay-map--far', m.getZoom() < 15)
    m.on('zoomend', toggleCounts)
    toggleCounts()
    layer.current = L.layerGroup().addTo(m)
    map.current = m
    return () => {
      m.remove()
      map.current = null
    }
  }, [props.stadium.lat, props.stadium.lng])

  // Redraw squares, stadium and my square whenever the data changes.
  useEffect(() => {
    const g = layer.current
    const m = map.current
    if (!g || !m) return
    g.clearLayers()
    const max = Math.max(1, ...props.cells.map((c) => c.count))
    const shapes: L.Layer[] = []

    for (const c of props.cells) {
      const r = L.rectangle(cellBounds(c.lat, c.lng), {
        color: ORANGE,
        fillColor: ORANGE,
        fillOpacity: 0.35 + 0.5 * (c.count / max),
        weight: 2,
        interactive: false,
      })
      r.bindTooltip(`${c.count} ${c.count === 1 ? 'fan' : 'fans'}`, { permanent: true, direction: 'center', className: 'stay-count' })
      shapes.push(r)
    }
    const minePoint = props.picked ?? props.mine
    if (minePoint) {
      const snapped = props.picked ? snapToGrid(props.picked.lat, props.picked.lng) : minePoint
      shapes.push(L.rectangle(cellBounds(snapped.lat, snapped.lng), { color: INK, weight: 2, dashArray: '4 3', fill: false, interactive: false }))
    }
    shapes.push(
      L.circleMarker([props.stadium.lat, props.stadium.lng], { radius: 7, color: '#fff', weight: 2, fillColor: INK, fillOpacity: 1 }).bindTooltip(
        props.stadium.name,
      ),
    )
    shapes.forEach((s) => s.addTo(g))

    // Fit everything in view the first time there's data.
    const points: L.LatLngExpression[] = [[props.stadium.lat, props.stadium.lng], ...props.cells.map((c) => [c.lat, c.lng] as [number, number])]
    if (minePoint) points.push([minePoint.lat, minePoint.lng])
    if (points.length > 1 && !props.onPick) m.fitBounds(L.latLngBounds(points).pad(0.3), { maxZoom: 14 })
  }, [props.cells, props.mine, props.picked, props.stadium, props.onPick])

  return <div ref={el} className={`stay-map ${props.onPick ? 'stay-map--pick' : ''}`} role="img" aria-label={props.label} />
}
