import { useState, useEffect, useRef } from "react"
import Map, { Marker } from "react-map-gl"
import "mapbox-gl/dist/mapbox-gl.css"

// Add these constants at the top after imports
const DEFAULT_LOCATION = {
  lat: 28.6139, // New Delhi coordinates as default
  lng: 77.209,
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN

// Update the component to handle default location:
const LiveTracking = ({ onLocationUpdate, focusLocation, onMapClick, showStatusIndicator = false }) => {
  const [currentPosition, setCurrentPosition] = useState(null)
  const [viewState, setViewState] = useState(null)
  const mapRef = useRef(null)
  const containerRef = useRef(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [permissionStatus, setPermissionStatus] = useState("prompt")
  const [usingDefaultLocation, setUsingDefaultLocation] = useState(false)
  const watchIdRef = useRef(null)
  const retryTimeoutRef = useRef(null)
  const [retryCount, setRetryCount] = useState(0)
  const autoRetryIntervalRef = useRef(null)

  // Check and request location permission
  const checkLocationPermission = async () => {
    try {
      if ("permissions" in navigator) {
        const permission = await navigator.permissions.query({ name: "geolocation" })
        setPermissionStatus(permission.state)

        permission.onchange = () => {
          setPermissionStatus(permission.state)
        }
      }
    } catch {
      // Permission API support varies by browser; continue with geolocation fallback.
    }
  }

  // Use default location when permission is denied
  const applyDefaultLocation = () => {
    const newViewState = {
      longitude: DEFAULT_LOCATION.lng,
      latitude: DEFAULT_LOCATION.lat,
      zoom: 12,
    }

    setCurrentPosition(DEFAULT_LOCATION)
    setViewState(newViewState)
    setIsLoading(false)
    setError(null)
    setUsingDefaultLocation(true)

    // Notify parent component with default location
    if (onLocationUpdate) {
      onLocationUpdate(DEFAULT_LOCATION)
    }

    // Set up automatic retry every 30 seconds to check if user enables location
    startAutoRetry()
  }

  // Start automatic retry to check for location permission
  const startAutoRetry = () => {
    if (autoRetryIntervalRef.current) {
      clearInterval(autoRetryIntervalRef.current)
    }

    autoRetryIntervalRef.current = setInterval(() => {
      if (navigator.geolocation && permissionStatus !== "denied") {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords
            const newPosition = { lat: latitude, lng: longitude }
            const newViewState = {
              longitude,
              latitude,
              zoom: 15,
            }

            setCurrentPosition(newPosition)
            setViewState(newViewState)
            setUsingDefaultLocation(false)
            setPermissionStatus("granted")

            if (onLocationUpdate) {
              onLocationUpdate(newPosition)
            }

            // Clear auto retry and start watching
            clearInterval(autoRetryIntervalRef.current)
            startWatchingLocation()
          },
          () => {
            // Silently continue with default location
          },
          {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 60000,
          },
        )
      }
    }, 30000) // Check every 30 seconds
  }

  // Start location tracking with retry logic
  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.")
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    // Clear any existing watch
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current)
    }

    // Get initial position with progressive timeout
    const timeout = Math.min(5000 + retryCount * 2000, 15000) // 5s, 7s, 9s, up to 15s

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords

        const newPosition = { lat: latitude, lng: longitude }
        const newViewState = {
          longitude,
          latitude,
          zoom: 15,
        }

        setCurrentPosition(newPosition)
        setViewState(newViewState)
        setIsLoading(false)
        setError(null)
        setRetryCount(0) // Reset retry count on success

        // Notify parent component
        if (onLocationUpdate) {
          onLocationUpdate(newPosition)
        }

        // Start watching for changes
        startWatchingLocation()
      },
      (error) => {
        handleLocationError(error)
      },
      {
        enableHighAccuracy: true,
        timeout: timeout,
        maximumAge: 60000, // Use cached position up to 1 minute old
      },
    )
  }

  // Update the handleLocationError function
  const handleLocationError = (error) => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        setUsingDefaultLocation(true)
        applyDefaultLocation()
        return
      case error.POSITION_UNAVAILABLE:
        setUsingDefaultLocation(true)
        applyDefaultLocation()
        return
      case error.TIMEOUT:
        scheduleRetry()
        return
      default:
        scheduleRetry()
        return
    }
  }

  // Schedule retry with exponential backoff
  const scheduleRetry = () => {
    if (retryCount < 5) {
      // Max 5 retries
      const delay = Math.min(1000 * Math.pow(2, retryCount), 10000) // 1s, 2s, 4s, 8s, 10s

      retryTimeoutRef.current = setTimeout(() => {
        setRetryCount((prev) => prev + 1)
        startLocationTracking()
      }, delay)
    } else {
      setError("Unable to get location after multiple attempts. Please check your GPS settings.")
      setIsLoading(false)
    }
  }

  // Start watching location changes
  const startWatchingLocation = () => {
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords

        const newPosition = { lat: latitude, lng: longitude }
        setCurrentPosition(newPosition)

        // Update map view smoothly
        setViewState((prevState) => ({
          ...prevState,
          longitude,
          latitude,
        }))

        // Notify parent component
        if (onLocationUpdate) {
          onLocationUpdate(newPosition)
        }
      },
      () => {},
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      },
    )
  }

  // Update the cleanup in useEffect
  useEffect(() => {
    checkLocationPermission()
    startLocationTracking()

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
      if (autoRetryIntervalRef.current) {
        clearInterval(autoRetryIntervalRef.current)
      }
    }
  }, [])

  const handleMapLoad = () => {
    if (mapRef.current) {
      mapRef.current.resize()
    }
  }

  useEffect(() => {
    if (!containerRef.current) return

    const resizeMap = () => {
      if (mapRef.current) {
        mapRef.current.resize()
      }
    }

    const resizeObserver = new ResizeObserver(resizeMap)
    resizeObserver.observe(containerRef.current)
    resizeMap()

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!focusLocation?.lat || !focusLocation?.lng) return

    const nextViewState = {
      longitude: focusLocation.lng,
      latitude: focusLocation.lat,
      zoom: focusLocation.zoom || 13,
    }

    setViewState((prevState) => ({
      ...(prevState || nextViewState),
      ...nextViewState,
    }))

    const map = mapRef.current?.getMap?.()
    map?.flyTo({
      center: [focusLocation.lng, focusLocation.lat],
      zoom: focusLocation.zoom || 13,
      duration: 900,
    })
  }, [focusLocation])

  // Manual retry function
  const retryLocation = () => {
    setRetryCount(0)
    startLocationTracking()
  }

  // Request permission manually
  // Loading state
  if (isLoading) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f0f9ff 0%, #fdf2f8 100%)",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            width: "60px",
            height: "60px",
            border: "4px solid #e0e7ff",
            borderTop: "4px solid #6366f1",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            marginBottom: "20px",
            boxShadow: "0 4px 12px rgba(99, 102, 241, 0.2)",
          }}
        ></div>
        <p style={{ fontSize: "16px", color: "#4b5563", marginBottom: "10px", fontWeight: "500" }}>Getting your location...</p>
        <p style={{ fontSize: "12px", color: "#9ca3af" }}>Attempt {retryCount + 1} of 5</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f0f9ff 0%, #fdf2f8 100%)",
          padding: "20px",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "300px" }}>
          <div style={{ 
            width: "80px", 
            height: "80px", 
            background: "linear-gradient(135deg, #6366f1 0%, #ec4899 100%)", 
            borderRadius: "50%", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            margin: "0 auto 20px",
            boxShadow: "0 8px 25px rgba(99, 102, 241, 0.3)"
          }}>
            <i className="ri-map-pin-line" style={{ fontSize: "32px", color: "white" }}></i>
          </div>
          <h3 style={{ color: "#1f2937", marginBottom: "10px", fontWeight: "600" }}>Location Required</h3>
          <p style={{ color: "#6b7280", marginBottom: "20px", lineHeight: "1.4" }}>{error}</p>

          {permissionStatus === "denied" ? (
            <div>
              <p style={{ fontSize: "14px", color: "#9ca3af", marginBottom: "15px" }}>
                Please enable location permissions in your browser settings and refresh the page.
              </p>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: "linear-gradient(135deg, #6366f1 0%, #ec4899 100%)",
                  color: "white",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
                  transition: "all 0.2s ease",
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 6px 20px rgba(99, 102, 241, 0.4)";
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.3)";
                }}
              >
                Refresh Page
              </button>
            </div>
          ) : (
            <button
              onClick={retryLocation}
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #ec4899 100%)",
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: "12px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
                transition: "all 0.2s ease",
              }}
              onMouseOver={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 6px 20px rgba(99, 102, 241, 0.4)";
              }}
              onMouseOut={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.3)";
              }}
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    )
  }

  // Don't render map until we have valid position
  if (!currentPosition || !viewState) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f0f9ff 0%, #fdf2f8 100%)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ 
            width: "60px", 
            height: "60px", 
            background: "linear-gradient(135deg, #6366f1 0%, #ec4899 100%)", 
            borderRadius: "50%", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            margin: "0 auto 15px",
            boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)"
          }}>
            <i className="ri-map-2-line" style={{ fontSize: "24px", color: "white" }}></i>
          </div>
          <p style={{ color: "#6b7280", fontWeight: "500" }}>Initializing map...</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%", position: "relative" }}>
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onClick={(evt) => onMapClick?.({ lat: evt.lngLat.lat, lng: evt.lngLat.lng })}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        onLoad={handleMapLoad}
        ref={mapRef}
      >
        <Marker longitude={currentPosition.lng} latitude={currentPosition.lat}>
          <div
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #6366f1 0%, #ec4899 100%)",
              border: "4px solid white",
              boxShadow: "0 0 0 4px rgba(99, 102, 241, 0.3), 0 4px 12px rgba(99, 102, 241, 0.4)",
              animation: "pulse 2s infinite",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "white",
                animation: "innerPulse 1.5s infinite",
              }}
            ></div>
            <style>{`
              @keyframes pulse {
                0% {
                  box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7), 0 4px 12px rgba(99, 102, 241, 0.4);
                }
                70% {
                  box-shadow: 0 0 0 12px rgba(99, 102, 241, 0), 0 4px 12px rgba(99, 102, 241, 0.4);
                }
                100% {
                  box-shadow: 0 0 0 0 rgba(99, 102, 241, 0), 0 4px 12px rgba(99, 102, 241, 0.4);
                }
              }
              @keyframes innerPulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.3; }
              }
            `}</style>
          </div>
        </Marker>
        {focusLocation?.lat && focusLocation?.lng && (
          <Marker longitude={focusLocation.lng} latitude={focusLocation.lat}>
            <div
              style={{
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                background: "#0f766e",
                border: "4px solid white",
                boxShadow: "0 0 0 4px rgba(15, 118, 110, 0.22), 0 8px 18px rgba(15, 23, 42, 0.25)",
              }}
            ></div>
          </Marker>
        )}
      </Map>

      {showStatusIndicator && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            background: "rgba(255,255,255,0.82)",
            backdropFilter: "blur(8px)",
            padding: "8px 10px",
            borderRadius: "10px",
            fontSize: "11px",
            zIndex: 1000,
            boxShadow: "0 4px 14px rgba(15, 23, 42, 0.12)",
            border: "1px solid rgba(15, 118, 110, 0.14)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: usingDefaultLocation ? "#f97316" : "#10b981",
              }}
            ></div>
            <span style={{ fontWeight: "600", color: "#334155" }}>
              {usingDefaultLocation ? "Default Location" : "Live Location"}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default LiveTracking
