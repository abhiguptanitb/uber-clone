import { useContext, useState } from 'react'
import { Link } from 'react-router-dom'
import { CaptainDataContext } from '../context/CaptainContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const CaptainSignup = () => {

    const navigate = useNavigate()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')

    const [vehicleColor, setVehicleColor] = useState('')
    const [vehiclePlate, setVehiclePlate] = useState('')
    const [vehicleCapacity, setVehicleCapacity] = useState('')
    const [vehicleType, setVehicleType] = useState('')

    const [errorMessage, setErrorMessage] = useState('')

    const { setCaptain } = useContext(CaptainDataContext)

    const submitHandler = async (e) => {
        e.preventDefault()
        setErrorMessage('') 

        if (firstName.length < 2) {
            setErrorMessage('First name must be at least 2 characters long.');
            return;
        }
        if (lastName.length < 2) {
            setErrorMessage('Last name must be at least 2 characters long.');
            return;
        }

        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!email.match(emailPattern)) {
            setErrorMessage('Invalid email format.');
            return;
        }

        if (password.length < 6) {
            setErrorMessage('Password must be at least 6 characters long.');
            return;
        }

        if (vehicleColor.length < 3) {
            setErrorMessage('Vehicle color must be at least 3 characters long.');
            return;
        }

        if (vehiclePlate.length < 3) {
            setErrorMessage('Vehicle plate must be at least 3 characters long.');
            return;
        }

        if (vehicleCapacity <= 0) {
            setErrorMessage('Vehicle capacity must be at least 1.');
            return;
        }

        if (!['car', 'auto', 'moto'].includes(vehicleType)) {
            setErrorMessage('Invalid vehicle type.');
            return;
        }

        const captainData = {
            fullname: {
                firstname: firstName,
                lastname: lastName
            },
            email: email,
            password: password,
            vehicle: {
                color: vehicleColor,
                plate: vehiclePlate,
                capacity: vehicleCapacity,
                vehicleType: vehicleType
            }
        }



        try {
            const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/captains/register`, captainData)

            if (response.status === 201) {
                const data = response.data
                setCaptain(data.captain)
                localStorage.setItem('token', data.token)
                navigate('/captain-home')
            }

                setEmail('')
                setFirstName('')
                setLastName('')
                setPassword('')
                setVehicleColor('')
                setVehiclePlate('')
                setVehicleCapacity('')
                setVehicleType('')

        } catch (error) {
            if (error.response && error.response.status === 400) {
                setErrorMessage('Captain already exists. Please try logging in.')
            } else {
                setErrorMessage('An error occurred. Please try again later.')
            }
        }
    }

    return (
        <div className='min-h-screen bg-[#eef2f6] p-4 md:p-8'>
            <div className='mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl overflow-hidden rounded-[32px] border border-white/70 bg-white shadow-gonexi-lg lg:grid-cols-[0.8fr_1.2fr]'>
                <aside className='hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between'>
                    <div>
                        <p className='text-sm font-semibold uppercase tracking-[0.22em] text-teal-200'>Driver onboarding</p>
                        <h1 className='mt-4 text-5xl font-black leading-tight'>Put your vehicle on the GoNexi grid.</h1>
                    </div>
                    <div className='rounded-3xl bg-white/10 p-5 backdrop-blur'>
                    </div>
                </aside>
                <div className="p-6 md:p-10">
                    <div className="mb-6 flex justify-end">
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-gonexi-primary hover:text-gonexi-primary"
                        >
                            <i className="ri-home-5-line"></i>
                            Home
                        </Link>
                    </div>
                    <div className="flex items-center mb-6">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gonexi-gradient rounded-2xl flex items-center justify-center shadow-gonexi-lg mr-3 sm:mr-4">
                            <i className="ri-steering-2-line text-white text-xl sm:text-2xl"></i>
                        </div>
                        <div>
                            <h1 className="text-lg sm:text-xl font-bold text-gray-800">GoNexi Driver</h1>
                            <p className="text-xs sm:text-sm text-gray-600">Join as a driver</p>
                        </div>
                    </div>

                <form onSubmit={submitHandler} className='space-y-5'>

                    <h3 className='text-xl font-bold text-slate-900'>Captain details</h3>
                    <div className='grid gap-4 sm:grid-cols-2'>
                        <input
                            required
                            className='rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none transition focus:border-gonexi-primary focus:bg-white'
                            type="text"
                            placeholder='First name'
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                        />
                        <input
                            required
                            className='rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none transition focus:border-gonexi-primary focus:bg-white'
                            type="text"
                            placeholder='Last name'
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                        />
                    </div>

                    <input
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className='w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none transition focus:border-gonexi-primary focus:bg-white'
                        type="email"
                        placeholder='email@example.com'
                    />

                    <input
                        className='w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none transition focus:border-gonexi-primary focus:bg-white'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        type="password"
                        placeholder='password'
                    />

                    <h3 className='text-xl font-bold text-slate-900'>Vehicle information</h3>

                    <div className='grid gap-4 sm:grid-cols-2'>
                        <input
                            required
                            className='rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none transition focus:border-gonexi-primary focus:bg-white'
                            type="text"
                            placeholder='Vehicle Color'
                            value={vehicleColor}
                            onChange={(e) => setVehicleColor(e.target.value)}
                        />
                        <input
                            required
                            className='rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none transition focus:border-gonexi-primary focus:bg-white'
                            type="text"
                            placeholder='Vehicle Plate'
                            value={vehiclePlate}
                            onChange={(e) => setVehiclePlate(e.target.value)}
                        />
                    </div>
                    <div className='grid gap-4 sm:grid-cols-2'>
                        <input
                            required
                            className='rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none transition focus:border-gonexi-primary focus:bg-white'
                            type="number"
                            placeholder='Vehicle Capacity'
                            value={vehicleCapacity}
                            onChange={(e) => setVehicleCapacity(e.target.value)}
                        />
                        <select
                            required
                            className='rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none transition focus:border-gonexi-primary focus:bg-white'
                            value={vehicleType}
                            onChange={(e) => setVehicleType(e.target.value)}
                        >
                            <option value="" disabled>Select Vehicle Type</option>
                            <option value="car">Car</option>
                            <option value="auto">Auto</option>
                            <option value="moto">Moto</option>
                        </select>
                    </div>

                    <div 
                        className="min-h-6 text-center flex items-center justify-center">
                        {errorMessage && <p className="text-red-500">{errorMessage}</p>}
                    </div>


                        <button
                            className='bg-gonexi-gradient text-white font-bold rounded-2xl px-4 py-4 w-full text-base shadow-gonexi transition hover:-translate-y-0.5 hover:shadow-gonexi-lg'
                        >Create Captain Account</button>

                    </form>
                    <p className='mt-5 text-center text-sm sm:text-base text-slate-600'>Already have an account? <Link to='/captain-login' className='font-semibold text-gonexi-primary'>Login here</Link></p>
                    <p className='text-[10px] sm:text-xs mt-6 leading-tight text-slate-500'>This site is protected by reCAPTCHA and the <span className='underline'>Google Privacy
                    Policy</span> and <span className='underline'>Terms of Service apply</span>.</p>
                </div>
            </div>
        </div>
    )
}

export default CaptainSignup
