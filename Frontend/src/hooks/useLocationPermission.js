import { useState, useEffect, useCallback } from "react"

export const useLocationPermission = () => {
  const [permissionStatus, setPermissionStatus] = useState("prompt")
  const [currentLocation, setCurrentLocation] = useState(null)
  const [currentAddress, setCurrentAddress] = useState(null)
  const [isTracking, setIsTracking] = useState(false)
  const [error, setError] = useState(null)

  // Reverse geocoding to get address from coordinates
  const getAddressFromCoordinates = useCallback(async (lat, lng) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}&types=address,poi`,
      )
      const data = await response.json()

      if (data.features && data.features.length > 0) {
        const address = data.features[0].place_name
        return address
      }
      return null
    } catch {
      // Address lookup is optional; callers can use raw coordinates.
      return null
    }
  }, [])

  // Check current permission status
  const checkPermission = useCallback(async () => {
    try {
      if ("permissions" in navigator) {
        const permission = await navigator.permissions.query({ name: "geolocation" })
        setPermissionStatus(permission.state)

        permission.onchange = () => {
          setPermissionStatus(permission.state)
        }
      }
    } catch {
      // Some browsers do not expose the Permissions API for geolocation.
    }
  }, [])

  // Request location permission and start tracking
  const requestLocationPermission = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser")
      return Promise.reject(new Error("Geolocation not supported"))
    }

    return new Promise((resolve, reject) => {
      setIsTracking(true)
      setError(null)

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          }

          setCurrentLocation(location)
          setPermissionStatus("granted")
          setIsTracking(false)

          // Get address for the location
          const address = await getAddressFromCoordinates(location.lat, location.lng)
          if (address) {
            setCurrentAddress(address)
          }

          resolve({ location, address })
        },
        (error) => {
          setIsTracking(false)

          let errorMessage = "Unable to get location"
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location access denied by user"
              setPermissionStatus("denied")
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information unavailable"
              break
            case error.TIMEOUT:
              errorMessage = "Location request timed out"
              break
          }

          setError(errorMessage)
          reject(error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      )
    })
  }, [getAddressFromCoordinates])

  // Update location and get new address
  const updateLocation = useCallback(
    async (lat, lng) => {
      const location = { lat, lng }
      setCurrentLocation(location)

      const address = await getAddressFromCoordinates(lat, lng)
      if (address) {
        setCurrentAddress(address)
      }

      return { location, address }
    },
    [getAddressFromCoordinates],
  )

  // Auto-request permission on mount
  useEffect(() => {
    checkPermission()
  }, [checkPermission])

  return {
    permissionStatus,
    currentLocation,
    currentAddress,
    isTracking,
    error,
    requestLocationPermission,
    updateLocation,
    checkPermission,
  }
}
