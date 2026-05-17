import { useCallback, useContext, useEffect, useMemo, useState } from "react"
import axios from "axios"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { SocketContext } from "../context/SocketContext"
import LiveTracking from "../components/LiveTracking"

const vehicleMeta = {
  car: { icon: "ri-car-line", model: "Maruti Suzuki Alto", tone: "bg-gonexi-gradient" },
  moto: { icon: "ri-motorbike-line", model: "Splendor", tone: "bg-gonexi-secondary" },
  auto: { icon: "ri-truck-line", model: "Bajaj Auto RE", tone: "bg-gonexi-accent" },
}

const Riding = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { socket } = useContext(SocketContext)
  const [ride, setRide] = useState(() => {
    const stateRide = location.state?.ride

    if (stateRide) {
      localStorage.setItem("activeRide", JSON.stringify(stateRide))
      return stateRide
    }

    const storedRide = localStorage.getItem("activeRide")
    return storedRide ? JSON.parse(storedRide) : null
  })
  const [isStartingPayment, setIsStartingPayment] = useState(false)
  const [rideMessage, setRideMessage] = useState("")
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])

  const persistRide = useCallback((nextRide) => {
    setRide(nextRide)

    if (nextRide) {
      localStorage.setItem("activeRide", JSON.stringify(nextRide))
    } else {
      localStorage.removeItem("activeRide")
    }
  }, [])

  useEffect(() => {
    const stateRide = location.state?.ride

    if (stateRide) {
      persistRide(stateRide)
    }
  }, [location.state, persistRide])

  useEffect(() => {
    const rideIdFromQuery = searchParams.get("ride_id")
    const paymentCancelled = searchParams.get("payment") === "cancelled"

    if (paymentCancelled) {
      setRideMessage("Payment was cancelled. You can try again whenever you are ready.")
    }

    if (!rideIdFromQuery || ride?._id === rideIdFromQuery) {
      return
    }

    const fetchRide = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/rides/${rideIdFromQuery}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })

        persistRide(response.data)
      } catch {
        navigate("/home")
      }
    }

    fetchRide()
  }, [navigate, persistRide, ride?._id, searchParams])

  useEffect(() => {
    const handleRideEnded = (updatedRide) => {
      persistRide(updatedRide)

      if (updatedRide?.paymentStatus === "paid") {
        localStorage.removeItem("activeRide")
        localStorage.removeItem("pendingPaymentRide")
        navigate("/home")
        return
      }

      setRideMessage("Ride completed. Please complete payment to finish your trip.")
    }

    socket.on("ride-ended", handleRideEnded)

    return () => {
      socket.off("ride-ended", handleRideEnded)
    }
  }, [navigate, persistRide, socket])

  const handlePayment = async () => {
    if (!ride?._id) return

    try {
      setIsStartingPayment(true)
      setRideMessage("")

      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/rides/payment/checkout-session`,
        {
          rideId: ride._id,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      )

      if (response.data.ride) {
        persistRide(response.data.ride)
        localStorage.setItem("pendingPaymentRide", JSON.stringify(response.data.ride))
      }

      if (response.data.alreadyPaid) {
        localStorage.removeItem("activeRide")
        localStorage.removeItem("pendingPaymentRide")
        navigate("/home")
        return
      }

      if (response.data.sessionUrl) {
        window.location.href = response.data.sessionUrl
      }
    } catch (error) {
      const message = error.response?.data?.message || "Unable to start Stripe payment right now."
      setRideMessage(message)
    } finally {
      setIsStartingPayment(false)
    }
  }

  if (!ride) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eef2f6] px-6 text-center">
        <div className="rounded-[28px] bg-white p-8 shadow-gonexi-lg">
          <p className="text-lg font-bold text-slate-700">No active ride found.</p>
          <button
            onClick={() => navigate("/home")}
            className="mt-4 rounded-2xl bg-gonexi-gradient px-5 py-3 font-bold text-white"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  const paymentLabel = ride.paymentStatus === "paid" ? "Paid with Stripe" : "Stripe payment pending"
  const paymentButtonLabel = isStartingPayment
    ? "Redirecting to Stripe..."
    : ride.paymentStatus === "paid"
      ? "Payment Completed"
      : "Make a Payment"
  const meta = vehicleMeta[ride.captain?.vehicle?.vehicleType] || vehicleMeta.car

  return (
    <div className="min-h-screen bg-[#eef2f6] p-4 text-gonexi-dark md:p-6 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1500px] items-start gap-5 lg:min-h-[calc(100vh-4rem)] xl:grid-cols-[430px_minmax(0,1fr)]">
        <aside className="flex flex-col gap-5">
          <section className="rounded-[28px] border border-white/70 bg-white p-6 shadow-gonexi-lg">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gonexi-primary">Active ride</p>
                <h1 className="mt-1 text-3xl font-bold text-slate-900">Trip details</h1>
              </div>
              <Link
                to="/home"
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 transition hover:border-gonexi-primary hover:text-gonexi-primary"
              >
                <i className="ri-home-5-line text-xl"></i>
              </Link>
            </div>

            <div className="rounded-3xl bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${meta.tone}`}>
                    <i className={`${meta.icon} text-2xl text-white`}></i>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold capitalize text-slate-900">{ride?.captain?.fullname?.firstname}</h2>
                    <p className="text-sm text-slate-500">{meta.model}</p>
                  </div>
                </div>
                <p className="font-mono text-xl font-black text-slate-900">{ride?.captain?.vehicle?.plate}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <div className="flex items-start gap-4 rounded-2xl border border-slate-100 p-4">
                <i className="ri-map-pin-2-fill mt-1 text-gonexi-secondary"></i>
                <div>
                  <h3 className="font-bold text-slate-900">Destination</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{ride?.destination}</p>
                </div>
              </div>
              <div className="flex items-start gap-4 rounded-2xl border border-slate-100 p-4">
                <i className="ri-currency-line mt-1 text-gonexi-accent"></i>
                <div>
                  <h3 className="font-bold text-slate-900">Rs. {ride?.fare}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{paymentLabel}</p>
                </div>
              </div>
            </div>

            {rideMessage && (
              <p className="mt-5 rounded-2xl bg-orange-50 px-4 py-3 text-sm leading-6 text-orange-700">{rideMessage}</p>
            )}

            <button
              onClick={handlePayment}
              disabled={isStartingPayment || ride.paymentStatus === "paid"}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gonexi-gradient px-5 py-4 font-bold text-white shadow-gonexi transition hover:-translate-y-0.5 hover:shadow-gonexi-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              <i className="ri-bank-card-line"></i>
              {paymentButtonLabel}
            </button>
          </section>
        </aside>

        <section className="relative h-[560px] overflow-hidden rounded-[32px] border border-white/70 bg-slate-900 shadow-gonexi-lg xl:sticky xl:top-8 xl:h-[calc(100vh-4rem)] xl:min-h-[560px]">
          <LiveTracking />
          <div className="pointer-events-none absolute left-5 top-5 rounded-2xl bg-white/90 px-4 py-3 text-sm font-semibold text-slate-700 shadow-gonexi backdrop-blur">
            <i className="ri-route-line mr-2 text-gonexi-success"></i>
            Ride tracking live
          </div>
        </section>
      </div>
    </div>
  )
}

export default Riding
