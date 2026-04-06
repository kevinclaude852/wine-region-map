export default function RegionSidebar({ region, onClose }) {
  // Build a list of meaningful fields to display
  const skipFields = new Set(['SHAPE_Length', 'SHAPE_Area', 'Shape__Length', 'Shape__Area', 'FID', 'OBJECTID'])

  const fields = Object.entries(region).filter(
    ([key, val]) => !skipFields.has(key) && val !== null && val !== '' && val !== undefined
  )

  const name =
    region.GI_NAME || region.PDOnam || region.nombre || region.Ward || region.District || region.Region || region.Name || region.NAME || region.name || 'Wine Region'

  return (
    <div className="region-sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">{name}</h2>
        <button className="sidebar-close" onClick={onClose} aria-label="Close">×</button>
      </div>
      <div className="sidebar-fields">
        {fields.map(([key, val]) => (
          <div className="sidebar-field" key={key}>
            <span className="field-label">{formatKey(key)}</span>
            <span className="field-value">{String(val)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function formatKey(key) {
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase())
}
