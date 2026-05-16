const LocationSearchPanel = ({ suggestions, setPanelOpen, setPickup, setDestination, activeField, onSuggestionSelect }) => {
  const handleSuggestionClick = (suggestion) => {
    if (activeField === "pickup") {
      setPickup(suggestion)
      localStorage.setItem("pickup", suggestion)
      // Mark that pickup is no longer from current location if user selects a different one
      localStorage.setItem("isPickupFromCurrentLocation", "false")
    } else if (activeField === "destination") {
      setDestination(suggestion)
      localStorage.setItem("destination", suggestion)
    }

    onSuggestionSelect?.(suggestion, activeField)

    if (setPanelOpen) {
      setPanelOpen(false)
    }
  }

  return (
    <div>
      <div
        className="suggestions-container max-h-72 overflow-y-auto"
      >
        {suggestions.map((elem, idx) => (
          <div
            key={idx}
            onClick={() => handleSuggestionClick(elem)}
            className="my-2 flex cursor-pointer items-center justify-start gap-4 rounded-2xl border border-slate-100 p-3 transition hover:border-gonexi-primary hover:bg-slate-50"
          >
            <h2 className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-gonexi-primary">
              <i className="ri-map-pin-fill"></i>
            </h2>
            <h4 className="text-sm font-semibold leading-5 text-slate-700">{elem}</h4>
          </div>
        ))}
      </div>
    </div>
  )
}

export default LocationSearchPanel
