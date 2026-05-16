import { useState, useEffect } from "react"

const LocationDebug = () => {
  const [location, setLocation] = useState(null)
  const [error, setError] = useState(null)
  const [permission, setPermission] = useState(null)

  useEffect(() => {
    // Check permission status
    if ("permissions" in navigator) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        setPermission(result.state)
        result.onchange = () => setPermission(result.state)
      })
    }

    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp).toLocaleString(),
          })
        },
        (err) => {
          setError(err.message)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      )
    } else {
      setError("Geolocation is not supported")
    }
  }, [])

  if (import.meta.env.PROD) {
    return null // Don't show in production
  }

  return (
    <div
      style={{
        position: "fixed",
        top: "10px",
        left: "10px",
        background: "rgba(0,0,0,0.8)",
        color: "white",
        padding: "10px",
        borderRadius: "5px",
        fontSize: "12px",
        zIndex: 9999,
        maxWidth: "300px",
      }}
    >
      <h4>Location Debug</h4>
      <p>
        <strong>Permission:</strong> {permission || "Unknown"}
      </p>
      {location && (
        <div>
          <p>
            <strong>Lat:</strong> {location.latitude.toFixed(6)}
          </p>
          <p>
            <strong>Lng:</strong> {location.longitude.toFixed(6)}
          </p>
          <p>
            <strong>Accuracy:</strong> {location.accuracy}m
          </p>
          <p>
            <strong>Time:</strong> {location.timestamp}
          </p>
        </div>
      )}
      {error && (
        <p style={{ color: "red" }}>
          <strong>Error:</strong> {error}
        </p>
      )}
    </div>
  )
}

export default LocationDebug
