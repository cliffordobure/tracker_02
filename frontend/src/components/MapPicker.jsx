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

function MapComponent({ center, zoom, onLocationSelect, selectedLocation, mapRef }) {
  const [map, setMap] = useState(null)

  const onLoad = useCallback((mapInstance) => {
    mapRef.current = mapInstance
    setMap(mapInstance)
  }, [mapRef])

  const onUnmount = useCallback(() => {
    mapRef.current = null
    setMap(null)
  }, [mapRef])

  const onMapClick = useCallback((event) => {
    const lat = event.latLng.lat()
    const lng = event.latLng.lng()
    onLocationSelect(lat, lng)
  }, [onLocationSelect])

  useEffect(() => {
    if (map && center) {
      map.setCenter(center)
      if (zoom) {
        map.setZoom(zoom)
      }
    }
  }, [map, center, zoom])

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center || defaultCenter}
      zoom={zoom || 13}
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
  const [mapZoom, setMapZoom] = useState(13)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef(null)
  const autocompleteRef = useRef(null)
  const mapRef = useRef(null)

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

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (isLoaded && searchInputRef.current && window.google) {
      const autocomplete = new window.google.maps.places.Autocomplete(
        searchInputRef.current,
        {
          types: ['establishment', 'geocode'],
          fields: ['geometry', 'name', 'formatted_address']
        }
      )

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        if (place.geometry && place.geometry.location) {
          const lat = place.geometry.location.lat()
          const lng = place.geometry.location.lng()
          const location = { lat, lng }
          
          setSelectedLocation(location)
          setMapCenter(location)
          setMapZoom(16) // Zoom in when a place is selected
          onLocationChange(lat, lng)
          setSearchQuery(place.formatted_address || place.name || '')
        }
      })

      autocompleteRef.current = autocomplete

      return () => {
        if (autocompleteRef.current) {
          window.google.maps.event.clearInstanceListeners(autocompleteRef.current)
        }
      }
    }
  }, [isLoaded, onLocationChange])

  const handleLocationSelect = (lat, lng) => {
    const location = { lat, lng }
    setSelectedLocation(location)
    setMapCenter(location)
    onLocationChange(lat, lng)
    
    // Reverse geocode to get address
    if (window.google && window.google.maps) {
      const geocoder = new window.google.maps.Geocoder()
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results[0]) {
          setSearchQuery(results[0].formatted_address)
        }
      })
    }
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
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Search Location
        </label>
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Enter place name or address"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">
          Type to search for a place, then select from suggestions or click on the map
        </p>
      </div>
      <div style={{ height, width: '100%' }} className="rounded-lg overflow-hidden border border-gray-300">
        <MapComponent
          center={mapCenter}
          zoom={mapZoom}
          onLocationSelect={handleLocationSelect}
          selectedLocation={selectedLocation}
          mapRef={mapRef}
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
