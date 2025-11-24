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
  total: '#0288d1',    // Blue
  duvida: '#7ca942',   // Green
  parcial: '#fbc02d',  // Yellow
  ruinas: '#9c27b0'    // Purple
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
  },
  // Pedra Azul data sources
  {
    name: 'pedra_azul_total',
    csvPath: () => import('./data/pedra_azul_total/pedra_azul_total.csv?raw'),
    imageFolder: './data/pedra_azul_total',
    category: 'total'
  },
  {
    name: 'pedra_azul_duvida',
    csvPath: () => import('./data/pedra_azul_duvida/pedra_azul_duvida.csv?raw'),
    imageFolder: './data/pedra_azul_duvida',
    category: 'duvida'
  },
  {
    name: 'pedra_azul_parcial',
    csvPath: () => import('./data/pedra_azul_parcial/pedra_azul_parcial.csv?raw'),
    imageFolder: './data/pedra_azul_parcial',
    category: 'parcial'
  },
  {
    name: 'pedra_azul_ruinas',
    csvPath: () => import('./data/pedra_azul_ruinas/pedra_azul_ruinas.csv?raw'),
    imageFolder: './data/pedra_azul_ruinas',
    category: 'ruinas'
  },
  // Divisópolis data sources
  {
    name: 'divisopolis_total',
    csvPath: () => import('./data/divisopolis_total/divisopolis_total.csv?raw'),
    imageFolder: './data/divisopolis_total',
    category: 'total'
  },
  {
    name: 'divisopolis_duvida',
    csvPath: () => import('./data/divisopolis_duvida/divisopolis_duvida.csv?raw'),
    imageFolder: './data/divisopolis_duvida',
    category: 'duvida'
  },
  {
    name: 'divisopolis_parcial',
    csvPath: () => import('./data/divisopolis_parcial/divisopolis_parcial.csv?raw'),
    imageFolder: './data/divisopolis_parcial',
    category: 'parcial'
  },
  {
    name: 'divisopolis_ruinas',
    csvPath: () => import('./data/divisopolis_ruinas/divisopolis_ruinas.csv?raw'),
    imageFolder: './data/divisopolis_ruinas',
    category: 'ruinas'
  },
  // Divisão Alegre data sources
  {
    name: 'divisa_alegre_total',
    csvPath: () => import('./data/divisa_alegre_total/divisa_alegre_total.csv?raw'),
    imageFolder: './data/divisa_alegre_total',
    category: 'total'
  },
  {
    name: 'divisa_alegre_duvida',
    csvPath: () => import('./data/divisa_alegre_duvida/divisa_alegre_duvida.csv?raw'),
    imageFolder: './data/divisa_alegre_duvida',
    category: 'duvida'
  },
  {
    name: 'divisa_alegre_parcial',
    csvPath: () => import('./data/divisa_alegre_parcial/divisa_alegre_parcial.csv?raw'),
    imageFolder: './data/divisa_alegre_parcial',
    category: 'parcial'
  },
  {
    name: 'divisa_alegre_ruinas',
    csvPath: () => import('./data/divisa_alegre_ruinas/divisa_alegre_ruinas.csv?raw'),
    imageFolder: './data/divisa_alegre_ruinas',
    category: 'ruinas'
  },
  // Medina data sources
  {
    name: 'medina_total',
    csvPath: () => import('./data/medina_total/medina_total.csv?raw'),
    imageFolder: './data/medina_total',
    category: 'total'
  },
  {
    name: 'medina_duvida',
    csvPath: () => import('./data/medina_duvida/medina_duvida.csv?raw'),
    imageFolder: './data/medina_duvida',
    category: 'duvida'
  },
  {
    name: 'medina_parcial',
    csvPath: () => import('./data/medina_parcial/medina_parcial.csv?raw'),
    imageFolder: './data/medina_parcial',
    category: 'parcial'
  },
  {
    name: 'medina_ruinas',
    csvPath: () => import('./data/medina_ruinas/medina_ruinas.csv?raw'),
    imageFolder: './data/medina_ruinas',
    category: 'ruinas'
  },
  // Comercinho data sources
  {
    name: 'comercinho_total',
    csvPath: () => import('./data/comercinho_total/comercinho_total.csv?raw'),
    imageFolder: './data/comercinho_total',
    category: 'total'
  },
  {
    name: 'comercinho_duvida',
    csvPath: () => import('./data/comercinho_duvida/comercinho_duvida.csv?raw'),
    imageFolder: './data/comercinho_duvida',
    category: 'duvida'
  },
  {
    name: 'comercinho_parcial',
    csvPath: () => import('./data/comercinho_parcial/comercinho_parcial.csv?raw'),
    imageFolder: './data/comercinho_parcial',
    category: 'parcial'
  },
  {
    name: 'comercinho_ruinas',
    csvPath: () => import('./data/comercinho_ruinas/comercinho_ruinas.csv?raw'),
    imageFolder: './data/comercinho_ruinas',
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
    moveend: () => {},
    zoomend: () => {}
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
  const [selectedMunicipio, setSelectedMunicipio] = useState(null)

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
    
    return markers
  }

  // Default initial map center and zoom
  const defaultMapCenter = [-15.970749238323208, -41.37616932392121]
  const defaultMapZoom = 11

  const goToAguasVermelhas = () => {
    setSelectedMunicipio('aguas_vermelhas')
    setMapView({
      center: [-15.747276984466714, -41.462284326553345],
      zoom: 16
    })
  }

  const goToCachoeirasDePajeu = () => {
    setSelectedMunicipio('pajeu')
    setMapView({
      center: [-15.967002368268744, -41.497163772583015],
      zoom: 16
    })
  }

  const goToPedraAzul = () => {
    setSelectedMunicipio('pedra_azul')
    setMapView({
      center: [-16.000729316063108, -41.27851009368897],
      zoom: 15
    })
  }

  const goToDivisopolis = () => {
    setSelectedMunicipio('divisopolis')
    setMapView({
      center: [-15.721832530767715, -41.002779006958015],
      zoom: 15
    })
  }

  const goToDivisaAlegre = () => {
    setSelectedMunicipio('divisa_alegre')
    setMapView({
      center: [-15.719519167724359, -41.34444952011109],
      zoom: 15
    })
  }

  const goToMedina = () => {
    setSelectedMunicipio('medina')
    setMapView({
      center: [-16.225450255119004, -41.477926969528205],
      zoom: 16
    })
  }

  const goToComercinho = () => {
    setSelectedMunicipio('comercinho')
    setMapView({
      center: [-16.29722075378317, -41.79539322853089],
      zoom: 16
    })
  }

  return (
    <div className="app-container">
      <div className="title-section">
        <h1 className="main-title">ARQUITETURA POPULAR BRASILEIRA: REGISTROS DE CONSTRUÇÕES COM TERRA NA REGIÃO IMEDIATA DE PEDRA AZUL</h1>
        <p className="description-text">
          Este site reúne um acervo de registros georreferenciados de construções em terra na área urbana dos municípios da região imediata de Pedra Azul. O projeto faz parte de uma pesquisa de TCC e nasce da importância da arquitetura de terra numa das regiões menos desenvolvidas de Minas Gerais. Na região de Pedra Azul, as técnicas tradicionais de terra ainda fazem parte do cotidiano, mas permanecem pouco estudadas e pouco documentadas. Assim, o acervo busca contribuir com o registo e a valorização dessas práticas construtivas na região.
        </p>
        <p className="author-text">
          Tainá Bandeira, Escola de Arquitetura e Urbanismo da UFMG.
        </p>
      </div>
      <div className="municipios-section">
        <h2 className="municipios-title">Municípios</h2>
        <div className="navigation-buttons">
          <button 
            className={`navigation-button ${selectedMunicipio === 'aguas_vermelhas' ? 'selected' : ''}`}
            onClick={goToAguasVermelhas}
          >
            Águas Vermelhas
          </button>
          <button 
            className={`navigation-button ${selectedMunicipio === 'pajeu' ? 'selected' : ''}`}
            onClick={goToCachoeirasDePajeu}
          >
            Cachoeiras de Pajeu
          </button>
          <button 
            className={`navigation-button ${selectedMunicipio === 'pedra_azul' ? 'selected' : ''}`}
            onClick={goToPedraAzul}
          >
            Pedra Azul
          </button>
          <button 
            className={`navigation-button ${selectedMunicipio === 'divisopolis' ? 'selected' : ''}`}
            onClick={goToDivisopolis}
          >
            Divisópolis
          </button>
          <button 
            className={`navigation-button ${selectedMunicipio === 'divisa_alegre' ? 'selected' : ''}`}
            onClick={goToDivisaAlegre}
          >
            Divisa Alegre
          </button>
          <button 
            className={`navigation-button ${selectedMunicipio === 'medina' ? 'selected' : ''}`}
            onClick={goToMedina}
          >
            Medina
          </button>
          <button 
            className={`navigation-button ${selectedMunicipio === 'comercinho' ? 'selected' : ''}`}
            onClick={goToComercinho}
          >
            Comercinho
          </button>
        </div>
      </div>
      {getAllMarkers().length > 0 ? (
        <div className="map-container">
          <div className="map-legend">
            {Object.entries(categoryColors).map(([category, color]) => {
              const categoryLabels = {
                total: 'Total',
                duvida: 'Dúvida',
                parcial: 'Parcial',
                ruinas: 'Ruínas'
              }
              return (
                <div key={category} className="legend-item">
                  <div 
                    className="legend-color" 
                    style={{ backgroundColor: color }}
                  ></div>
                  <span className="legend-label">
                    {categoryLabels[category] || category.charAt(0).toUpperCase() + category.slice(1)}
                  </span>
                </div>
              )
            })}
          </div>
          <MapContainer
            center={defaultMapCenter}
            zoom={defaultMapZoom}
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
                      <button onClick={() => setSelectedPhoto({
                        foto: photoName,
                        path: photoPath,
                        lat,
                        lng,
                        source: item.source
                      })}>
                        Ver Foto
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
              Coordenadas: {selectedPhoto.lat.toFixed(6)}, {selectedPhoto.lng.toFixed(6)}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
