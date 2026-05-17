import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserDataContext } from '../context/UserContext';

const UserSignup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [error, setError] = useState(''); 

    const navigate = useNavigate();

    const { setUser } = useContext(UserDataContext);

    const submitHandler = async (e) => {
        e.preventDefault();
        setError(''); // Reset error before submission

        if (firstName.length < 2) {
            setError('First name must be at least 2 characters long.');
            return;
        }
        if (lastName.length < 2) {
            setError('Last name must be at least 2 characters long.');
            return;
        }

        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!email.match(emailPattern)) {
            setError('Invalid email format.');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        const newUser = {
            fullname: {
                firstname: firstName,
                lastname: lastName,
            },
            email: email,
            password: password,
        };

        try {
            const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/users/register`, newUser);

            if (response.status === 201) {
                const data = response.data;
                setUser(data.user);
                localStorage.setItem('token', data.token);
                navigate('/home');
            }

            setEmail('');
            setFirstName('');
            setLastName('');
            setPassword('');
        } catch (error) {
            if (error.response && error.response.status === 400) {
                setError('User already exists. Please try logging in.');
            } else {
                setError('An error occurred. Please try again later.');
            }
        }
    };

    return (
        <div className='min-h-screen bg-[#eef2f6] p-4 md:p-8'>
            <div className='mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl overflow-hidden rounded-[32px] border border-white/70 bg-white shadow-gonexi-lg md:grid-cols-[0.9fr_1.1fr]'>
                <div className='hidden bg-gonexi-gradient p-10 text-white md:flex md:flex-col md:justify-between'>
                    <div>
                        <p className='text-sm font-semibold uppercase tracking-[0.22em] text-white/75'>Passenger onboarding</p>
                        <h1 className='mt-4 text-5xl font-black leading-tight'>Create your ride profile.</h1>
                    </div>
                    <div className='rounded-3xl bg-white/15 p-5 backdrop-blur'>
                    </div>
                </div>
                <div className='flex flex-col justify-between p-6 md:p-10'>
                <div>
                    <div className="mb-6 flex justify-end">
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-gonexi-primary hover:text-gonexi-primary"
                        >
                            <i className="ri-home-5-line"></i>
                            Home
                        </Link>
                    </div>
                    <div className="flex items-center mb-8">
                        <div className="w-16 h-16 bg-gonexi-gradient rounded-2xl flex items-center justify-center shadow-gonexi-lg mr-4">
                            <span className="text-white font-bold text-2xl">G</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">GoNexi</h1>
                            <p className="text-sm text-gray-600">Join as a passenger</p>
                        </div>
                    </div>

                    <form onSubmit={(e) => submitHandler(e)} className='space-y-5'>
                        <h3 className='text-xl font-bold text-slate-900'>Passenger details</h3>
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


                        
                        <div className='min-h-6 text-center flex items-center justify-center'>
                            {error && <p className='text-red-500 text-sm'>{error}</p>}
                        </div>

                        <button
                            className='bg-gonexi-gradient text-white font-bold rounded-2xl px-4 py-4 w-full text-base shadow-gonexi transition hover:-translate-y-0.5 hover:shadow-gonexi-lg'
                        >Create account</button>

                    </form>
                    <p className='mt-5 text-center text-slate-600'>Already have an account? <Link to='/login' className='font-semibold text-gonexi-primary'>Login here</Link></p>
                </div>

                    <div>
                    <p className='mt-8 text-[10px] leading-tight text-slate-500'>This site is protected by reCAPTCHA and the <span className='underline'>Google Privacy
                        Policy</span> and <span className='underline'>Terms of Service apply</span>.</p>
                </div>
                </div>
            </div>
        </div >
    );
};

export default UserSignup;
