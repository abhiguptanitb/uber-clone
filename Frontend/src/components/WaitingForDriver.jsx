const vehicleIcon = {
  car: ["ri-car-line", "Maruti Suzuki Alto", "bg-gonexi-gradient"],
  moto: ["ri-motorbike-line", "Splendor", "bg-gonexi-secondary"],
  auto: ["ri-truck-line", "Bajaj Auto RE", "bg-gonexi-accent"],
}

const WaitingForDriver = (props) => {
  const [icon, model, tone] = vehicleIcon[props.vehicleType] || vehicleIcon.car
  const timeline = [
    ["ri-checkbox-circle-line", "Requested"],
    ["ri-user-star-line", "Captain assigned"],
    ["ri-route-line", "Arriving"],
    ["ri-play-circle-line", "Start ride"],
  ]

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gonexi-primary">Driver assigned</p>
          <h3 className="mt-1 text-3xl font-bold text-slate-900">Your ride is on the way</h3>
        </div>
        <button
          type="button"
          onClick={() => props.setWaitingForDriver(false)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-gonexi-primary hover:text-gonexi-primary"
          aria-label="Close driver details"
        >
          <i className="ri-close-line text-xl"></i>
        </button>
      </div>

      <div className="grid gap-4 rounded-3xl bg-slate-50 p-5 md:grid-cols-[1fr_auto] md:items-center">
        <div className="flex items-center gap-4">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${tone}`}>
            <i className={`${icon} text-2xl text-white`}></i>
          </div>
          <div>
            <h2 className="text-xl font-bold capitalize text-slate-900">{props.ride?.captain?.fullname?.firstname}</h2>
            <p className="text-sm text-slate-500">{model}</p>
            <p className="mt-1 font-mono text-lg font-black text-slate-900">{props.ride?.captain?.vehicle?.plate}</p>
          </div>
        </div>
        <div className="rounded-2xl bg-white px-5 py-4 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">OTP</p>
          <h1 className="mt-1 font-mono text-3xl font-black text-gonexi-primary">{props.ride?.otp}</h1>
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-slate-100 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gonexi-primary">Ride timeline</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {timeline.map(([iconName, title], index) => (
            <div key={title} className="rounded-2xl bg-slate-50 p-3 text-center">
              <div className={`mx-auto flex h-9 w-9 items-center justify-center rounded-xl ${index < 3 ? "bg-gonexi-gradient text-white" : "bg-slate-200 text-slate-500"}`}>
                <i className={iconName}></i>
              </div>
              <p className="mt-2 text-xs font-bold text-slate-700">{title}</p>
            </div>
          ))}
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
            <p className="mt-1 text-sm leading-6 text-slate-600">Payment after trip</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WaitingForDriver
