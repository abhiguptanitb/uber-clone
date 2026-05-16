const rideOptions = [
  {
    type: "car",
    name: "GoNexiCar",
    seats: 4,
    eta: "2 mins away",
    copy: "Comfortable city rides",
    icon: "ri-car-line",
    tone: "bg-gonexi-gradient",
  },
  {
    type: "moto",
    name: "GoNexiMoto",
    seats: 1,
    eta: "3 mins away",
    copy: "Fast point-to-point travel",
    icon: "ri-motorbike-line",
    tone: "bg-gonexi-secondary",
  },
  {
    type: "auto",
    name: "GoNexiAuto",
    seats: 3,
    eta: "3 mins away",
    copy: "Affordable everyday rides",
    icon: "ri-truck-line",
    tone: "bg-gonexi-accent",
  },
]

const VehiclePanel = (props) => {
  const chooseVehicle = (type) => {
    props.setConfirmRidePanel(true)
    props.setVehiclePanel(false)
    props.selectVehicle(type)
    localStorage.setItem("vehicleType", type)
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gonexi-primary">Fare options</p>
          <h3 className="mt-1 text-2xl font-bold text-slate-900">Choose your ride</h3>
        </div>
        <button
          type="button"
          onClick={() => props.setVehiclePanel(false)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-gonexi-primary hover:text-gonexi-primary"
          aria-label="Close ride options"
        >
          <i className="ri-close-line text-xl"></i>
        </button>
      </div>

      <div className="grid gap-3">
        {rideOptions.map((option) => (
          <button
            key={option.type}
            type="button"
            onClick={() => chooseVehicle(option.type)}
            className="group flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-gonexi-primary hover:shadow-gonexi"
          >
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${option.tone}`}>
              <i className={`${option.icon} text-xl text-white`}></i>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-bold text-slate-900">{option.name}</h4>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                  <i className="ri-user-3-fill mr-1"></i>
                  {option.seats}
                </span>
              </div>
              <p className="mt-1 text-sm font-medium text-slate-500">{option.eta}</p>
              <p className="text-sm text-slate-400">{option.copy}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-gonexi-primary">Rs. {props.fare?.[option.type] ?? "--"}</p>
              <i className="ri-arrow-right-line text-slate-300 transition group-hover:text-gonexi-primary"></i>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default VehiclePanel
