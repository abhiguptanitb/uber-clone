import { useContext, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import CaptainDetails from "../components/CaptainDetails"
import RidePopUp from "../components/RidePopUp"
import ConfirmRidePopUp from "../components/ConfirmRidePopUp"
import LiveTracking from "../components/LiveTracking"
import { SocketContext } from "../context/SocketContext"
import { CaptainDataContext } from "../context/CaptainContext"
import axios from "axios"
import { useLocationPermission } from "../hooks/useLocationPermission"

const CaptainHome = () => {
  const [ridePopupPanel, setRidePopupPanel] = useState(false)
  const [confirmRidePopupPanel, setConfirmRidePopupPanel] = useState(false)
  const [vehicleType, setVehicleType] = useState(null)
  const [earningsToday, setEarningsToday] = useState(0)
  const [ridesToday, setRidesToday] = useState(0)
  const [paidRidesToday, setPaidRidesToday] = useState(0)
  const [ride, setRide] = useState(null)
  const [availableRides, setAvailableRides] = useState([])
  const [queueNotice, setQueueNotice] = useState("")
  const [isCheckingQueue, setIsCheckingQueue] = useState(false)

  const { socket } = useContext(SocketContext)
  const { captain } = useContext(CaptainDataContext)
  const { permissionStatus, requestLocationPermission, currentLocation } = useLocationPermission()
  const navigate = useNavigate()
  const dismissedStorageKey = captain?._id ? `dismissedRideRequests:${captain._id}` : null

  useEffect(() => {
    const initializeLocation = async () => {
      try {
        await requestLocationPermission()
      } catch (error) {
        console.error("Failed to get initial location:", error)
      }
    }
    initializeLocation()
  }, [requestLocationPermission])

  const handleLocationUpdate = (location) => {
    socket.emit("update-location-captain", {
      userId: captain._id,
      location,
    })
  }

  useEffect(() => {
    socket.emit("join", {
      userId: captain._id,
      userType: "captain",
    })

    let locationInterval
    if (permissionStatus === "granted" && currentLocation) {
      locationInterval = setInterval(() => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              socket.emit("update-location-captain", {
                userId: captain._id,
                location: {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                },
              })
            },
            (error) => {
              console.error("Error in periodic captain location update:", error)
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
  }, [captain, socket, permissionStatus, currentLocation])

  const fetchVehicleType = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/captains/${captain._id}/vehicle/vehicleType`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      setVehicleType(response.data.vehicleType)
    } catch (error) {
      console.error("Error fetching vehicle type:", error)
    }
  }

  const fetchCaptainEarnings = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/captains/earnings/today`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setEarningsToday(response.data.earningsToday || 0)
      setRidesToday(response.data.ridesToday || 0)
      setPaidRidesToday(response.data.paidRidesToday || 0)
    } catch (error) {
      console.error("Error fetching captain earnings:", error)
    }
  }

  const getDismissedRideIds = () => {
    if (!dismissedStorageKey) return []

    try {
      return JSON.parse(localStorage.getItem(dismissedStorageKey) || "[]")
    } catch (error) {
      console.error("Error reading dismissed ride requests:", error)
      return []
    }
  }

  const rememberDismissedRide = (rideId) => {
    if (!dismissedStorageKey || !rideId) return

    const dismissedRideIds = new Set(getDismissedRideIds())
    dismissedRideIds.add(rideId)
    localStorage.setItem(dismissedStorageKey, JSON.stringify([...dismissedRideIds]))
  }

  const filterVisibleRides = (rides, { includeDismissed = false } = {}) => {
    if (includeDismissed) return rides

    const dismissedRideIds = new Set(getDismissedRideIds())
    return rides.filter((availableRide) => !dismissedRideIds.has(availableRide._id))
  }

  const fetchAvailableRides = async ({ includeDismissed = false } = {}) => {
    try {
      setIsCheckingQueue(true)
      setQueueNotice("Checking ride queue...")

      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/rides/captain/available`, {
        params: { limit: 50 },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })

      const visibleRides = filterVisibleRides(response.data?.rides || [], { includeDismissed })
      setAvailableRides(visibleRides)

      if (visibleRides.length > 0) {
        setQueueNotice(`${visibleRides.length} pending ride request${visibleRides.length === 1 ? "" : "s"} found.`)
        return visibleRides
      }

      setRide(null)
      setRidePopupPanel(false)
      setQueueNotice("No pending matching ride request is available right now.")
      return []
    } catch (error) {
      const status = error.response?.status

      if (status === 404) {
        setQueueNotice("Ride queue endpoint is not available on the running backend. Restart the backend server, then check again.")
        console.warn("Ride queue endpoint returned 404. The backend process may need a restart.")
        return null
      }

      console.error("Error fetching available rides:", error)
      setQueueNotice(error.response?.data?.message || "Unable to refresh the ride queue right now.")
      return []
    } finally {
      setIsCheckingQueue(false)
    }
  }

  useEffect(() => {
    fetchVehicleType()
    fetchCaptainEarnings()
  }, [])

  useEffect(() => {
    socket.on("new-ride", (data) => {
      const isMatching = data.vehicleType === vehicleType
      const isDismissed = getDismissedRideIds().includes(data._id)

      if (isDismissed) return

      const incomingRide = { ...data, vehicleType: data.vehicleType || vehicleType }

      setAvailableRides((currentRides) => {
        const withoutDuplicate = currentRides.filter((currentRide) => currentRide._id !== incomingRide._id)
        return [incomingRide, ...withoutDuplicate]
      })
      setRide(incomingRide)
      setRidePopupPanel(isMatching)
      setQueueNotice(isMatching ? "A matching ride is available for review." : "")
    })

    return () => socket.off("new-ride")
  }, [socket, vehicleType])

  useEffect(() => {
    const handleRidePaymentCompleted = (updatedRide) => {
      if (updatedRide?._id === ride?._id) {
        setRide(updatedRide)
      }
      fetchCaptainEarnings()
    }

    socket.on("ride-payment-completed", handleRidePaymentCompleted)
    return () => socket.off("ride-payment-completed", handleRidePaymentCompleted)
  }, [ride, socket])

  const confirmRide = async () => {
    const rideId = ride?._id
    if (!rideId) return

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/rides/confirm`,
        {
          rideId,
          captainId: captain._id,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      )

      setRide(response.data)
      setRidePopupPanel(false)
      setConfirmRidePopupPanel(true)
      setAvailableRides((currentRides) => currentRides.filter((availableRide) => availableRide._id !== rideId))
      setQueueNotice("")
    } catch (error) {
      console.error("Error confirming ride:", error)
      setRidePopupPanel(false)
      setConfirmRidePopupPanel(false)
      setAvailableRides((currentRides) => currentRides.filter((availableRide) => availableRide._id !== rideId))
      if (ride?._id === rideId) setRide(null)
      setQueueNotice(error.response?.data?.message || "This ride is no longer available.")
      fetchAvailableRides({ includeDismissed: true })
    }
  }

  const handleLogout = async () => {
    try {
      socket.emit("captain-offline", {
        userId: captain._id,
      })

      await axios.get(`${import.meta.env.VITE_BASE_URL}/captains/logout`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      localStorage.removeItem("token")
      navigate("/captain-login")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  const captainName = `${captain?.fullname?.firstname || "Captain"} ${captain?.fullname?.lastname || ""}`.trim()
  const hasReviewableRide = ride?.vehicleType === vehicleType && !confirmRidePopupPanel
  const demandZones = availableRides.slice(0, 3).map((availableRide, index) => ({
    id: availableRide._id,
    label: index === 0 ? "Best zone" : `Zone ${index + 1}`,
    pickup: availableRide.pickup?.split(",")[0] || "Pickup area",
    score: availableRide.matchScore || Math.max(55, 85 - index * 12),
    distance: availableRide.pickupDistanceKm,
  }))

  const handleCheckQueue = () => {
    if (isCheckingQueue) return

    fetchAvailableRides({ includeDismissed: true })
  }

  const openRideRequest = (selectedRide) => {
    setRide(selectedRide)
    setRidePopupPanel(true)
    setQueueNotice("Opening selected ride request.")
  }

  const hideRideRequest = (rideId = ride?._id) => {
    rememberDismissedRide(rideId)
    setAvailableRides((currentRides) => currentRides.filter((availableRide) => availableRide._id !== rideId))
    setRidePopupPanel(false)
    if (ride?._id === rideId) setRide(null)
    setQueueNotice("That ride request is hidden for now. Use Check Queue to review it again.")
  }

  return (
    <div className="min-h-screen bg-[#eef2f6] p-4 text-gonexi-dark md:p-6 lg:p-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1500px] flex-col gap-5 lg:min-h-[calc(100vh-4rem)]">
        <header className="flex flex-col gap-4 rounded-[28px] border border-white/70 bg-white/85 p-4 shadow-gonexi-lg backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gonexi-gradient shadow-gonexi">
              <i className="ri-steering-2-line text-2xl text-white"></i>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gonexi-primary">Driver Console</p>
              <h1 className="text-2xl font-bold text-gonexi-dark">{captainName}</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl bg-green-50 px-4 py-2 text-sm font-bold text-green-700">
              <i className="ri-radio-button-line mr-2"></i>
              Online & receiving rides
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

        <main className="grid flex-1 items-start gap-5 xl:grid-cols-[430px_minmax(0,1fr)]">
          <aside className="flex flex-col gap-5">
            <CaptainDetails
              ride={ride}
              vehicleType={vehicleType}
              earningsToday={earningsToday}
              ridesToday={ridesToday}
              paidRidesToday={paidRidesToday}
            />

            <section className="overflow-hidden rounded-[28px] border border-white/70 bg-white p-5 shadow-gonexi-lg">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gonexi-primary">Ride queue</p>
                  <h2 className="mt-1 text-2xl font-bold text-slate-900">
                    {availableRides.length > 0 ? `${availableRides.length} ride${availableRides.length === 1 ? "" : "s"} available` : "Standing by"}
                  </h2>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${hasReviewableRide ? "bg-teal-50 text-gonexi-primary" : "bg-slate-100 text-gonexi-primary"}`}>
                  <i className="ri-notification-3-line text-xl"></i>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-500">
                Click Check Queue to load pending matching requests, then open the ride you want to review.
              </p>
              {availableRides.length > 0 && (
                <div className="mt-4 grid gap-3">
                  <div className="min-w-0 overflow-hidden rounded-2xl border border-orange-100 bg-orange-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-900">Captain heat zones</p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">Head toward higher scoring pickup clusters for faster earnings.</p>
                      </div>
                      <i className="ri-fire-line text-2xl text-gonexi-accent"></i>
                    </div>
                    <div className="mt-3 grid min-w-0 gap-2">
                      {demandZones.map((zone) => (
                        <div key={zone.id} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-white px-3 py-2 text-sm">
                          <span className="min-w-0 truncate font-semibold text-slate-700" title={`${zone.label}: ${zone.pickup}`}>
                            {zone.label}: {zone.pickup}
                          </span>
                          <span className="shrink-0 rounded-full bg-gonexi-gradient px-2 py-1 text-xs font-black text-white">{zone.score}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {availableRides.map((availableRide, index) => (
                    <div key={availableRide._id} className="min-w-0 overflow-hidden rounded-2xl border border-teal-100 bg-teal-50 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0 overflow-hidden">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-bold text-slate-900">Request #{index + 1}</p>
                            {index === 0 && (
                              <span className="rounded-full bg-gonexi-gradient px-2 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-white">
                                Best match
                              </span>
                            )}
                            {availableRide.matchLabel && (
                              <span className="rounded-full bg-white px-2 py-1 text-[11px] font-bold text-gonexi-primary">
                                {availableRide.matchLabel}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 break-words text-sm leading-6 text-slate-600">
                            {availableRide.pickup} to {availableRide.destination}
                          </p>
                          <p className="mt-2 text-sm font-bold text-gonexi-primary">Fare: Rs. {availableRide.fare}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600">
                              Score {availableRide.matchScore ?? "--"}
                            </span>
                            {availableRide.pickupDistanceKm !== null && availableRide.pickupDistanceKm !== undefined && (
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600">
                                {availableRide.pickupDistanceKm} km pickup
                              </span>
                            )}
                            {availableRide.estimatedPickupMinutes && (
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600">
                                {availableRide.estimatedPickupMinutes} min ETA
                              </span>
                            )}
                          </div>
                        </div>
                        <i className="ri-route-line hidden text-2xl text-gonexi-primary md:block"></i>
                      </div>
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => openRideRequest(availableRide)}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gonexi-gradient px-4 py-3 text-sm font-bold text-white shadow-gonexi transition hover:-translate-y-0.5"
                        >
                          <i className="ri-eye-line"></i>
                          Open
                        </button>
                        <button
                          type="button"
                          onClick={() => hideRideRequest(availableRide._id)}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                        >
                          <i className="ri-eye-off-line"></i>
                          Hide
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {queueNotice && (
                <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium leading-6 text-slate-600">
                  {queueNotice}
                </p>
              )}
              <button
                type="button"
                onClick={handleCheckQueue}
                disabled={isCheckingQueue}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gonexi-gradient px-5 py-3 font-bold text-white shadow-gonexi transition hover:-translate-y-0.5 hover:shadow-gonexi-lg"
              >
                <i className="ri-radar-line"></i>
                {isCheckingQueue ? "Checking..." : "Check Queue"}
              </button>
            </section>
          </aside>

          <section className="relative h-[560px] overflow-hidden rounded-[32px] border border-white/70 bg-slate-900 shadow-gonexi-lg xl:sticky xl:top-8 xl:h-[calc(100vh-11rem)] xl:min-h-[520px]">
            <LiveTracking onLocationUpdate={handleLocationUpdate} />
            <div className="pointer-events-none absolute left-5 top-5 rounded-2xl bg-white/75 px-4 py-3 text-sm font-semibold text-slate-700 shadow-gonexi backdrop-blur">
              <i className="ri-steering-line mr-2 text-gonexi-success"></i>
              Driver location live
            </div>
          </section>
        </main>
      </div>

      {ride?.vehicleType === vehicleType && ridePopupPanel && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] bg-white p-3 shadow-2xl">
            <RidePopUp
              ride={ride}
              setRidePopupPanel={setRidePopupPanel}
              setConfirmRidePopupPanel={setConfirmRidePopupPanel}
              confirmRide={confirmRide}
              hideRideRequest={hideRideRequest}
            />
          </div>
        </div>
      )}

      {confirmRidePopupPanel && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl">
            <ConfirmRidePopUp
              ride={ride}
              setConfirmRidePopupPanel={setConfirmRidePopupPanel}
              setRidePopupPanel={setRidePopupPanel}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default CaptainHome
