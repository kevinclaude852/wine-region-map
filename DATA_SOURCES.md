# Data Sources

## Argentina

### Subregions (`public/data/argentina_subregions.geojson`)

**Source:**
```
https://services-eu1.arcgis.com/5I7gLEk2dR6ptFuu/ArcGIS/rest/services/%C3%81rea_estudio_vitivin%C3%ADcola/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson&outSR=4326
```

Name field: `Name`

---

### Regions (`public/data/argentina_regions.geojson`)

**Source:**
```
https://services-eu1.arcgis.com/5I7gLEk2dR6ptFuu/ArcGIS/rest/services/L%C3%ADmites_pol%C3%ADticos_administrativos_Argentina/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson&outSR=4326
```

Name field: `nombre`

**Post-processing:**
1. Filter to keep only the following `nombre` values:
   - BUENOS AIRES
   - CATAMARCA
   - JUJUY
   - LA PAMPA
   - LA RIOJA
   - MENDOZA
   - RÍO NEGRO
   - SALTA
   - SAN JUAN
   - TUCUMÁN
   - NEUQUÉN

2. Merge NEUQUÉN and RÍO NEGRO into a single feature named **PATAGONIA**

---

## South Africa

### Districts, Regions, Wards (`public/data/SA_Wine_Districts.geojson`, `SA_Wine_Regions.geojson`, `SA_Wine_Wards.geojson`)

**Source:**
```
https://www.arcgis.com/sharing/rest/content/items/77d24f54b9424c69b9a650242d3ceb21/data?f=json
```

Name fields: `District`, `Region`, `Ward`

**Post-processing:**
- All three files were reprojected from ESRI:102100 (Web Mercator) to WGS84 (EPSG:4326) using pyproj

---

## New Zealand

### Regions & Sub Regions (`public/data/nz-regions.geojson`, `nz-subregions.geojson`)

**Source (polygon data):**
```
https://www.iponz.govt.nz/get-ip/geographical-indications/register/?location=nz&sort=updated
```

Name field: `GI_Name`

**Post-processing:**
- Split original `NZ_GI_Wine_Regions.geojson` into two files by the `type` field:
  - `nz-regions.geojson` — features where `type == "Region"`
  - `nz-subregions.geojson` — features where `type == "Sub Region"`

---

### Vineyard Statistics

**Source:**
```
https://www.nzwine.com/media/5fzng52v/vineyard-report-2026-final.pdf
```
