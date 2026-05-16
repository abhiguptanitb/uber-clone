import { useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"

const ConfirmRidePopUp = (props) => {
  const [otp, setOtp] = useState("")
  const navigate = useNavigate()

  const submitHander = async (e) => {
    e.preventDefault()

    const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/rides/start-ride`, {
      params: {
        rideId: props.ride._id,
        otp,
      },
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })

    if (response.status === 200) {
      props.setConfirmRidePopupPanel(false)
      props.setRidePopupPanel(false)
      navigate("/captain-riding", { state: { ride: props.ride } })
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gonexi-primary">Start ride</p>
          <h3 className="mt-1 text-3xl font-bold text-slate-900">Confirm passenger OTP</h3>
          <p className="mt-2 text-sm text-slate-500">Enter the code shown in the passenger app to begin the trip.</p>
        </div>
        <button
          type="button"
          onClick={() => props.setConfirmRidePopupPanel(false)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-gonexi-primary hover:text-gonexi-primary"
          aria-label="Close start ride"
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
            <h2 className="text-xl font-bold capitalize text-slate-900">{props.ride?.user?.fullname?.firstname}</h2>
            <p className="text-sm text-slate-500">Passenger ready for pickup</p>
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
            <p className="mt-1 text-sm leading-6 text-slate-600">Trip fare</p>
          </div>
        </div>
      </div>

      <form onSubmit={submitHander} className="mt-6">
        <input
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          type="text"
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-mono text-xl font-bold tracking-[0.3em] text-slate-900 outline-none transition focus:border-gonexi-primary focus:bg-white"
          placeholder="OTP"
        />

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gonexi-gradient px-5 py-4 font-bold text-white shadow-gonexi transition hover:-translate-y-0.5 hover:shadow-gonexi-lg">
            <i className="ri-play-circle-line"></i>
            Start Ride
          </button>
          <button
            type="button"
            onClick={() => {
              props.setConfirmRidePopupPanel(false)
              props.setRidePopupPanel(false)
            }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-bold text-red-600 transition hover:bg-red-100"
          >
            <i className="ri-close-line"></i>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default ConfirmRidePopUp
