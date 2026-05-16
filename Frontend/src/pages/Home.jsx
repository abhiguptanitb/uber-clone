import { useContext, useEffect, useState } from "react"
import axios from "axios"
import "remixicon/fonts/remixicon.css"
import LocationSearchPanel from "../components/LocationSearchPanel"
import VehiclePanel from "../components/VehiclePanel"
import ConfirmRide from "../components/ConfirmRide"
import LookingForDriver from "../components/LookingForDriver"
import WaitingForDriver from "../components/WaitingForDriver"
import { SocketContext } from "../context/SocketContext"
import { UserDataContext } from "../context/UserContext"
import { useNavigate } from "react-router-dom"
import LiveTracking from "../components/LiveTracking"
import { useLocationPermission } from "../hooks/useLocationPermission"

const Home = () => {
  const [pickup, setPickup] = useState(localStorage.getItem("pickup") || "")
  const [destination, setDestination] = useState(localStorage.getItem("destination") || "")
  const [panelOpen, setPanelOpen] = useState(false)
  const [vehiclePanel, setVehiclePanel] = useState(false)
  const [confirmRidePanel, setConfirmRidePanel] = useState(false)
  const [vehicleFound, setVehicleFound] = useState(false)
  const [waitingForDriver, setWaitingForDriver] = useState(false)
  const [pickupSuggestions, setPickupSuggestions] = useState([])
  const [destinationSuggestions, setDestinationSuggestions] = useState([])
  const [activeField, setActiveField] = useState(null)
  const [fare, setFare] = useState({})
  const [vehicleType, setVehicleType] = useState(localStorage.getItem("vehicleType") || null)
  const [ride, setRide] = useState(null)
  const [isPickupFromCurrentLocation, setIsPickupFromCurrentLocation] = useState(false)
  const [isApplyingMapLocation, setIsApplyingMapLocation] = useState(false)
  const [mapFocusLocation, setMapFocusLocation] = useState(null)
  const [pendingPaymentRide, setPendingPaymentRide] = useState(() => {
    const storedRide = localStorage.getItem("pendingPaymentRide")
    return storedRide ? JSON.parse(storedRide) : null
  })

  const navigate = useNavigate()
  const { socket } = useContext(SocketContext)
  const { user } = useContext(UserDataContext)
  const { permissionStatus, requestLocationPermission, currentLocation, currentAddress, updateLocation } =
    useLocationPermission()

  useEffect(() => {
    const initializeLocation = async () => {
      try {
        const result = await requestLocationPermission()

        if (result.address && (!pickup || isPickupFromCurrentLocation)) {
          setPickup(result.address)
          setIsPickupFromCurrentLocation(true)
          localStorage.setItem("pickup", result.address)
          localStorage.setItem("isPickupFromCurrentLocation", "true")
        }
      } catch (error) {
        console.error("Failed to get initial location:", error)
      }
    }

    initializeLocation()
  }, [requestLocationPermission])

  useEffect(() => {
    const storedPickup = localStorage.getItem("pickup")
    const storedDestination = localStorage.getItem("destination")
    const storedIsPickupFromCurrentLocation = localStorage.getItem("isPickupFromCurrentLocation") === "true"

    if (storedPickup) setPickup(storedPickup)
    if (storedDestination) setDestination(storedDestination)
    setIsPickupFromCurrentLocation(storedIsPickupFromCurrentLocation)
  }, [])

  const handleLocationUpdate = async (location) => {
    socket.emit("update-location-user", {
      userId: user._id,
      location,
    })

    if (isPickupFromCurrentLocation) {
      try {
        const result = await updateLocation(location.lat, location.lng)
        if (result.address) {
          setPickup(result.address)
          localStorage.setItem("pickup", result.address)
        }
      } catch (error) {
        console.error("Error updating pickup location:", error)
      }
    }
  }

  useEffect(() => {
    socket.emit("join", {
      userId: user._id,
      userType: "user",
    })

    let locationInterval
    if (permissionStatus === "granted" && currentLocation) {
      locationInterval = setInterval(() => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              socket.emit("update-location-user", {
                userId: user._id,
                location: {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                },
              })
            },
            (error) => {
              console.error("Error in periodic location update:", error)
            },
            {
              enableHighAccuracy: false,
              timeout: 5000,
              maximumAge: 60000,
            },
          )
        }
      }, 30000)
    }

    return () => {
      if (locationInterval) clearInterval(locationInterval)
    }
  }, [user, socket, permissionStatus, currentLocation])

  useEffect(() => {
    socket.on("ride-confirmed", (ride) => {
      setVehicleFound(false)
      setWaitingForDriver(true)
      setRide(ride)
      localStorage.setItem("activeRide", JSON.stringify(ride))
    })

    socket.on("ride-started", (ride) => {
      setWaitingForDriver(false)
      localStorage.setItem("activeRide", JSON.stringify(ride))
      navigate("/riding", { state: { ride } })
    })

    return () => {
      socket.off("ride-confirmed")
      socket.off("ride-started")
    }
  }, [socket, navigate])

  useEffect(() => {
    const fetchPendingPaymentRide = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/rides/payment/pending`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })

        if (response.data?.hasPendingPayment && response.data?.ride) {
          setPendingPaymentRide(response.data.ride)
          localStorage.setItem("pendingPaymentRide", JSON.stringify(response.data.ride))
          return
        }

        setPendingPaymentRide(null)
        localStorage.removeItem("pendingPaymentRide")
      } catch (error) {
        console.error("Error fetching pending payment ride:", error)
      }
    }

    fetchPendingPaymentRide()
  }, [])

  const handlePickupChange = async (e) => {
    const value = e.target.value
    setPickup(value)
    localStorage.setItem("pickup", value)

    if (isPickupFromCurrentLocation && value !== currentAddress) {
      setIsPickupFromCurrentLocation(false)
      localStorage.setItem("isPickupFromCurrentLocation", "false")
    }

    if (value.length > 2) {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/maps/get-suggestions`, {
          params: { input: value },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })
        setPickupSuggestions(response.data)
      } catch (error) {
        console.error("Error fetching pickup suggestions:", error)
      }
    }
  }

  const handleDestinationChange = async (e) => {
    const value = e.target.value
    setDestination(value)
    localStorage.setItem("destination", value)

    if (value.length > 2) {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/maps/get-suggestions`, {
          params: { input: value },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })
        setDestinationSuggestions(response.data)
      } catch (error) {
        console.error("Error fetching destination suggestions:", error)
      }
    }
  }

  const focusMapOnAddress = async (address, field = activeField) => {
    if (!address) return

    try {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/maps/get-coordinates`, {
        params: { address },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      setMapFocusLocation({
        lat: response.data.lat,
        lng: response.data.lng,
        zoom: field === "destination" ? 13 : 14,
      })
    } catch (error) {
      console.error("Error focusing map on address:", error)
    }
  }

  const applyCurrentLocationToActiveField = async () => {
    if (isApplyingMapLocation) return

    const fieldToUpdate = activeField || "pickup"
    setIsApplyingMapLocation(true)

    try {
      let location = currentLocation
      let address = currentAddress

      if (!location || !address) {
        const result = await requestLocationPermission()
        location = result.location
        address = result.address
      }

      if (location && !address) {
        const result = await updateLocation(location.lat, location.lng)
        address = result.address
      }

      const locationText = address || `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
      setMapFocusLocation({ lat: location.lat, lng: location.lng, zoom: 15 })

      if (fieldToUpdate === "destination") {
        setDestination(locationText)
        localStorage.setItem("destination", locationText)
      } else {
        setPickup(locationText)
        setIsPickupFromCurrentLocation(true)
        localStorage.setItem("pickup", locationText)
        localStorage.setItem("isPickupFromCurrentLocation", "true")
      }

      setPanelOpen(false)
    } catch (error) {
      console.error("Error applying current location:", error)
      alert("Unable to use current location. Please allow location access and try again.")
    } finally {
      setIsApplyingMapLocation(false)
    }
  }

  const findTrip = async () => {
    if (pendingPaymentRide?._id) {
      navigate(`/riding?ride_id=${pendingPaymentRide._id}`)
      return
    }

    if (!pickup || !destination) {
      alert("Please enter both pickup and destination locations.")
      return
    }

    setVehiclePanel(true)
    setPanelOpen(false)

    try {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/rides/get-fare`, {
        params: { pickup, destination },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      setFare(response.data)
    } catch (error) {
      console.error("Error getting fare:", error)
      alert("Error getting fare. Please try again.")
    }
  }

  const createRide = async () => {
    if (pendingPaymentRide?._id) {
      navigate(`/riding?ride_id=${pendingPaymentRide._id}`)
      return
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/rides/create`,
        {
          pickup,
          destination,
          vehicleType,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      )

      if (response.status === 201) {
        setRide(response.data)
        setVehicleFound(true)
        setConfirmRidePanel(false)
      }
    } catch (error) {
      console.error("Error creating ride:", error)
      alert("Error creating ride. Please try again.")
    }
  }

  const cancelRideRequest = async () => {
    if (!ride?._id) {
      setVehicleFound(false)
      return
    }

    try {
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/rides/cancel`,
        {
          rideId: ride._id,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      )

      setVehicleFound(false)
      setRide(null)
      localStorage.removeItem("activeRide")
    } catch (error) {
      console.error("Error cancelling ride request:", error)
      alert(error.response?.data?.message || "Unable to cancel this ride request.")
    }
  }

  const handleLogout = async () => {
    try {
      await axios.get(`${import.meta.env.VITE_BASE_URL}/users/logout`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      localStorage.removeItem("token")
      localStorage.removeItem("pickup")
      localStorage.removeItem("destination")
      localStorage.removeItem("vehicleType")
      localStorage.removeItem("isPickupFromCurrentLocation")
      localStorage.removeItem("activeRide")
      localStorage.removeItem("pendingPaymentRide")
      navigate("/login")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  const suggestions = activeField === "pickup" ? pickupSuggestions : destinationSuggestions
  const userName = user?.fullname?.firstname || "Rider"

  return (
    <div className="min-h-screen bg-[#eef2f6] p-4 text-gonexi-dark md:p-6 lg:p-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1500px] flex-col gap-5 lg:min-h-[calc(100vh-4rem)]">
        <header className="flex flex-col gap-4 rounded-[28px] border border-white/70 bg-white/85 p-4 shadow-gonexi-lg backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gonexi-gradient shadow-gonexi">
              <span className="text-2xl font-black text-white">G</span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gonexi-primary">Passenger Console</p>
              <h1 className="text-2xl font-bold text-gonexi-dark">Good to see you, {userName}</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600">
              <i className="ri-map-pin-time-line mr-2 text-gonexi-primary"></i>
              Live dispatch enabled
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-gonexi-primary hover:text-gonexi-primary"
            >
              <i className="ri-logout-box-r-line"></i>
              Logout
            </button>
          </div>
        </header>

        <main className="grid flex-1 items-start gap-5 lg:grid-cols-[430px_minmax(0,1fr)] xl:grid-cols-[470px_minmax(0,1fr)]">
          <aside className="flex flex-col gap-5">
            <section className="rounded-[28px] border border-white/70 bg-white p-5 shadow-gonexi-lg md:p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gonexi-primary">Book a trip</p>
                  <h2 className="mt-1 text-3xl font-bold text-gonexi-dark">Plan your ride</h2>
                </div>
                <div className="rounded-2xl bg-orange-50 px-3 py-2 text-sm font-semibold text-gonexi-accent">
                  <i className="ri-flashlight-line mr-1"></i>
                  Fast match
                </div>
              </div>

              {pendingPaymentRide?._id && (
                <button
                  type="button"
                  onClick={() => navigate(`/riding?ride_id=${pendingPaymentRide._id}`)}
                  className="mb-5 w-full rounded-2xl border border-orange-200 bg-orange-50 px-4 py-4 text-left text-orange-800 transition hover:bg-orange-100"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">Pending payment required</p>
                      <p className="mt-1 text-sm leading-6">Complete your previous ride payment before booking again.</p>
                      <p className="mt-1 text-xs text-orange-700">
                        Driver: {pendingPaymentRide?.captain?.fullname?.firstname} | Fare: Rs. {pendingPaymentRide?.fare}
                      </p>
                    </div>
                    <i className="ri-arrow-right-line text-xl"></i>
                  </div>
                </button>
              )}

              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Pickup</span>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-gonexi-primary focus-within:bg-white">
                    <i className="ri-map-pin-user-fill text-xl text-gonexi-primary"></i>
                    <input
                      onFocus={() => {
                        setPanelOpen(true)
                        setActiveField("pickup")
                      }}
                      value={pickup}
                      onChange={handlePickupChange}
                      className="w-full bg-transparent text-base font-medium text-slate-800 outline-none placeholder:text-slate-400"
                      type="text"
                      placeholder="Add a pick-up location"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Destination</span>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-gonexi-secondary focus-within:bg-white">
                    <i className="ri-map-pin-2-fill text-xl text-gonexi-secondary"></i>
                    <input
                      onFocus={() => {
                        setPanelOpen(true)
                        setActiveField("destination")
                      }}
                      value={destination}
                      onChange={handleDestinationChange}
                      className="w-full bg-transparent text-base font-medium text-slate-800 outline-none placeholder:text-slate-400"
                      type="text"
                      placeholder="Enter your destination"
                    />
                  </div>
                </label>
              </form>

              {panelOpen && suggestions.length > 0 && (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                  <LocationSearchPanel
                    suggestions={suggestions}
                    setPanelOpen={setPanelOpen}
                    setVehiclePanel={setVehiclePanel}
                    setPickup={setPickup}
                    setDestination={setDestination}
                    activeField={activeField}
                    onSuggestionSelect={focusMapOnAddress}
                  />
                </div>
              )}

              <button
                onClick={findTrip}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gonexi-gradient px-5 py-4 text-base font-bold text-white shadow-gonexi transition hover:-translate-y-0.5 hover:shadow-gonexi-lg"
              >
                <i className={pendingPaymentRide?._id ? "ri-secure-payment-line" : "ri-route-line"}></i>
                {pendingPaymentRide?._id ? "Complete Pending Payment" : "Find Your Ride"}
              </button>
            </section>

            {vehiclePanel && (
              <section className="rounded-[28px] border border-white/70 bg-white p-4 shadow-gonexi-lg md:p-5">
                <VehiclePanel
                  selectVehicle={setVehicleType}
                  fare={fare}
                  setConfirmRidePanel={setConfirmRidePanel}
                  setVehiclePanel={setVehiclePanel}
                />
              </section>
            )}

            <section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {[
                ["ri-time-line", "Avg 2 min", "Nearby pickup"],
                ["ri-shield-check-line", "Verified", "Captain network"],
                ["ri-bank-card-line", "Stripe", "Secure payments"],
              ].map(([icon, title, label]) => (
                <div key={title} className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
                  <i className={`${icon} text-2xl text-gonexi-primary`}></i>
                  <p className="mt-2 font-bold text-slate-900">{title}</p>
                  <p className="text-sm text-slate-500">{label}</p>
                </div>
              ))}
            </section>
          </aside>

          <section className="relative h-[560px] overflow-hidden rounded-[32px] border border-white/70 bg-slate-900 shadow-gonexi-lg lg:sticky lg:top-8 lg:h-[calc(100vh-11rem)] lg:min-h-[520px]">
            <LiveTracking onLocationUpdate={handleLocationUpdate} focusLocation={mapFocusLocation} />
            <div className="pointer-events-none absolute left-5 top-5 rounded-2xl bg-white/75 px-4 py-3 text-sm font-semibold text-slate-700 shadow-gonexi backdrop-blur">
              <i className="ri-radar-line mr-2 text-gonexi-success"></i>
              Tracking active
            </div>
            <button
              type="button"
              onClick={applyCurrentLocationToActiveField}
              disabled={isApplyingMapLocation}
              className="absolute right-5 top-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-white/90 px-4 py-3 text-sm font-bold text-slate-700 shadow-gonexi backdrop-blur transition hover:-translate-y-0.5 hover:text-gonexi-primary disabled:cursor-not-allowed disabled:opacity-70"
            >
              <i className="ri-crosshair-2-line text-gonexi-primary"></i>
              {isApplyingMapLocation ? "Using location..." : `Use for ${activeField === "destination" ? "Destination" : "Pickup"}`}
            </button>
          </section>
        </main>
      </div>

      {confirmRidePanel && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] bg-white p-3 shadow-2xl">
            <ConfirmRide
              createRide={createRide}
              pickup={pickup}
              destination={destination}
              fare={fare}
              vehicleType={vehicleType}
              setConfirmRidePanel={setConfirmRidePanel}
              setVehicleFound={setVehicleFound}
            />
          </div>
        </div>
      )}

      {vehicleFound && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl">
            <LookingForDriver
              createRide={createRide}
              cancelRideRequest={cancelRideRequest}
              pickup={pickup}
              destination={destination}
              fare={fare}
              vehicleType={vehicleType}
              setVehicleFound={setVehicleFound}
            />
          </div>
        </div>
      )}

      {waitingForDriver && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl">
            <WaitingForDriver
              ride={ride}
              setVehicleFound={setVehicleFound}
              setWaitingForDriver={setWaitingForDriver}
              waitingForDriver={waitingForDriver}
              vehicleType={vehicleType}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default Home
