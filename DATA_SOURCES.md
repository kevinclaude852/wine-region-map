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
