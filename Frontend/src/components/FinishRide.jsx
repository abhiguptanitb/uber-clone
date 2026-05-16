import axios from "axios"
import { useNavigate } from "react-router-dom"

const FinishRide = (props) => {
  const navigate = useNavigate()

  async function endRide() {
    const response = await axios.post(
      `${import.meta.env.VITE_BASE_URL}/rides/end-ride`,
      {
        rideId: props.ride._id,
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      },
    )

    if (response.status === 200) {
      const token = localStorage.getItem("token")
      localStorage.clear()
      localStorage.setItem("token", token)
      navigate("/captain-home")
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gonexi-primary">Complete trip</p>
          <h3 className="mt-1 text-3xl font-bold text-slate-900">Finish this ride</h3>
          <p className="mt-2 text-sm text-slate-500">Confirm the passenger has reached their destination.</p>
        </div>
        <button
          type="button"
          onClick={() => props.setFinishRidePanel(false)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-gonexi-primary hover:text-gonexi-primary"
          aria-label="Close finish ride"
        >
          <i className="ri-close-line text-xl"></i>
        </button>
      </div>

      <div className="rounded-3xl bg-slate-50 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gonexi-gradient">
            <i className="ri-user-line text-xl text-white"></i>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{props.ride?.user?.fullname?.firstname}</h2>
            <p className="text-sm text-slate-500">Passenger</p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        <div className="flex items-start gap-4 rounded-2xl border border-slate-100 p-4">
          <i className="ri-map-pin-user-fill mt-1 text-gonexi-primary"></i>
          <div>
            <h3 className="font-bold text-slate-900">Pickup</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">{props.ride?.pickup}</p>
          </div>
        </div>
        <div className="flex items-start gap-4 rounded-2xl border border-slate-100 p-4">
          <i className="ri-map-pin-2-fill mt-1 text-gonexi-secondary"></i>
          <div>
            <h3 className="font-bold text-slate-900">Destination</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">{props.ride?.destination}</p>
          </div>
        </div>
        <div className="flex items-start gap-4 rounded-2xl border border-slate-100 p-4">
          <i className="ri-currency-line mt-1 text-gonexi-accent"></i>
          <div>
            <h3 className="font-bold text-slate-900">Rs. {props.ride?.fare}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {props.ride?.paymentStatus === "paid" ? "Paid with Stripe" : "Customer will pay from the user app"}
            </p>
          </div>
        </div>
      </div>

      {props.ride?.paymentStatus !== "paid" && (
        <p className="mt-5 rounded-2xl bg-orange-50 px-4 py-3 text-sm leading-6 text-orange-700">
          Ending the ride will notify the rider to complete payment from their riding screen.
        </p>
      )}

      <button
        onClick={endRide}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gonexi-gradient px-5 py-4 font-bold text-white shadow-gonexi transition hover:-translate-y-0.5 hover:shadow-gonexi-lg"
      >
        <i className="ri-check-double-line"></i>
        Finish Ride
      </button>
    </div>
  )
}

export default FinishRide
