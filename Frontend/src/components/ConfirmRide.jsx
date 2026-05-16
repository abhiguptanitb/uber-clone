const vehicleMeta = {
  car: { icon: "ri-car-line", label: "GoNexiCar", tone: "bg-gonexi-gradient" },
  moto: { icon: "ri-motorbike-line", label: "GoNexiMoto", tone: "bg-gonexi-secondary" },
  auto: { icon: "ri-truck-line", label: "GoNexiAuto", tone: "bg-gonexi-accent" },
}

const ConfirmRide = (props) => {
  const meta = vehicleMeta[props.vehicleType] || vehicleMeta.car

  return (
    <div className="p-3 md:p-5">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gonexi-primary">Final check</p>
          <h3 className="mt-1 text-3xl font-bold text-slate-900">Confirm your ride</h3>
        </div>
        <button
          type="button"
          onClick={() => props.setConfirmRidePanel(false)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-gonexi-primary hover:text-gonexi-primary"
          aria-label="Close confirmation"
        >
          <i className="ri-close-line text-xl"></i>
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-[180px_minmax(0,1fr)]">
        <div className="rounded-3xl bg-slate-50 p-5 text-center">
          <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-3xl ${meta.tone} shadow-gonexi`}>
            <i className={`${meta.icon} text-3xl text-white`}></i>
          </div>
          <h4 className="mt-4 text-xl font-bold text-slate-900">{meta.label}</h4>
          <p className="mt-1 text-sm text-slate-500">Estimated fare</p>
          <p className="mt-2 text-3xl font-black text-gonexi-primary">Rs. {props.fare?.[props.vehicleType]}</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-gonexi-primary">
              <i className="ri-map-pin-user-fill"></i>
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Pickup Location</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">{props.pickup}</p>
            </div>
          </div>

          <div className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-gonexi-secondary">
              <i className="ri-map-pin-2-fill"></i>
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Destination</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">{props.destination}</p>
            </div>
          </div>

          <div className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-gonexi-accent">
              <i className="ri-wallet-3-line"></i>
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Payment</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">Pay securely after the trip is completed.</p>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => {
          props.setVehicleFound(true)
          props.setConfirmRidePanel(false)
          props.createRide()
        }}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gonexi-gradient px-5 py-4 text-base font-bold text-white shadow-gonexi transition hover:-translate-y-0.5 hover:shadow-gonexi-lg"
      >
        <i className="ri-checkbox-circle-line"></i>
        Confirm Ride
      </button>
    </div>
  )
}

export default ConfirmRide
