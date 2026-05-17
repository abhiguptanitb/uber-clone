import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate, useSearchParams } from 'react-router-dom'

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const [message, setMessage] = useState('Verifying your Stripe payment...')

    useEffect(() => {
        const sessionId = searchParams.get('session_id')
        const rideId = searchParams.get('ride_id')

        if (!sessionId || !rideId) {
            navigate('/home')
            return
        }

        const verifyPayment = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/rides/payment/verify`, {
                    params: {
                        rideId,
                        sessionId,
                    },
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                })

                if (response.data.ride) {
                    localStorage.setItem('activeRide', JSON.stringify(response.data.ride))
                }

                if (response.data.paymentStatus === 'paid') {
                    setMessage('Payment successful. Redirecting you to your home page...')
                    localStorage.removeItem('activeRide')
                    localStorage.removeItem('pendingPaymentRide')

                    setTimeout(() => {
                        navigate('/home')
                    }, 1500)

                    return
                }

                setMessage('Payment is not completed yet. Redirecting you back to the ride page...')
                setTimeout(() => {
                    navigate(`/riding?ride_id=${rideId}`)
                }, 1500)
            } catch {
                setMessage('We could not verify your payment right now. Redirecting you back to the ride page...')
                setTimeout(() => {
                    navigate(`/riding?ride_id=${rideId}`)
                }, 1500)
            }
        }

        verifyPayment()
    }, [navigate, searchParams])

    return (
        <main className='min-h-screen bg-[#eef2f6] p-4 text-center text-gonexi-dark md:p-6 lg:p-8'>
            <div className='mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1100px] items-center justify-center rounded-[36px] border border-white/70 bg-white/80 p-6 shadow-gonexi-lg backdrop-blur lg:min-h-[calc(100vh-4rem)]'>
                <section className='w-full max-w-lg'>
                    <div className='mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-gonexi-gradient shadow-gonexi'>
                        <i className='ri-secure-payment-line text-4xl text-white'></i>
                    </div>
                    <p className='mt-8 text-sm font-semibold uppercase tracking-[0.22em] text-gonexi-primary'>Payment status</p>
                    <h1 className='mt-3 text-4xl font-black text-slate-950'>Stripe Payment</h1>
                    <p className='mx-auto mt-4 max-w-md text-base leading-7 text-slate-600'>{message}</p>
                    <div className='mx-auto mt-8 h-2 w-40 overflow-hidden rounded-full bg-slate-100'>
                        <div className='h-full w-2/3 animate-pulse rounded-full bg-gonexi-gradient'></div>
                    </div>
                </section>
            </div>
        </main>
    )
}

export default PaymentSuccess
