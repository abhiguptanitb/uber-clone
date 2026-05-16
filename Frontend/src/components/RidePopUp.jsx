const RidePopUp = (props) => {
  return (
    <div className="p-3 md:p-5">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gonexi-primary">Incoming ride</p>
          <h3 className="mt-1 text-3xl font-bold text-slate-900">New ride available</h3>
          <p className="mt-2 text-sm text-slate-500">Review the passenger route before accepting.</p>
        </div>
        <button
          type="button"
          onClick={() => props.setRidePopupPanel(false)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-gonexi-primary hover:text-gonexi-primary"
          aria-label="Close ride request"
        >
          <i className="ri-close-line text-xl"></i>
        </button>
      </div>

      <div className="mb-5 flex items-center justify-between gap-4 rounded-3xl bg-gonexi-gradient p-5 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
            <i className="ri-user-line text-xl"></i>
          </div>
          <div>
            <h2 className="text-xl font-bold">
              {props.ride?.user?.fullname?.firstname} {props.ride?.user?.fullname?.lastname}
            </h2>
            <p className="text-sm text-white/80">Passenger</p>
          </div>
        </div>
        <div className="text-right">
          <h3 className="text-3xl font-black">Rs. {props.ride?.fare}</h3>
          <p className="text-sm text-white/80">Fare</p>
        </div>
      </div>

      <div className="grid gap-3">
        <div className="flex items-start gap-4 rounded-2xl border border-slate-100 p-4">
          <i className="ri-map-pin-user-fill mt-1 text-gonexi-primary"></i>
          <div>
            <h3 className="font-bold text-slate-900">Pickup Location</h3>
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
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button
          onClick={() => {
            props.setConfirmRidePopupPanel(true)
            props.confirmRide()
          }}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gonexi-gradient px-5 py-4 font-bold text-white shadow-gonexi transition hover:-translate-y-0.5 hover:shadow-gonexi-lg"
        >
          <i className="ri-check-line"></i>
          Accept Ride
        </button>

        <button
          onClick={() => props.setRidePopupPanel(false)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-4 font-bold text-slate-700 transition hover:bg-slate-50"
        >
          <i className="ri-time-line"></i>
          Review Later
        </button>
      </div>

      <button
        type="button"
        onClick={() => props.hideRideRequest?.(props.ride?._id)}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100"
      >
        <i className="ri-eye-off-line"></i>
        Hide This Request For Me
      </button>
    </div>
  )
}

export default RidePopUp
