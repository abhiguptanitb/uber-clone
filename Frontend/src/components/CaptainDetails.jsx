import { useContext } from 'react'
import { CaptainDataContext } from '../context/CaptainContext'

const CaptainDetails = (props) => {
    const { captain } = useContext(CaptainDataContext)
    const earningsToday = props.earningsToday ?? 0
    const ridesToday = props.ridesToday ?? 0
    const paidRidesToday = props.paidRidesToday ?? 0

    return (
        <div className="w-full rounded-[28px] border border-white/70 bg-white p-5 shadow-gonexi-lg backdrop-blur sm:p-6">
            <div className="flex flex-col gap-4 sm:gap-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                        <div className='flex items-center gap-3'>
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gonexi-gradient shadow-gonexi">
                                <i className="ri-user-line text-white text-xl"></i>
                            </div>
                            <div className="min-w-0">
                                <h4 className='truncate text-xl font-black capitalize text-slate-900'>
                                    {captain.fullname.firstname + " " + captain.fullname.lastname}
                                </h4>
                                <p className='text-sm font-medium text-slate-500'>GoNexi Driver</p>
                            </div>
                        </div>

                        <div className="mt-4 inline-flex max-w-full items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                            <div className="h-10 w-10 shrink-0 rounded-xl shadow-gonexi">
                                {captain?.vehicle?.vehicleType === 'car' ? (
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gonexi-gradient">
                                        <i className="ri-car-line text-white text-sm"></i>
                                    </div>
                                ) : captain?.vehicle?.vehicleType === 'moto' ? (
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gonexi-secondary">
                                        <i className="ri-motorbike-line text-white text-sm"></i>
                                    </div>
                                ) : captain?.vehicle?.vehicleType === 'auto' ? (
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gonexi-accent">
                                        <i className="ri-truck-line text-white text-sm"></i>
                                    </div>
                                ) : (
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-500">
                                        <i className="ri-question-line text-white text-sm"></i>
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Vehicle</p>
                                <p className="truncate text-sm font-bold capitalize text-slate-700">
                                    {captain?.vehicle?.vehicleType || 'Unknown'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-gradient-to-br from-gonexi-primary/10 to-gonexi-secondary/10 px-4 py-3 sm:min-w-[140px] sm:text-right">
                        <p className='text-xs font-semibold uppercase tracking-[0.14em] text-gonexi-primary/70'>Today</p>
                        <h4 className='mt-1 text-2xl font-bold text-gonexi-primary sm:text-3xl'>Rs. {earningsToday}</h4>
                        <p className='text-sm font-medium text-slate-500'>Earned Today</p>
                    </div>
                </div>

                <div className='grid grid-cols-3 gap-3'>
                    <div className='rounded-2xl border border-slate-100 bg-slate-50 px-2 py-4 text-center sm:px-4'>
                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gonexi-primary">
                            <i className="ri-timer-2-line text-white text-lg"></i>
                        </div>
                        <h5 className='text-lg font-black text-slate-900'>10.2</h5>
                        <p className='text-xs leading-4 text-slate-500'>Hours Online</p>
                    </div>
                    <div className='rounded-2xl border border-slate-100 bg-slate-50 px-2 py-4 text-center sm:px-4'>
                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gonexi-secondary">
                            <i className="ri-speed-up-line text-white text-lg"></i>
                        </div>
                        <h5 className='text-lg font-black text-slate-900'>{paidRidesToday}/{ridesToday}</h5>
                        <p className='text-xs leading-4 text-slate-500'>Paid / Total Rides</p>
                    </div>
                    <div className='rounded-2xl border border-slate-100 bg-slate-50 px-2 py-4 text-center sm:px-4'>
                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gonexi-accent">
                            <i className="ri-star-line text-white text-lg"></i>
                        </div>
                        <h5 className='text-lg font-black text-slate-900'>4.8</h5>
                        <p className='text-xs leading-4 text-slate-500'>Rating</p>
                    </div>
                </div>

                <div className="flex items-center justify-center pt-1">
                    <div className="flex items-center rounded-full bg-gonexi-success px-4 py-2 text-sm font-semibold text-white">
                        <div className="mr-2 h-2 w-2 rounded-full bg-white animate-pulse"></div>
                        Online & Ready
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CaptainDetails
