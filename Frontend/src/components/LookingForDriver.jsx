const vehicleIcon = {
  car: ["ri-car-line", "bg-gonexi-gradient"],
  moto: ["ri-motorbike-line", "bg-gonexi-secondary"],
  auto: ["ri-truck-line", "bg-gonexi-accent"],
}

const LookingForDriver = (props) => {
  const [icon, tone] = vehicleIcon[props.vehicleType] || vehicleIcon.car

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gonexi-primary">Dispatching</p>
          <h3 className="mt-1 text-3xl font-bold text-slate-900">Looking for a driver</h3>
          <p className="mt-2 text-sm text-slate-500">We are matching your request with nearby captains.</p>
        </div>
        <button
          type="button"
          onClick={() => props.cancelRideRequest ? props.cancelRideRequest() : props.setVehicleFound(false)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-gonexi-primary hover:text-gonexi-primary"
          aria-label="Cancel ride request"
        >
          <i className="ri-close-line text-xl"></i>
        </button>
      </div>

      <div className="rounded-3xl bg-slate-50 p-6 text-center">
        <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-3xl ${tone} shadow-gonexi`}>
          <i className={`${icon} text-3xl text-white`}></i>
        </div>
        <div className="mx-auto mt-5 h-2 max-w-xs overflow-hidden rounded-full bg-slate-200">
          <div className="h-full w-2/3 animate-pulse rounded-full bg-gonexi-gradient"></div>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        <div className="flex items-start gap-4 rounded-2xl border border-slate-100 p-4">
          <i className="ri-map-pin-user-fill mt-1 text-gonexi-primary"></i>
          <div>
            <h3 className="font-bold text-slate-900">Pickup</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">{props.pickup}</p>
          </div>
        </div>
        <div className="flex items-start gap-4 rounded-2xl border border-slate-100 p-4">
          <i className="ri-map-pin-2-fill mt-1 text-gonexi-secondary"></i>
          <div>
            <h3 className="font-bold text-slate-900">Destination</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">{props.destination}</p>
          </div>
        </div>
        <div className="flex items-start gap-4 rounded-2xl border border-slate-100 p-4">
          <i className="ri-currency-line mt-1 text-gonexi-accent"></i>
          <div>
            <h3 className="font-bold text-slate-900">Rs. {props.fare?.[props.vehicleType]}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">Trip fare</p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => props.cancelRideRequest ? props.cancelRideRequest() : props.setVehicleFound(false)}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100"
      >
        <i className="ri-close-circle-line"></i>
        Cancel Ride Request
      </button>
    </div>
  )
}

export default LookingForDriver
