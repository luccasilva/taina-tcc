import { useState, useEffect } from 'react'
import Papa from 'papaparse'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './App.css'

// Fix for default marker icons in React Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Color mapping for categories (shared across counties)
const categoryColors = {
  total: '#3388ff',    // Blue
  duvida: '#ff6b6b',   // Red
  parcial: '#ffd93d', // Yellow
  ruinas: '#95e1d3'    // Teal
}

// Define data sources - each folder contains CSV and photos
const dataSources = [
  // Águas Vermelhas data sources
  {
    name: 'aguas_vermelhas_total',
    csvPath: () => import('./data/aguas_vermelhas_total/aguas_vermelhas_total.csv?raw'),
    imageFolder: './data/aguas_vermelhas_total',
    category: 'total'
  },
  {
    name: 'aguas_vermelhas_duvida',
    csvPath: () => import('./data/aguas_vermelhas_duvida/aguas_vermelhas_duvida.csv?raw'),
    imageFolder: './data/aguas_vermelhas_duvida',
    category: 'duvida'
  },
  {
    name: 'aguas_vermelhas_parcial',
    csvPath: () => import('./data/aguas_vermelhas_parcial/aguas_vermelhas_parcial.csv?raw'),
    imageFolder: './data/aguas_vermelhas_parcial',
    category: 'parcial'
  },
  {
    name: 'aguas_vermelhas_ruinas',
    csvPath: () => import('./data/aguas_vermelhas_ruinas/aguas_vermelhas_ruinas.csv?raw'),
    imageFolder: './data/aguas_vermelhas_ruinas',
    category: 'ruinas'
  },
  // Pajeu data sources
  {
    name: 'pajeu_total',
    csvPath: () => import('./data/pajeu_total/pajeu_total.csv?raw'),
    imageFolder: './data/pajeu_total',
    category: 'total'
  },
  {
    name: 'pajeu_duvida',
    csvPath: () => import('./data/pajeu_duvida/pajeu_duvida.csv?raw'),
    imageFolder: './data/pajeu_duvida',
    category: 'duvida'
  },
  {
    name: 'pajeu_parcial',
    csvPath: () => import('./data/pajeu_parcial/pajeu_parcial.csv?raw'),
    imageFolder: './data/pajeu_parcial',
    category: 'parcial'
  },
  {
    name: 'pajeu_ruinas',
    csvPath: () => import('./data/pajeu_ruinas/pajeu_ruinas.csv?raw'),
    imageFolder: './data/pajeu_ruinas',
    category: 'ruinas'
  }
]

// Add color property to each data source based on category
dataSources.forEach(source => {
  source.color = categoryColors[source.category]
})

// Helper function to create a custom colored marker icon
const createColoredIcon = (color) => {
  return L.divIcon({
    className: 'custom-marker-icon',
    html: `<div style="
      background-color: ${color};
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
  })
}

// Create icon cache by category (shared across counties)
const categoryIcons = {}
Object.keys(categoryColors).forEach(category => {
  categoryIcons[category] = createColoredIcon(categoryColors[category])
})

// Create icon cache for each data source
const sourceIcons = {}
dataSources.forEach(source => {
  sourceIcons[source.name] = categoryIcons[source.category]
})

// Pre-load all images from all data sources using Vite's glob import
const getAllImageModules = () => {
  const allModules = {}
  const modules = import.meta.glob('./data/**/*.png', { eager: true })
  Object.assign(allModules, modules)
  return allModules
}

const imageModules = getAllImageModules()

// Helper function to get image path for a specific data source
const getImagePath = (folderName, photoName) => {
  const imagePath = `./data/${folderName}/${photoName}.png`
  // Try to find the image in the pre-loaded modules
  for (const [path, module] of Object.entries(imageModules)) {
    if (path.includes(`${folderName}/${photoName}.png`)) {
      return module.default || module
    }
  }
  // Fallback: return the path and let the browser try to load it
  return imagePath
}

// Component to log map position and zoom
function MapLogger() {
  useMapEvents({
    moveend: (e) => {
      const map = e.target
      const center = map.getCenter()
      const zoom = map.getZoom()
      console.log('📍 Map Position:', {
        center: [center.lat, center.lng],
        zoom: zoom,
        formatted: `center={[${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}]} zoom={${zoom}}`
      })
    },
    zoomend: (e) => {
      const map = e.target
      const center = map.getCenter()
      const zoom = map.getZoom()
      console.log('🔍 Map Zoom:', {
        center: [center.lat, center.lng],
        zoom: zoom,
        formatted: `center={[${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}]} zoom={${zoom}}`
      })
    }
  })
  return null
}

// Component to control map view from parent
function MapController({ center, zoom }) {
  const map = useMap()
  
  useEffect(() => {
    if (center && zoom !== undefined) {
      map.setView(center, zoom, { animate: true, duration: 1.0 })
    }
  }, [center, zoom, map])
  
  return null
}

function App() {
  const [allData, setAllData] = useState([]) // Array of {source, data}
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [mapView, setMapView] = useState(null)

  useEffect(() => {
    // Load all CSV files from all data sources
    const loadAllData = async () => {
      const loadPromises = dataSources.map(async source => {
        try {
          // Import CSV file using Vite's ?raw import
          const csvModule = await source.csvPath()
          const csvContent = csvModule.default
          
            return new Promise((resolve) => {
              Papa.parse(csvContent, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                  // Filter out empty rows and transform data
                  const validData = results.data.filter(item => 
                    item.X && item.Y && item.Name
                  )
                  
                  // Transform data to include source folder name
                  const transformedData = validData.map(item => ({
                    ...item,
                    source: source.name,
                    folder: source.imageFolder
                  }))
                  
                  console.log(`✓ Loaded ${transformedData.length} markers from ${source.name}`)
                  
                  resolve({
                    source: source.name,
                    data: transformedData
                  })
                },
                error: (error) => {
                  console.error(`Error parsing CSV for ${source.name}:`, error)
                  // Return empty data instead of rejecting
                  resolve({
                    source: source.name,
                    data: []
                  })
                }
              })
            })
        } catch (error) {
          console.error(`Error loading CSV for ${source.name}:`, error)
          // Return empty data instead of throwing
          return {
            source: source.name,
            data: []
          }
        }
      })
      
      // Use Promise.allSettled to handle all promises even if some fail
      const results = await Promise.allSettled(loadPromises)
      const loadedData = results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value
        } else {
          console.error(`Failed to load ${dataSources[index].name}:`, result.reason)
          return {
            source: dataSources[index].name,
            data: []
          }
        }
      })
      
      setAllData(loadedData)
      const totalMarkers = loadedData.reduce((sum, source) => sum + source.data.length, 0)
      console.log(`✓ Loaded ${totalMarkers} total markers from ${loadedData.length} data sources`)
    }
    
    loadAllData()
  }, [])

  // Flatten all data from all sources into a single array
  const getAllMarkers = () => {
    const markers = allData.flatMap(sourceData => 
      sourceData.data.map(item => ({
        ...item,
        source: sourceData.source
      }))
    )
    
    // Debug: log marker counts by source
    if (markers.length > 0) {
      const countsBySource = {}
      markers.forEach(m => {
        countsBySource[m.source] = (countsBySource[m.source] || 0) + 1
      })
      console.log('Marker counts by source:', countsBySource)
    }
    
    return markers
  }

  // Calculate center of all markers
  const getCenter = () => {
    const allMarkers = getAllMarkers()
    if (allMarkers.length === 0) return [-15.747, -41.462]
    
    const lats = allMarkers.map(item => parseFloat(item.Y)) // Y is latitude
    const lngs = allMarkers.map(item => parseFloat(item.X)) // X is longitude
    
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2
    
    return [centerLat, centerLng]
  }

  const goToAguasVermelhas = () => {
    setMapView({
      center: [-15.747276984466714, -41.462284326553345],
      zoom: 16
    })
  }

  const goToCachoeirasDePajeu = () => {
    setMapView({
      center: [-15.967002368268744, -41.497163772583015],
      zoom: 16
    })
  }

  return (
    <div className="app-container">
      <div className="municipios-section">
        <h2 className="municipios-title">Municípios</h2>
        <div className="navigation-buttons">
          <button className="navigation-button" onClick={goToAguasVermelhas}>
            Águas Vermelhas
          </button>
          <button className="navigation-button" onClick={goToCachoeirasDePajeu}>
            Cachoeiras de Pajeu
          </button>
        </div>
      </div>
      {getAllMarkers().length > 0 ? (
        <div className="map-container">
          <div className="map-legend">
            {Object.entries(categoryColors).map(([category, color]) => (
              <div key={category} className="legend-item">
                <div 
                  className="legend-color" 
                  style={{ backgroundColor: color }}
                ></div>
                <span className="legend-label">
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </span>
              </div>
            ))}
          </div>
          <MapContainer
            center={getCenter()}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <MapLogger />
            {mapView && <MapController center={mapView.center} zoom={mapView.zoom} />}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {getAllMarkers().map((item, index) => {
              // CSV format: X = longitude, Y = latitude
              const lat = parseFloat(item.Y)
              const lng = parseFloat(item.X)
              const photoName = item.Name?.replace(/"/g, '')?.trim() || item.Name?.trim() || '' // Remove quotes and trim
              
              // Skip if coordinates are invalid
              if (isNaN(lat) || isNaN(lng) || !photoName) {
                console.warn('Skipping invalid marker:', item)
                return null
              }
              
              const photoPath = getImagePath(item.source, photoName)
              const icon = sourceIcons[item.source] || sourceIcons['aguas_vermelhas_total']
              
              return (
                <Marker
                  key={`${item.source}-${index}-${photoName}`}
                  position={[lat, lng]}
                  icon={icon}
                  eventHandlers={{
                    click: () => {
                      setSelectedPhoto({
                        foto: photoName,
                        path: photoPath,
                        lat,
                        lng,
                        source: item.source
                      })
                    }
                  }}
                >
                  <Popup>
                    <div className="marker-popup">
                      <p>Photo: {photoName}</p>
                      <p>Source: {item.source}</p>
                      <p>Coordinates: {lat.toFixed(6)}, {lng.toFixed(6)}</p>
                      <button onClick={() => setSelectedPhoto({
                        foto: photoName,
                        path: photoPath,
                        lat,
                        lng,
                        source: item.source
                      })}>
                        View Photo
                      </button>
                    </div>
                  </Popup>
                </Marker>
              )
            })}
          </MapContainer>
        </div>
      ) : (
        <div className="loading">Loading map data...</div>
      )}
      
      {selectedPhoto && (
        <div className="photo-dialog-overlay" onClick={() => setSelectedPhoto(null)}>
          <div className="photo-dialog" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={() => setSelectedPhoto(null)}>×</button>
            <img 
              src={selectedPhoto.path} 
              alt={`Photo ${selectedPhoto.foto}`}
              className="photo-display"
            />
            <p className="photo-coords">
              Location: {selectedPhoto.lat.toFixed(6)}, {selectedPhoto.lng.toFixed(6)}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
