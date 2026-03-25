import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import RegionLegend from './RegionLegend'
import RegionSidebar from './RegionSidebar'
import LoadingOverlay from './LoadingOverlay'

// ArcGIS Open Data GeoJSON endpoint for Wine Australia GI Register (Sub-Regions, Layer 0)
const GEOJSON_URL =
  'https://opendata.arcgis.com/datasets/ede7ffb0e73b4504a5ed613965b11e0f_0.geojson'

// Fallback: ArcGIS Feature Service query
const FEATURE_SERVICE_URL =
  'https://services2.arcgis.com/bM4FHPEudBvjXRBC/arcgis/rest/services/Wine_Australia_GI_Register/FeatureServer/0/query?outFields=*&where=1%3D1&f=geojson'

// Wine-themed colour palette — one shade per state/zone grouping
const STATE_COLORS = {
  'South Australia': '#8B1A4A',
  'New South Wales': '#B5451B',
  'Victoria': '#6B3FA0',
  'Western Australia': '#1A6B8A',
  'Tasmania': '#2E7D32',
  'Queensland': '#C97A1B',
  default: '#7B5B3A',
}

function getRegionColor(feature) {
  const state = feature.properties?.STATE_NAME || feature.properties?.state || ''
  for (const [key, color] of Object.entries(STATE_COLORS)) {
    if (state.toLowerCase().includes(key.toLowerCase())) return color
  }
  return STATE_COLORS.default
}

function regionStyle(feature) {
  return {
    fillColor: getRegionColor(feature),
    fillOpacity: 0.35,
    color: getRegionColor(feature),
    weight: 1.5,
    opacity: 0.8,
  }
}

function highlightStyle(feature) {
  return {
    fillColor: getRegionColor(feature),
    fillOpacity: 0.65,
    color: '#fff',
    weight: 2.5,
    opacity: 1,
  }
}

// Fit map bounds to the loaded GeoJSON data
function FitBounds({ geojsonData }) {
  const map = useMap()
  useEffect(() => {
    if (!geojsonData) return
    try {
      const layer = L.geoJSON(geojsonData)
      const bounds = layer.getBounds()
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20] })
    } catch (_) {}
  }, [geojsonData, map])
  return null
}

export default function WineRegionMap() {
  const [geojsonData, setGeojsonData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedRegion, setSelectedRegion] = useState(null)
  const [hoveredRegion, setHoveredRegion] = useState(null)
  const geojsonRef = useRef()

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setError(null)
      for (const url of [GEOJSON_URL, FEATURE_SERVICE_URL]) {
        try {
          const res = await fetch(url)
          if (!res.ok) continue
          const data = await res.json()
          if (data?.features?.length) {
            setGeojsonData(data)
            setLoading(false)
            return
          }
        } catch (_) {}
      }
      setError('Could not load wine region data. Check your network connection.')
      setLoading(false)
    }
    loadData()
  }, [])

  function onEachFeature(feature, layer) {
    const props = feature.properties || {}
    const name =
      props.GI_NAME || props.Name || props.NAME || props.name || 'Unknown Region'

    layer.on({
      mouseover(e) {
        setHoveredRegion(props)
        e.target.setStyle(highlightStyle(feature))
        e.target.bringToFront()
      },
      mouseout(e) {
        setHoveredRegion(null)
        if (geojsonRef.current) {
          geojsonRef.current.resetStyle(e.target)
        }
      },
      click() {
        setSelectedRegion(props)
      },
    })

    layer.bindTooltip(name, {
      sticky: true,
      className: 'region-tooltip',
      direction: 'top',
      offset: [0, -4],
    })
  }

  const stateBreakdown = geojsonData
    ? geojsonData.features.reduce((acc, f) => {
        const state =
          f.properties?.STATE_NAME || f.properties?.state || 'Unknown'
        acc[state] = (acc[state] || 0) + 1
        return acc
      }, {})
    : {}

  return (
    <div className="map-wrapper">
      <MapContainer
        center={[-33.5, 135]}
        zoom={5}
        className="leaflet-map"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        {geojsonData && (
          <>
            <GeoJSON
              key={geojsonData.features.length}
              data={geojsonData}
              style={regionStyle}
              onEachFeature={onEachFeature}
              ref={geojsonRef}
            />
            <FitBounds geojsonData={geojsonData} />
          </>
        )}
        <RegionLegend stateColors={STATE_COLORS} stateBreakdown={stateBreakdown} />
      </MapContainer>

      {loading && <LoadingOverlay />}
      {error && <div className="error-banner">{error}</div>}

      {hoveredRegion && !selectedRegion && (
        <div className="hover-hint">
          <strong>
            {hoveredRegion.GI_NAME || hoveredRegion.Name || hoveredRegion.NAME || 'Region'}
          </strong>
          <span> — click for details</span>
        </div>
      )}

      {selectedRegion && (
        <RegionSidebar
          region={selectedRegion}
          onClose={() => setSelectedRegion(null)}
        />
      )}

      {geojsonData && (
        <div className="data-badge">
          {geojsonData.features.length} sub-regions loaded
        </div>
      )}
    </div>
  )
}
