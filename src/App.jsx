import WineRegionMap from './components/WineRegionMap'
import './App.css'

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div>
            <h1>Wine Regions</h1>
            <p>Geographic Indications — Zones · Regions · Subregions</p>
          </div>
        </div>
      </header>
      <main className="app-main">
        <WineRegionMap />
      </main>
    </div>
  )
}
