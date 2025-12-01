import { useEffect, useState, useCallback, useRef } from 'react'
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'

const containerStyle = {
  width: '100%',
  height: '400px'
}

const defaultCenter = {
  lat: 28.7041,
  lng: 77.1025
}

function MapComponent({ center, onLocationSelect, selectedLocation }) {
  const [map, setMap] = useState(null)
  const mapRef = useRef(null)

  const onLoad = useCallback((map) => {
    mapRef.current = map
    setMap(map)
  }, [])

  const onUnmount = useCallback(() => {
    mapRef.current = null
    setMap(null)
  }, [])

  const onMapClick = useCallback((event) => {
    const lat = event.latLng.lat()
    const lng = event.latLng.lng()
    onLocationSelect(lat, lng)
  }, [onLocationSelect])

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center || defaultCenter}
      zoom={13}
      onLoad={onLoad}
      onUnmount={onUnmount}
      onClick={onMapClick}
      options={{
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
      }}
    >
      {selectedLocation && (
        <Marker
          position={selectedLocation}
          animation={window.google?.maps?.Animation?.DROP}
        />
      )}
    </GoogleMap>
  )
}

const MapPicker = ({ latitude, longitude, onLocationChange, height = '400px' }) => {
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [mapCenter, setMapCenter] = useState(defaultCenter)

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey || '',
    libraries: ['places']
  })

  useEffect(() => {
    if (latitude && longitude && latitude !== '' && longitude !== '') {
      const lat = parseFloat(latitude)
      const lng = parseFloat(longitude)
      if (!isNaN(lat) && !isNaN(lng)) {
        const location = { lat, lng }
        setSelectedLocation(location)
        setMapCenter(location)
        return
      }
    }
    // Default center if no location provided
    setMapCenter(defaultCenter)
    setSelectedLocation(null)
  }, [latitude, longitude])

  const handleLocationSelect = (lat, lng) => {
    const location = { lat, lng }
    setSelectedLocation(location)
    onLocationChange(lat, lng)
  }

  if (loadError) {
    return (
      <div className="w-full p-4 border border-red-300 rounded-lg bg-red-50">
        <p className="text-red-600 text-sm">
          Error loading Google Maps. Please check your API key configuration.
        </p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="w-full" style={{ height }}>
        <div className="flex items-center justify-center h-full border border-gray-300 rounded-lg bg-gray-50">
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }

  if (!apiKey) {
    return (
      <div className="w-full p-4 border border-yellow-300 rounded-lg bg-yellow-50">
        <p className="text-yellow-800 text-sm">
          ⚠️ Google Maps API key not configured. Please set VITE_GOOGLE_MAPS_API_KEY in your .env file.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div style={{ height, width: '100%' }} className="rounded-lg overflow-hidden border border-gray-300">
        <MapComponent
          center={mapCenter}
          onLocationSelect={handleLocationSelect}
          selectedLocation={selectedLocation}
        />
      </div>
      <p className="text-sm text-gray-600 mt-2">
        Click on the map to select a location
      </p>
      {(latitude && longitude) && (
        <p className="text-xs text-gray-500 mt-1">
          Selected: {parseFloat(latitude).toFixed(6)}, {parseFloat(longitude).toFixed(6)}
        </p>
      )}
    </div>
  )
}

export default MapPicker
