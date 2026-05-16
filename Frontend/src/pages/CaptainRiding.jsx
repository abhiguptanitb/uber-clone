import { useContext, useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import FinishRide from "../components/FinishRide"
import LiveTracking from "../components/LiveTracking"
import { SocketContext } from "../context/SocketContext"

const CaptainRiding = () => {
  const [finishRidePanel, setFinishRidePanel] = useState(false)
  const location = useLocation()
  const [rideData, setRideData] = useState(location.state?.ride)
  const { socket } = useContext(SocketContext)

  useEffect(() => {
    const handleRidePaymentCompleted = (updatedRide) => {
      if (updatedRide?._id === rideData?._id) {
        setRideData(updatedRide)
      }
    }

    socket.on("ride-payment-completed", handleRidePaymentCompleted)

    return () => {
      socket.off("ride-payment-completed", handleRidePaymentCompleted)
    }
  }, [rideData?._id, socket])

  return (
    <div className="min-h-screen bg-[#eef2f6] p-4 text-gonexi-dark md:p-6 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1500px] items-start gap-5 lg:min-h-[calc(100vh-4rem)] xl:grid-cols-[420px_minmax(0,1fr)]">
        <aside className="flex flex-col gap-5">
          <section className="rounded-[28px] border border-white/70 bg-white p-6 shadow-gonexi-lg">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gonexi-gradient shadow-gonexi">
                <i className="ri-steering-2-line text-2xl text-white"></i>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gonexi-primary">Active trip</p>
                <h1 className="text-2xl font-bold text-gonexi-dark">Ride in progress</h1>
              </div>
            </div>

            <div className="mt-6 rounded-3xl bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-500">Payment status</p>
              <h2 className="mt-1 text-2xl font-black text-slate-900">
                {rideData?.paymentStatus === "paid" ? "Payment received" : "Payment pending"}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Complete the ride when the passenger reaches the destination.
              </p>
            </div>

            <button
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gonexi-gradient px-5 py-4 font-bold text-white shadow-gonexi transition hover:-translate-y-0.5 hover:shadow-gonexi-lg"
              onClick={() => setFinishRidePanel(true)}
            >
              <i className="ri-flag-line"></i>
              Complete Ride
            </button>
          </section>
        </aside>

        <section className="relative h-[560px] overflow-hidden rounded-[32px] border border-white/70 bg-slate-900 shadow-gonexi-lg xl:sticky xl:top-8 xl:h-[calc(100vh-4rem)] xl:min-h-[560px]">
          <LiveTracking />
          <div className="pointer-events-none absolute left-5 top-5 rounded-2xl bg-white/90 px-4 py-3 text-sm font-semibold text-slate-700 shadow-gonexi backdrop-blur">
            <i className="ri-route-line mr-2 text-gonexi-success"></i>
            Navigating active ride
          </div>
        </section>
      </div>

      {finishRidePanel && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl">
            <FinishRide ride={rideData} setFinishRidePanel={setFinishRidePanel} />
          </div>
        </div>
      )}
    </div>
  )
}

export default CaptainRiding
