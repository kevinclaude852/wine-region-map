import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, GeoJSON, Pane, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import RegionSidebar from './RegionSidebar'
import LoadingOverlay from './LoadingOverlay'

// Layers ordered bottom → top. Pane z-indices enforce the rendering order.
const LAYER_CONFIG = [
  {
    id: 'zones',
    label: 'Zones',
    localPath: '/data/zones.geojson',
    pane: 'zonesPane',
    paneZ: 400,
    color: '#7B1535',
    fillOpacity: 0.12,
    borderOpacity: 0.45,
    weight: 1.5,
  },
  {
    id: 'regions',
    label: 'Regions',
    localPath: '/data/regions.geojson',
    pane: 'regionsPane',
    paneZ: 401,
    color: '#7B1535',
    fillOpacity: 0.30,
    borderOpacity: 0.65,
    weight: 1.5,
  },
  {
    id: 'subregions',
    label: 'Subregions',
    localPath: '/data/subregions.geojson',
    pane: 'subregionsPane',
    paneZ: 402,
    color: '#7B1535',
    fillOpacity: 0.55,
    borderOpacity: 0.90,
    weight: 1.5,
  },
]

async function fetchLayer(localPath) {
  try {
    const res = await fetch(localPath)
    if (!res.ok) return null
    const data = await res.json()
    if (data?.features?.length > 0) return data
  } catch (_) {}
  return null
}

function getName(props) {
  return props?.GI_NAME || props?.Name || props?.NAME || props?.name || ''
}

function FitBounds({ datasets }) {
  const map = useMap()
  useEffect(() => {
    const allFeatures = datasets.filter(Boolean).flatMap(d => d.features || [])
    if (!allFeatures.length) return
    try {
      const bounds = L.geoJSON({ type: 'FeatureCollection', features: allFeatures }).getBounds()
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20] })
    } catch (_) {}
  }, [datasets, map])
  return null
}

export default function WineRegionMap() {
  const [layerData, setLayerData] = useState({ zones: null, regions: null, subregions: null })
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState({})
  const [visible, setVisible] = useState({ zones: true, regions: true, subregions: true })
  const [selectedRegion, setSelectedRegion] = useState(null)
  const geojsonRefs = useRef({})

  useEffect(() => {
    async function loadAll() {
      setLoading(true)
      const results = await Promise.all(LAYER_CONFIG.map(cfg => fetchLayer(cfg.localPath)))
      const newData = {}
      const newErrors = {}
      LAYER_CONFIG.forEach((cfg, i) => {
        newData[cfg.id] = results[i]
        if (!results[i]) newErrors[cfg.id] = `Could not load ${cfg.label}`
      })
      setLayerData(newData)
      setErrors(newErrors)
      setLoading(false)
    }
    loadAll()
  }, [])

  function makeStyle(cfg) {
    return () => ({
      fillColor: cfg.color,
      fillOpacity: cfg.fillOpacity,
      color: cfg.color,
      weight: cfg.weight,
      opacity: cfg.borderOpacity,
    })
  }

  function makeOnEachFeature(cfg) {
    return (feature, layer) => {
      const props = feature.properties || {}
      const name = getName(props)

      if (name) {
        layer.bindTooltip(name, {
          permanent: true,
          direction: 'center',
          className: 'region-label',
        })
      }

      layer.on({
        mouseover(e) {
          e.target.setStyle({
            fillOpacity: Math.min(cfg.fillOpacity + 0.2, 0.8),
            color: '#fff',
            weight: 2.5,
            opacity: 1,
          })
          e.target.bringToFront()
        },
        mouseout(e) {
          const ref = geojsonRefs.current[cfg.id]
          if (ref) ref.resetStyle(e.target)
        },
        click() {
          setSelectedRegion({ ...props, _layerType: cfg.label })
        },
      })
    }
  }

  const toggleVisible = (id) => setVisible(v => ({ ...v, [id]: !v[id] }))
  const loadedLayers = LAYER_CONFIG.filter(c => layerData[c.id])

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

        {/* Declare panes — zones (400) sits below regions (401) below subregions (402) */}
        {LAYER_CONFIG.map(cfg => (
          <Pane key={cfg.pane} name={cfg.pane} style={{ zIndex: cfg.paneZ }} />
        ))}

        {LAYER_CONFIG.map(cfg =>
          visible[cfg.id] && layerData[cfg.id] ? (
            <GeoJSON
              key={cfg.id}
              data={layerData[cfg.id]}
              style={makeStyle(cfg)}
              onEachFeature={makeOnEachFeature(cfg)}
              ref={el => { geojsonRefs.current[cfg.id] = el }}
              pane={cfg.pane}
            />
          ) : null
        )}

        <FitBounds datasets={Object.values(layerData)} />
      </MapContainer>

      <div className="layer-control">
        <h4>Layers</h4>
        {LAYER_CONFIG.map(cfg => (
          <label key={cfg.id} className="layer-control-item">
            <input
              type="checkbox"
              checked={visible[cfg.id]}
              onChange={() => toggleVisible(cfg.id)}
            />
            <span
              className="layer-swatch"
              style={{
                background: cfg.color,
                opacity: cfg.fillOpacity * 1.8 + 0.2,
              }}
            />
            {cfg.label}
          </label>
        ))}
      </div>

      {loading && <LoadingOverlay />}

      {Object.keys(errors).length > 0 && !loading && (
        <div className="error-banner">{Object.values(errors).join(' · ')}</div>
      )}

      {selectedRegion && (
        <RegionSidebar region={selectedRegion} onClose={() => setSelectedRegion(null)} />
      )}

      {!loading && loadedLayers.length > 0 && (
        <div className="data-badge">
          {loadedLayers
            .map(c => `${layerData[c.id].features.length} ${c.label.toLowerCase()}`)
            .join(' · ')}
        </div>
      )}
    </div>
  )
}
