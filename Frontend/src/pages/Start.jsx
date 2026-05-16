import { Link } from "react-router-dom"

const Start = () => {
  return (
    <main className="min-h-screen bg-[#eef2f6] p-4 text-gonexi-dark md:p-6 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1400px] overflow-hidden rounded-[36px] border border-white/70 bg-white/80 shadow-gonexi-lg backdrop-blur lg:min-h-[calc(100vh-4rem)] lg:grid-cols-[1.08fr_0.92fr]">
        <section className="flex flex-col justify-between gap-10 p-6 md:p-10 lg:p-12">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gonexi-gradient shadow-gonexi">
              <span className="text-3xl font-black text-white">G</span>
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-950">GoNexi</h1>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gonexi-primary">Urban mobility desk</p>
            </div>
          </div>

          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gonexi-accent">Dispatch. Track. Pay.</p>
            <h2 className="mt-4 text-5xl font-black leading-tight text-slate-950 md:text-6xl lg:text-7xl">
              Ride operations with a cleaner cockpit.
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Book passenger trips, match captains, track movement live, and complete payment flows from a full desktop workspace.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["ri-radar-line", "Live Map", "Track location without losing screen space."],
              ["ri-route-line", "Fast Booking", "Pickup, destination, fare, and vehicle in one flow."],
              ["ri-secure-payment-line", "Stripe Ready", "Keep pending payments visible and controlled."],
            ].map(([icon, title, copy]) => (
              <div key={title} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                <i className={`${icon} text-3xl text-gonexi-primary`}></i>
                <h3 className="mt-4 font-black text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="relative min-h-[520px] bg-slate-950 p-6 text-white md:p-10 lg:p-12">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(15,118,110,0.72),rgba(37,99,235,0.58)),url('https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center"></div>
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div className="ml-auto rounded-3xl bg-white/15 px-5 py-4 backdrop-blur">
              <p className="text-sm font-semibold text-white/80">System status</p>
              <p className="mt-1 text-2xl font-black">Ready</p>
            </div>

            <div className="rounded-[28px] bg-white/95 p-5 text-slate-900 shadow-2xl backdrop-blur">
              <h2 className="text-2xl font-black">Continue as passenger or driver</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Choose your role on the next screen and enter the redesigned GoNexi workspace.</p>
              <Link
                to="/login"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gonexi-gradient px-5 py-4 font-bold text-white shadow-gonexi transition hover:-translate-y-0.5 hover:shadow-gonexi-lg"
              >
                Choose Your Role
                <i className="ri-arrow-right-line"></i>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

export default Start
