import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api'
import { BACKEND_URL } from '../config/api'
import io from 'socket.io-client'

const containerStyle = {
  width: '100%',
  height: '100%'
}

const defaultCenter = {
  lat: 28.7041,
  lng: 77.1025
}

// Helper function to create marker icon
const createMarkerIcon = () => {
  // Check if Google Maps is fully loaded
  if (!window.google) {
    console.warn('⚠️ window.google not available')
    return null
  }
  
  if (!window.google.maps) {
    console.warn('⚠️ window.google.maps not available')
    return null
  }
  
  if (!window.google.maps.SymbolPath) {
    console.warn('⚠️ window.google.maps.SymbolPath not available')
    return null
  }
  
  try {
    const icon = {
      path: window.google.maps.SymbolPath.CIRCLE,
      fillColor: '#FDB813',
      fillOpacity: 1,
      strokeColor: '#F59E0B',
      strokeWeight: 3,
      scale: 12,
    }
    console.log('✅ Created marker icon:', icon)
    return icon
  } catch (error) {
    console.error('❌ Error creating marker icon:', error)
    // Fallback: Use SVG circle path
    try {
      const fallbackIcon = {
        path: 'M 0,0 m -10,0 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0',
        fillColor: '#FDB813',
        fillOpacity: 1,
        strokeColor: '#F59E0B',
        strokeWeight: 3,
        scale: 1.2,
      }
      console.log('✅ Using fallback SVG icon:', fallbackIcon)
      return fallbackIcon
    } catch (fallbackError) {
      console.error('❌ Error creating fallback icon:', fallbackError)
      return null
    }
  }
}

const BusTrackingMap = ({ drivers = [], onRefreshDrivers }) => {
  const [map, setMap] = useState(null)
  const [selectedDriver, setSelectedDriver] = useState(null)
  const [driverLocations, setDriverLocations] = useState({})
  const [socket, setSocket] = useState(null)
  const mapRef = useRef(null)
  const locationsInitialized = useRef(false) // Track if we've initialized locations
  const previousLocations = useRef({}) // Track previous positions for movement detection

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey || '',
    libraries: ['places']
  })

  // Store marker icon in state - create it when Google Maps loads
  const [markerIcon, setMarkerIcon] = useState(null)

  // Create marker icon when Google Maps is loaded
  useEffect(() => {
    if (!isLoaded) {
      console.log('⏳ Google Maps not loaded yet')
      setMarkerIcon(null)
      return
    }

    // Wait a bit to ensure Google Maps is fully initialized
    const timer = setTimeout(() => {
      const icon = createMarkerIcon()
      if (icon) {
        console.log('✅ Marker icon created and stored in state')
        setMarkerIcon(icon)
      } else {
        console.warn('⚠️ Marker icon creation returned null, will use default marker')
        setMarkerIcon(null)
      }
    }, 100) // Small delay to ensure Google Maps is fully ready

    return () => clearTimeout(timer)
  }, [isLoaded])

  // Initialize Socket.io connection
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      console.warn('No token found for Socket.io connection')
      return
    }

    console.log('Connecting to Socket.io at:', BACKEND_URL)
    const newSocket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      // Add token to query for authentication if needed
      query: {
        token: token
      }
    })

    newSocket.on('connect', () => {
      console.log('✅ Connected to Socket.io server', newSocket.id)
      // Join manager room to receive all driver updates
      newSocket.emit('join-manager-room')
      
      // Request current driver locations on connect (in case we missed any)
      console.log('📡 Requesting current driver locations from server')
      newSocket.emit('request-driver-locations')
      
      // Also trigger a refresh to get drivers from API
      if (onRefreshDrivers) {
        setTimeout(() => {
          console.log('🔄 Refreshing drivers after Socket.io connection')
          onRefreshDrivers()
        }, 500)
      }
    })

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket.io connection error:', error)
    })

    newSocket.on('disconnect', (reason) => {
      console.warn('⚠️ Socket.io disconnected:', reason)
    })

    newSocket.on('location-update', (data) => {
      console.log('📍 Received location-update:', data)
      if (!data.driverId) {
        console.warn('⚠️ Location update missing driverId:', data)
        return
      }
      
      const driverId = String(data.driverId) // Normalize to string
      
      if (data.latitude && data.longitude) {
        setDriverLocations(prev => {
          const prevLocation = prev[driverId]
          const newLat = parseFloat(data.latitude)
          const newLng = parseFloat(data.longitude)
          
          // Calculate movement distance (in degrees, ~111km per degree)
          let movementDistance = 0
          let isMoving = false
          if (prevLocation && prevLocation.latitude && prevLocation.longitude) {
            const latDiff = newLat - prevLocation.latitude
            const lngDiff = newLng - prevLocation.longitude
            movementDistance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff)
            isMoving = movementDistance > 0.0001 // ~11 meters movement threshold
          }
          
          const updated = {
            ...prev,
            [driverId]: {
              latitude: newLat,
              longitude: newLng,
              driverName: data.driverName || prev[driverId]?.driverName || 'Unknown Driver',
              routeName: data.routeName || prev[driverId]?.routeName || 'No Route',
              vehicleNumber: data.vehicleNumber || prev[driverId]?.vehicleNumber || '',
              speed: data.speed || prev[driverId]?.speed || 0,
              timestamp: data.timestamp || new Date().toISOString(),
              lastUpdate: Date.now(),
              isMoving: isMoving
            }
          }
          
          if (isMoving && movementDistance > 0) {
            const distanceMeters = (movementDistance * 111000).toFixed(0)
            console.log(`🚌 Driver ${data.driverName} moved ${distanceMeters}m`)
          }
          
          console.log(`📍 Updated location for driver ${driverId} (${data.driverName}), total locations: ${Object.keys(updated).length}`)
          locationsInitialized.current = true // Mark as initialized
          return updated
        })
      } else if (data.latitude === null || data.longitude === null) {
        // Only remove if explicitly set to null
        console.log(`🗑️ Removing location for driver ${driverId} (null coordinates)`)
        setDriverLocations(prev => {
          const updated = { ...prev }
          delete updated[driverId]
          console.log(`📍 Removed location for driver ${driverId}, remaining: ${Object.keys(updated).length}`)
          return updated
        })
      }
    })

    newSocket.on('driver-location-update', (data) => {
      console.log('🚌 Received driver-location-update:', data)
      if (!data.driverId) {
        console.warn('⚠️ Driver location update missing driverId:', data)
        return
      }
      
      const driverId = String(data.driverId) // Normalize to string
      
      if (data.latitude && data.longitude) {
        setDriverLocations(prev => {
          const prevLocation = prev[driverId]
          const newLat = parseFloat(data.latitude)
          const newLng = parseFloat(data.longitude)
          
          // Calculate movement distance
          let movementDistance = 0
          let isMoving = false
          if (prevLocation && prevLocation.latitude && prevLocation.longitude) {
            const latDiff = newLat - prevLocation.latitude
            const lngDiff = newLng - prevLocation.longitude
            movementDistance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff)
            isMoving = movementDistance > 0.0001 // ~11 meters movement threshold
          }
          
          const updated = {
            ...prev,
            [driverId]: {
              latitude: newLat,
              longitude: newLng,
              driverName: data.driverName || prev[driverId]?.driverName || 'Unknown Driver',
              routeName: data.routeName || prev[driverId]?.routeName || 'No Route',
              vehicleNumber: data.vehicleNumber || prev[driverId]?.vehicleNumber || '',
              speed: data.speed || prev[driverId]?.speed || 0,
              timestamp: data.timestamp || new Date().toISOString(),
              lastUpdate: Date.now(),
              isMoving: isMoving
            }
          }
          
          if (isMoving && movementDistance > 0) {
            const distanceMeters = (movementDistance * 111000).toFixed(0)
            console.log(`🚌 Driver ${data.driverName} moved ${distanceMeters}m`)
          }
          
          console.log(`🚌 Updated location for driver ${driverId} (${data.driverName}), total locations: ${Object.keys(updated).length}`)
          return updated
        })
      }
    })

    // Listen for journey started events - refresh driver data
    newSocket.on('journey-started', (data) => {
      console.log('🚌 Journey started for driver:', data)
      if (!data.driverId) {
        console.warn('⚠️ Journey started event missing driverId')
        return
      }
      
      const driverId = String(data.driverId) // Normalize to string
      
      // If driver has location, update it
      if (data.latitude && data.longitude) {
        setDriverLocations(prev => {
          const updated = {
            ...prev,
            [driverId]: {
              latitude: parseFloat(data.latitude),
              longitude: parseFloat(data.longitude),
              driverName: data.driverName || prev[driverId]?.driverName || 'Unknown',
              routeName: data.routeName || prev[driverId]?.routeName || 'No Route',
              vehicleNumber: data.vehicleNumber || prev[driverId]?.vehicleNumber,
              timestamp: data.timestamp || new Date().toISOString()
            }
          }
          console.log(`🚌 Journey started - updated location for driver ${driverId}, total: ${Object.keys(updated).length}`)
          return updated
        })
      } else {
        // If no location in event, trigger a refresh to get driver's current location
        console.log(`🚌 Journey started for driver ${driverId} but no location in event - triggering refresh`)
        if (onRefreshDrivers) {
          // Wait a moment for backend to update, then refresh
          setTimeout(() => {
            console.log(`🔄 Refreshing drivers after journey started`)
            onRefreshDrivers()
          }, 1000)
        }
        
        // Keep existing location if available
        setDriverLocations(prev => {
          if (prev[driverId]) {
            console.log(`⏳ Keeping existing location for driver ${driverId} from previous update`)
            return prev // Keep existing
          }
          return prev
        })
      }
    })

    // Listen for journey ended events - don't remove location
    newSocket.on('journey-ended', (data) => {
      console.log('🏁 Journey ended for driver:', data)
      // Don't remove location when journey ends - keep it visible
      // Location will only be removed if driver sends null location
    })

    setSocket(newSocket)

    return () => {
      console.log('Closing Socket.io connection')
      newSocket.close()
    }
  }, [onRefreshDrivers])


  // Initialize driver locations from props - MERGE instead of replace
  // This runs whenever drivers prop changes (including on mount and after refresh)
  useEffect(() => {
    console.log('🔄 Updating driver locations from props:', drivers.length, 'drivers')
    setDriverLocations(prev => {
      const newLocations = { ...prev } // ALWAYS keep existing locations from Socket.io
      const prevCount = Object.keys(prev).length
      
      // CRITICAL: If drivers prop is empty but we have existing locations, don't clear them
      // This prevents locations from disappearing on refresh
      if (drivers.length === 0 && prevCount > 0) {
        console.log(`⚠️ Drivers prop is empty but we have ${prevCount} locations from Socket.io - KEEPING them`)
        return prev // Don't clear existing locations
      }
      
      drivers.forEach(driver => {
        const driverId = String(driver._id) // Normalize to string for consistency
        
        if (driver.latitude != null && driver.longitude != null && 
            !isNaN(driver.latitude) && !isNaN(driver.longitude)) {
          // Update with valid location data from API
          const lat = parseFloat(driver.latitude)
          const lng = parseFloat(driver.longitude)
          
          // Only update if coordinates are valid
          if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            newLocations[driverId] = {
              latitude: lat,
              longitude: lng,
              driverName: driver.name || 'Unknown Driver',
              routeName: driver.currentRoute?.name || 'No Route',
              vehicleNumber: driver.vehicleNumber || '',
              speed: driver.speed || 0,
              timestamp: driver.updatedAt || new Date().toISOString()
            }
            console.log(`✅ Updated driver ${driver.name} (${driverId}) at (${lat}, ${lng})`)
            locationsInitialized.current = true // Mark as initialized
          } else {
            console.warn(`⚠️ Invalid coordinates for driver ${driver.name}: (${lat}, ${lng})`)
          }
        } else {
          // CRITICAL: Don't remove existing location if driver doesn't have location in props
          // This preserves locations from Socket.io real-time updates
          if (newLocations[driverId]) {
            console.log(`⚠️ Driver ${driver.name} (${driverId}) has no location in props, KEEPING existing Socket.io location`)
            // Update other fields but keep location
            newLocations[driverId] = {
              ...newLocations[driverId],
              driverName: driver.name,
              routeName: driver.currentRoute?.name || newLocations[driverId].routeName || 'No Route',
              vehicleNumber: driver.vehicleNumber || newLocations[driverId].vehicleNumber
            }
          } else {
            console.log(`⚠️ Driver ${driver.name} (${driverId}) has no valid location data:`, {
              latitude: driver.latitude,
              longitude: driver.longitude
            })
          }
        }
      })
      
      const newCount = Object.keys(newLocations).length
      console.log(`📍 Total driver locations: ${prevCount} → ${newCount} (added ${newCount - prevCount})`)
      return newLocations
    })
  }, [drivers])

  const onLoad = useCallback((map) => {
    mapRef.current = map
    setMap(map)
  }, [])

  const onUnmount = useCallback(() => {
    mapRef.current = null
    setMap(null)
  }, [])

  // Calculate valid locations using useMemo so it's available throughout the component
  const validLocations = useMemo(() => {
    return Object.values(driverLocations).filter(loc => 
      loc.latitude != null && loc.longitude != null && 
      !isNaN(loc.latitude) && !isNaN(loc.longitude)
    )
  }, [driverLocations])

  // Calculate map bounds to fit all drivers
  const fitBounds = useCallback(() => {
    if (!map || !window.google?.maps) {
      console.warn('⚠️ Cannot fit bounds - map or Google Maps not ready')
      return
    }

    if (validLocations.length === 0) {
      console.warn('⚠️ No valid locations to fit bounds')
      return
    }

    console.log('🗺️ Fitting bounds for', validLocations.length, 'valid locations')
    const bounds = new window.google.maps.LatLngBounds()
    
    validLocations.forEach(location => {
      const lat = parseFloat(location.latitude)
      const lng = parseFloat(location.longitude)
      bounds.extend({ lat, lng })
      console.log(`  - Added location: (${lat}, ${lng})`)
    })

    if (!bounds.isEmpty()) {
      // Increase padding a bit and cap max zoom lower so we see more of the road around the bus
      map.fitBounds(bounds, { padding: 120 })
      const listener = window.google.maps.event.addListener(map, 'bounds_changed', () => {
        // Cap zoom so the view is slightly more zoomed out than before
        if (map.getZoom() > 12) {
          map.setZoom(12)
        }
        window.google.maps.event.removeListener(listener)
      })
    }
  }, [map, validLocations])

  useEffect(() => {
    if (map && validLocations.length > 0) {
      console.log('🗺️ Fitting bounds for', validLocations.length, 'locations')
      fitBounds()
    } else if (map && validLocations.length === 0 && Object.keys(driverLocations).length > 0) {
      console.warn('⚠️ Map loaded but no valid locations to display')
    }
  }, [map, driverLocations, validLocations, fitBounds])

  // Debug: Log all driver locations (must be before early returns)
  useEffect(() => {
    const activeDrivers = Object.keys(driverLocations).length
    console.log('🗺️ Current driver locations state:', driverLocations)
    console.log('🗺️ Active drivers count:', activeDrivers)
    console.log('🗺️ Valid locations count:', validLocations.length)
    if (validLocations.length > 0) {
      console.log('🗺️ Valid locations:', validLocations.map(loc => ({
        name: loc.driverName,
        lat: loc.latitude,
        lng: loc.longitude
      })))
    }
  }, [driverLocations, validLocations])

  // Calculate values needed for render (must be before early returns)
  const activeDrivers = Object.keys(driverLocations).length
  const center = validLocations.length > 0 
    ? (() => {
        const avgLat = validLocations.reduce((sum, loc) => sum + loc.latitude, 0) / validLocations.length
        const avgLng = validLocations.reduce((sum, loc) => sum + loc.longitude, 0) / validLocations.length
        console.log('🗺️ Map center calculated:', { lat: avgLat, lng: avgLng })
        return { lat: avgLat, lng: avgLng }
      })()
    : defaultCenter

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-red-50 rounded-lg border border-red-200">
        <p className="text-red-600 text-sm">
          Error loading Google Maps. Please check your API key configuration.
        </p>
      </div>
    )
  }

  // Show empty map container while loading - no loading indicator
  if (!isLoaded) {
    return (
      <div className="w-full h-full bg-gray-50 rounded-lg border border-gray-200">
        {/* Empty container - map will load in background */}
      </div>
    )
  }

  if (!apiKey) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-yellow-50 rounded-lg border border-yellow-200">
        <p className="text-yellow-800 text-sm text-center px-4">
          ⚠️ Google Maps API key not configured. Please set VITE_GOOGLE_MAPS_API_KEY in your .env file.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative rounded-lg overflow-hidden border-2 border-gray-200 shadow-2xl">
      <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl px-5 py-3 border border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="flex flex-col">
            <p className="text-sm font-bold text-gray-800">
              <span className="text-2xl font-extrabold text-primary-600">{activeDrivers}</span>
              <span className="ml-2">Active Bus{activeDrivers !== 1 ? 'es' : ''}</span>
            </p>
            {socket && (
              <div className="flex items-center space-x-1 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-xs font-semibold text-green-600">Connected</p>
              </div>
            )}
            {!socket && (
              <div className="flex items-center space-x-1 mt-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                <p className="text-xs font-semibold text-gray-500">Connecting...</p>
              </div>
            )}
          </div>
          {validLocations.length > 0 && (
            <div className="h-8 w-px bg-gray-300"></div>
          )}
          {validLocations.length > 0 && (
            <div className="flex flex-col">
              <p className="text-xs font-medium text-gray-600">Tracking</p>
              <p className="text-sm font-bold text-blue-600">
                {validLocations.length} {validLocations.length === 1 ? 'bus' : 'buses'}
              </p>
            </div>
          )}
        </div>
      </div>
      
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        // Slightly more zoomed out so roads and nearby area are visible
        zoom={activeDrivers > 0 ? 10 : 8}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: true,
          // Enable smooth map updates
          gestureHandling: 'cooperative',
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        }}
      >
        {Object.entries(driverLocations).map(([driverId, location]) => {
          if (!location || !location.latitude || !location.longitude || 
              isNaN(location.latitude) || isNaN(location.longitude)) {
            console.log(`⚠️ Skipping driver ${location?.driverName || driverId} - invalid coordinates`)
            return null
          }
          
          const lat = parseFloat(location.latitude)
          const lng = parseFloat(location.longitude)
          
          if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            console.warn(`Invalid coordinates for driver ${location.driverName}:`, { lat, lng })
            return null
          }
          
          console.log(`🗺️ Rendering marker for ${location.driverName} at (${lat}, ${lng})`)
          
          // Use the cached marker icon from useMemo (created at component level)
          if (markerIcon) {
            console.log('📍 Using custom yellow circle icon')
          } else {
            console.log('📍 Using default Google Maps marker (icon not created yet or Maps not loaded)')
          }

          // Create label text - show driver name and vehicle number
          // Format: "Driver Name" or "Driver Name - BUS123"
          const labelText = location.vehicleNumber && location.vehicleNumber.trim()
            ? `${location.driverName || 'Driver'} - ${location.vehicleNumber}`
            : (location.driverName || 'Driver')

          // Create dynamic icon with visual feedback for moving drivers
          let dynamicIcon = markerIcon
          const isMoving = location.isMoving || false
          
          if (markerIcon && isMoving) {
            // Make icon slightly larger and brighter when moving
            dynamicIcon = {
              ...markerIcon,
              scale: markerIcon.scale * 1.15, // 15% larger when moving
              fillOpacity: 0.95,
              strokeWeight: 4, // Thicker border when moving
            }
          }
          
          // Build marker props conditionally
          const markerProps = {
            key: `driver-${driverId}`, // Key ensures React updates marker when position changes
            position: {
              lat: lat,
              lng: lng
            },
            label: {
              text: labelText,
              color: isMoving ? '#F59E0B' : '#1F2937', // Orange when moving, dark when stationary
              fontSize: '11px',
              fontWeight: 'bold',
            },
            onClick: () => {
              console.log(`✅ Clicked on driver: ${location.driverName}`)
              setSelectedDriver({ ...location, driverId })
            },
            title: `${location.driverName} - ${location.routeName}${location.vehicleNumber ? ` (${location.vehicleNumber})` : ''}${isMoving ? ' - Moving' : ' - Stationary'}`,
            zIndex: isMoving ? 1001 : 1000, // Moving markers appear on top
            visible: true,
            optimized: false, // Disable optimization for smooth real-time position updates
          }
          
          // Only add icon if it's defined
          if (dynamicIcon) {
            markerProps.icon = dynamicIcon
            if (isMoving) {
              console.log(`🚌 Adding moving icon (larger/bright) to marker for ${location.driverName}`)
            } else {
              console.log(`✅ Adding custom icon to marker for ${location.driverName}`)
            }
          } else {
            console.log(`⚠️ No custom icon available for ${location.driverName}, using default marker`)
          }
          
          // Don't use DROP animation - it only plays once and interferes with smooth movement
          // Markers will update position smoothly when position prop changes in real-time

          return <Marker {...markerProps} />
        })}

        {selectedDriver && (
          <InfoWindow
            position={{
              lat: selectedDriver.latitude,
              lng: selectedDriver.longitude
            }}
            onCloseClick={() => setSelectedDriver(null)}
            options={{
              pixelOffset: new window.google.maps.Size(0, -40)
            }}
          >
            <div className="p-3 min-w-[200px]">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-3 h-3 bg-primary-600 rounded-full"></div>
                <h3 className="font-bold text-gray-800 text-lg">{selectedDriver.driverName || 'Unknown Driver'}</h3>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold text-gray-900">Route:</span> {selectedDriver.routeName || 'No Route'}
                </p>
                {selectedDriver.vehicleNumber && selectedDriver.vehicleNumber.trim() && (
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold text-gray-900">Vehicle:</span> 
                    <span className="ml-1 px-2 py-0.5 bg-primary-100 text-primary-800 rounded font-mono text-xs">
                      {selectedDriver.vehicleNumber}
                    </span>
                  </p>
                )}
                {selectedDriver.speed !== undefined && selectedDriver.speed !== null && (
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold text-gray-900">Speed:</span> 
                    <span className={`ml-1 px-2 py-0.5 rounded font-mono text-xs ${
                      selectedDriver.speed > 60 ? 'bg-red-100 text-red-800' : 
                      selectedDriver.speed > 30 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-green-100 text-green-800'
                    }`}>
                      {selectedDriver.speed.toFixed(1)} km/h
                    </span>
                  </p>
                )}
                {selectedDriver.timestamp && (
                  <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                    <span className="font-semibold">Last Update:</span> {new Date(selectedDriver.timestamp).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  )
}

export default BusTrackingMap

