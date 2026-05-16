import { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { UserDataContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const UserLogin = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(""); 

    const { setUser } = useContext(UserDataContext);
    const navigate = useNavigate();

    const submitHandler = async (e) => {
        e.preventDefault();

        const userData = {
            email: email,
            password: password,
        };

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BASE_URL}/users/login`,
                userData
            );

            if (response.status === 200) {
                const data = response.data;
                setUser(data.user);
                localStorage.setItem("token", data.token); 
                navigate("/home");
            }
        } catch (err) {
            if (err.response && err.response.status === 401) {
                setError("Invalid email or password. Please try again.");
            } else {
                setError("An error occurred. Please try again later.");
            }
        }

        setEmail("");
        setPassword("");
    };

    return (
        <div className="min-h-screen bg-gonexi-gradient-light flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-gonexi-lg p-8 w-full max-w-md">
                <div className="mb-6 flex justify-end">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-gonexi-primary hover:text-gonexi-primary"
                    >
                        <i className="ri-home-5-line"></i>
                        Home
                    </Link>
                </div>

                {/* Logo and branding */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gonexi-gradient rounded-2xl flex items-center justify-center shadow-gonexi-lg mx-auto mb-4">
                        <span className="text-white font-bold text-3xl">G</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome to GoNexi</h1>
                    <p className="text-gray-600">Sign in to continue your journey</p>
                </div>

                        <form onSubmit={submitHandler} className="space-y-6">

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                        <input
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gonexi-primary focus:border-transparent transition-all duration-200"
                            type="email"
                            placeholder="Enter your email"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                        <input
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gonexi-primary focus:border-transparent transition-all duration-200"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            type="password"
                            placeholder="Enter your password"
                        />
                    </div>
                    
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    )}

                    <button 
                        type="submit"
                        className="w-full bg-gonexi-gradient text-white font-semibold py-3 rounded-xl shadow-gonexi hover:shadow-gonexi-lg transform hover:scale-105 transition-all duration-200"
                    >
                        Sign In
                    </button>
                        </form>

                <div className="mt-6 text-center">
                    <p className="text-gray-600">
                        New here? {" "}
                        <Link to="/signup" className="text-gonexi-primary font-semibold hover:underline">
                            Create Account
                        </Link>
                    </p>
                </div>

                <div className="mt-8">
                    <Link
                        to="/captain-login"
                        className="w-full bg-gonexi-secondary text-white font-semibold py-3 rounded-xl flex items-center justify-center shadow-gonexi hover:shadow-gonexi-lg transform hover:scale-105 transition-all duration-200"
                    >
                        <i className="ri-steering-2-line mr-2"></i>
                        Sign in as Driver
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default UserLogin;
