import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { MapContainer, TileLayer, GeoJSON, Pane, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import RegionSidebar from './RegionSidebar'
import LoadingOverlay from './LoadingOverlay'

const AU_ITEM_ID = '2dd4c385f0ed4d109c2e18ae99e819e2'
const AU_FS_BASE =
  'https://services2.arcgis.com/bM4FHPEudBvjXRBC/arcgis/rest/services' +
  '/Wine_Geographical_Indications_Australia/FeatureServer'

// Layers within each country are ordered bottom → top (paneZ ascending).
// Australia uses panes 400-402, USA uses 410-412, EU uses 420.
const COUNTRY_CONFIG = [
  {
    id: 'australia',
    label: 'Australia',
    color: '#7B1535',
    layers: [
      { id: 'au_zones',      label: 'Zones',      localPath: '/data/au-zones.geojson',      fallbackUrls: [`https://opendata.arcgis.com/datasets/${AU_ITEM_ID}_2.geojson`, `${AU_FS_BASE}/2/query?where=1%3D1&outFields=*&f=geojson`], pane: 'auZonesPane',      paneZ: 400, fillOpacity: 0.12, borderOpacity: 0.45, weight: 1.5 },
      { id: 'au_regions',    label: 'Regions',    localPath: '/data/au-regions.geojson',    fallbackUrls: [`https://opendata.arcgis.com/datasets/${AU_ITEM_ID}_1.geojson`, `${AU_FS_BASE}/1/query?where=1%3D1&outFields=*&f=geojson`], pane: 'auRegionsPane',    paneZ: 401, fillOpacity: 0.30, borderOpacity: 0.65, weight: 1.5 },
      { id: 'au_subregions', label: 'Subregions', localPath: '/data/au-subregions.geojson', fallbackUrls: [`https://opendata.arcgis.com/datasets/${AU_ITEM_ID}_0.geojson`, `${AU_FS_BASE}/0/query?where=1%3D1&outFields=*&f=geojson`], pane: 'auSubregionsPane', paneZ: 402, fillOpacity: 0.55, borderOpacity: 0.90, weight: 1.5 },
    ],
  },
  {
    id: 'usa',
    label: 'USA',
    color: '#1B4F8A',
    layers: [
      { id: 'us_regional', label: 'Regional', localPath: '/data/us-regional.geojson', pane: 'usRegionalPane', paneZ: 410, fillOpacity: 0.10, borderOpacity: 0.40, weight: 1.5 },
      { id: 'us_ava',      label: 'AVA',      localPath: '/data/us-ava.geojson',      pane: 'usAvaPane',      paneZ: 411, fillOpacity: 0.30, borderOpacity: 0.65, weight: 1.5 },
      { id: 'us_subava',   label: 'Sub-AVA',  localPath: '/data/us-subava.geojson',   pane: 'usSubAvaPane',   paneZ: 412, fillOpacity: 0.55, borderOpacity: 0.90, weight: 1.5 },
    ],
  },
  {
    id: 'eu',
    label: 'EU',
    color: '#2E7D32',
    layers: [
      { id: 'eu_AT', label: 'Austria',        localPath: '/data/eu-regions/EU_PDO_AT.geojson', pane: 'euPane', paneZ: 420, fillOpacity: 0.30, borderOpacity: 0.65, weight: 1.5 },
      { id: 'eu_BE', label: 'Belgium',        localPath: '/data/eu-regions/EU_PDO_BE.geojson', pane: 'euPane', paneZ: 420, fillOpacity: 0.30, borderOpacity: 0.65, weight: 1.5 },
      { id: 'eu_BG', label: 'Bulgaria',       localPath: '/data/eu-regions/EU_PDO_BG.geojson', pane: 'euPane', paneZ: 420, fillOpacity: 0.30, borderOpacity: 0.65, weight: 1.5 },
      { id: 'eu_CY', label: 'Cyprus',         localPath: '/data/eu-regions/EU_PDO_CY.geojson', pane: 'euPane', paneZ: 420, fillOpacity: 0.30, borderOpacity: 0.65, weight: 1.5 },
      { id: 'eu_CZ', label: 'Czech Republic', localPath: '/data/eu-regions/EU_PDO_CZ.geojson', pane: 'euPane', paneZ: 420, fillOpacity: 0.30, borderOpacity: 0.65, weight: 1.5 },
      { id: 'eu_DE', label: 'Germany',        localPath: '/data/eu-regions/EU_PDO_DE.geojson', pane: 'euPane', paneZ: 420, fillOpacity: 0.30, borderOpacity: 0.65, weight: 1.5 },
      { id: 'eu_DK', label: 'Denmark',        localPath: '/data/eu-regions/EU_PDO_DK.geojson', pane: 'euPane', paneZ: 420, fillOpacity: 0.30, borderOpacity: 0.65, weight: 1.5 },
      { id: 'eu_ES', label: 'Spain',          localPath: '/data/eu-regions/EU_PDO_ES.geojson', pane: 'euPane', paneZ: 420, fillOpacity: 0.30, borderOpacity: 0.65, weight: 1.5 },
      { id: 'eu_FR', label: 'France',         localPath: '/data/eu-regions/EU_PDO_FR.geojson', pane: 'euPane', paneZ: 420, fillOpacity: 0.30, borderOpacity: 0.65, weight: 1.5 },
      { id: 'eu_GB', label: 'UK',             localPath: '/data/eu-regions/EU_PDO_GB.geojson', pane: 'euPane', paneZ: 420, fillOpacity: 0.30, borderOpacity: 0.65, weight: 1.5 },
      { id: 'eu_GR', label: 'Greece',         localPath: '/data/eu-regions/EU_PDO_GR.geojson', pane: 'euPane', paneZ: 420, fillOpacity: 0.30, borderOpacity: 0.65, weight: 1.5 },
      { id: 'eu_HR', label: 'Croatia',        localPath: '/data/eu-regions/EU_PDO_HR.geojson', pane: 'euPane', paneZ: 420, fillOpacity: 0.30, borderOpacity: 0.65, weight: 1.5 },
      { id: 'eu_HU', label: 'Hungary',        localPath: '/data/eu-regions/EU_PDO_HU.geojson', pane: 'euPane', paneZ: 420, fillOpacity: 0.30, borderOpacity: 0.65, weight: 1.5 },
      { id: 'eu_IT', label: 'Italy',          localPath: '/data/eu-regions/EU_PDO_IT.geojson', pane: 'euPane', paneZ: 420, fillOpacity: 0.30, borderOpacity: 0.65, weight: 1.5 },
      { id: 'eu_LU', label: 'Luxembourg',     localPath: '/data/eu-regions/EU_PDO_LU.geojson', pane: 'euPane', paneZ: 420, fillOpacity: 0.30, borderOpacity: 0.65, weight: 1.5 },
      { id: 'eu_MT', label: 'Malta',          localPath: '/data/eu-regions/EU_PDO_MT.geojson', pane: 'euPane', paneZ: 420, fillOpacity: 0.30, borderOpacity: 0.65, weight: 1.5 },
      { id: 'eu_NL', label: 'Netherlands',    localPath: '/data/eu-regions/EU_PDO_NL.geojson', pane: 'euPane', paneZ: 420, fillOpacity: 0.30, borderOpacity: 0.65, weight: 1.5 },
      { id: 'eu_PT', label: 'Portugal',       localPath: '/data/eu-regions/EU_PDO_PT.geojson', pane: 'euPane', paneZ: 420, fillOpacity: 0.30, borderOpacity: 0.65, weight: 1.5 },
      { id: 'eu_RO', label: 'Romania',        localPath: '/data/eu-regions/EU_PDO_RO.geojson', pane: 'euPane', paneZ: 420, fillOpacity: 0.30, borderOpacity: 0.65, weight: 1.5 },
      { id: 'eu_SI', label: 'Slovenia',       localPath: '/data/eu-regions/EU_PDO_SI.geojson', pane: 'euPane', paneZ: 420, fillOpacity: 0.30, borderOpacity: 0.65, weight: 1.5 },
      { id: 'eu_SK', label: 'Slovakia',       localPath: '/data/eu-regions/EU_PDO_SK.geojson', pane: 'euPane', paneZ: 420, fillOpacity: 0.30, borderOpacity: 0.65, weight: 1.5 },
    ],
  },
]

// Flat list with color and countryLabel merged in for easy iteration
const ALL_LAYERS = COUNTRY_CONFIG.flatMap(c =>
  c.layers.map(l => ({ ...l, color: c.color, countryLabel: c.label }))
)

async function fetchLayer(layer) {
  const urls = [layer.localPath, ...(layer.fallbackUrls || [])]
  for (const url of urls) {
    try {
      const res = await fetch(url)
      if (!res.ok) continue
      const data = await res.json()
      if (data?.features?.length > 0) return data
    } catch (_) {}
  }
  return null
}

function getName(props) {
  return props?.GI_NAME || props?.PDOnam || props?.name || props?.Name || props?.NAME || ''
}

function InvalidateSize() {
  const map = useMap()
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 300)
    return () => clearTimeout(t)
  }, [map])
  return null
}

// Show permanent tooltip only when the polygon is large enough on screen.
// Threshold: bounding box pixel area > 1200 (e.g. 60x20px).
// Fires on zoomend, moveend, and whenever visible layers change.
function ZoomBasedLabels({ geojsonRefs, visible }) {
  const map = useMap()
  const timerRef = useRef(null)

  const updateLabels = useCallback(() => {
    Object.values(geojsonRefs.current).forEach(ref => {
      if (!ref) return
      ref.eachLayer(featureLayer => {
        const tooltip = featureLayer.getTooltip()
        if (!tooltip) return
        try {
          const bounds = featureLayer.getBounds()
          if (!bounds.isValid()) return
          const sw = map.latLngToContainerPoint(bounds.getSouthWest())
          const ne = map.latLngToContainerPoint(bounds.getNorthEast())
          const w = Math.abs(ne.x - sw.x)
          const h = Math.abs(ne.y - sw.y)
          tooltip.setOpacity(w * h > 1200 ? 0.9 : 0)
        } catch (_) {}
      })
    })
  }, [map, geojsonRefs])

  useEffect(() => {
    map.on('zoomend moveend', updateLabels)
    return () => map.off('zoomend moveend', updateLabels)
  }, [map, updateLabels])

  // Re-run when layers are toggled (delay for GeoJSON to finish rendering)
  useEffect(() => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(updateLabels, 400)
    return () => clearTimeout(timerRef.current)
  }, [visible, updateLabels])

  return null
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
  const [layerData, setLayerData] = useState(
    () => Object.fromEntries(ALL_LAYERS.map(l => [l.id, null]))
  )
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState({})
  const [visible, setVisible] = useState(
    () => Object.fromEntries(ALL_LAYERS.map(l => [l.id, true]))
  )
  const [selectedRegion, setSelectedRegion] = useState(null)
  const geojsonRefs = useRef({})

  useEffect(() => {
    async function loadAll() {
      setLoading(true)
      const results = await Promise.all(ALL_LAYERS.map(l => fetchLayer(l)))
      const newData = {}
      const newErrors = {}
      ALL_LAYERS.forEach((layer, i) => {
        newData[layer.id] = results[i]
        // Only surface errors for layers that have API fallbacks (i.e. Australia)
        if (!results[i] && layer.fallbackUrls?.length) {
          newErrors[layer.id] = `Could not load ${layer.countryLabel} ${layer.label}`
        }
      })
      setLayerData(newData)
      setErrors(newErrors)
      setLoading(false)
    }
    loadAll()
  }, [])

  function makeStyle(layer) {
    return () => ({
      fillColor: layer.color,
      fillOpacity: layer.fillOpacity,
      color: layer.color,
      weight: layer.weight,
      opacity: layer.borderOpacity,
    })
  }

  function makeOnEachFeature(layer) {
    return (feature, leafletLayer) => {
      const props = feature.properties || {}
      const name = getName(props)

      if (name) {
        leafletLayer.bindTooltip(name, {
          permanent: true,
          direction: 'center',
          className: 'region-label',
          opacity: 0,
        })
      }

      leafletLayer.on({
        mouseover(e) {
          e.target.setStyle({
            fillOpacity: Math.min(layer.fillOpacity + 0.2, 0.8),
            color: '#fff',
            weight: 2.5,
            opacity: 1,
          })
          e.target.bringToFront()
        },
        mouseout(e) {
          const ref = geojsonRefs.current[layer.id]
          if (ref) ref.resetStyle(e.target)
        },
        click() {
          setSelectedRegion({ ...props, _layerType: layer.label, _country: layer.countryLabel })
        },
      })
    }
  }

  const toggleVisible = (id) => setVisible(v => ({ ...v, [id]: !v[id] }))

  // Fit bounds to Australia only; USA is on a separate continent
  const auDatasets = useMemo(
    () => COUNTRY_CONFIG.find(c => c.id === 'australia').layers.map(l => layerData[l.id]),
    [layerData]
  )

  const errorMessages = Object.values(errors)

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

        {[...new Map(ALL_LAYERS.map(l => [l.pane, l])).values()].map(layer => (
          <Pane key={layer.pane} name={layer.pane} style={{ zIndex: layer.paneZ }} />
        ))}

        {ALL_LAYERS.map(layer =>
          visible[layer.id] && layerData[layer.id] ? (
            <GeoJSON
              key={layer.id}
              data={layerData[layer.id]}
              style={makeStyle(layer)}
              onEachFeature={makeOnEachFeature(layer)}
              ref={el => { geojsonRefs.current[layer.id] = el }}
              pane={layer.pane}
            />
          ) : null
        )}

        <InvalidateSize />
        <FitBounds datasets={auDatasets} />
        <ZoomBasedLabels geojsonRefs={geojsonRefs} visible={visible} />
      </MapContainer>

      <div className="layer-control">
        {COUNTRY_CONFIG.map((country, i) => (
          <div key={country.id} className={`layer-group${i > 0 ? ' layer-group--separated' : ''}`}>
            <h4 className="layer-group-title">{country.label}</h4>
            {country.layers.map(layer => (
              <label key={layer.id} className="layer-control-item">
                <input
                  type="checkbox"
                  checked={visible[layer.id]}
                  onChange={() => toggleVisible(layer.id)}
                />
                <span
                  className="layer-swatch"
                  style={{
                    background: country.color,
                    opacity: layer.fillOpacity * 1.8 + 0.2,
                  }}
                />
                {layer.label}
              </label>
            ))}
          </div>
        ))}
      </div>

      {loading && <LoadingOverlay />}

      {errorMessages.length > 0 && !loading && (
        <div className="error-banner">{errorMessages.join(' · ')}</div>
      )}

      {selectedRegion && (
        <RegionSidebar region={selectedRegion} onClose={() => setSelectedRegion(null)} />
      )}

      {!loading && (
        <div className="data-badge">
          {COUNTRY_CONFIG.flatMap(country =>
            country.layers
              .filter(l => layerData[l.id])
              .map(l => `${layerData[l.id].features.length} ${l.label.toLowerCase()}`)
          ).join(' · ')}
        </div>
      )}
    </div>
  )
}
