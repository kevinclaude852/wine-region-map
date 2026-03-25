import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

export default function RegionLegend({ stateColors, stateBreakdown }) {
  const map = useMap()

  useEffect(() => {
    const legend = L.control({ position: 'bottomright' })

    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'map-legend')
      div.innerHTML = `
        <h4>Wine States / Territories</h4>
        ${Object.entries(stateColors)
          .filter(([key]) => key !== 'default')
          .map(
            ([state, color]) => `
          <div class="legend-item">
            <span class="legend-swatch" style="background:${color}"></span>
            <span class="legend-label">${state}${
              stateBreakdown[state] ? ` <em>(${stateBreakdown[state]})</em>` : ''
            }</span>
          </div>`
          )
          .join('')}
        <div class="legend-item">
          <span class="legend-swatch" style="background:${stateColors.default}"></span>
          <span class="legend-label">Other${
            stateBreakdown['Unknown'] ? ` <em>(${stateBreakdown['Unknown']})</em>` : ''
          }</span>
        </div>
      `
      return div
    }

    legend.addTo(map)
    return () => legend.remove()
  }, [map, stateColors, stateBreakdown])

  return null
}
