import WineRegionMap from './components/WineRegionMap'
import './App.css'

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <span className="header-icon">🍷</span>
          <div>
            <h1>Australian Wine Regions</h1>
            <p>Geographic Indication (GI) Sub-Regions — Wine Australia</p>
          </div>
        </div>
      </header>
      <main className="app-main">
        <WineRegionMap />
      </main>
    </div>
  )
}
