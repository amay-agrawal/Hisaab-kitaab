import { Wallet, TrendingUp, IndianRupee } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import { useApp } from "../context/AppContext";

export default function Login() {

    const navigate = useNavigate();
    const { user, loading } = useApp();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    useEffect(() => {
        if (!loading && user) {
            navigate("/dashboard");
        }
    }, [user, loading, navigate]);

    const handleLogin = async (e) => {

        e.preventDefault();

        try {

            const response = await axios.post(
                "http://localhost:8000/api/v1/users/login",
                {
                    email,
                    password
                },
                {
                    withCredentials: true
                }
            );

            alert(response.data.message);

            navigate("/dashboard");

        } catch (error) {

            alert(
                error.response?.data?.message ||
                "Login Failed"
            );

        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-100 flex items-center justify-center p-4">

            <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden grid lg:grid-cols-2">

                {/* Left Section */}

                <div className="flex flex-col justify-center bg-gradient-to-br from-blue-600 to-blue-800 p-12 text-white">

                    <div className="bg-white/20 w-20 h-20 rounded-2xl flex items-center justify-center mb-8">
                        <IndianRupee size={40} />
                    </div>

                    <h1 className="text-5xl font-bold leading-tight">
                        Track Your
                        <br />
                        Expenses
                        <br />
                        Smarter
                    </h1>

                    <p className="mt-6 text-blue-100 text-lg">
                        Manage income, expenses and savings in one place.
                    </p>

                    <div className="mt-10 space-y-4">

                        <div className="flex items-center gap-3 bg-white/10 p-4 rounded-xl">
                            <Wallet />
                            <span>Manage Daily Expenses</span>
                        </div>

                        <div className="flex items-center gap-3 bg-white/10 p-4 rounded-xl">
                            <TrendingUp />
                            <span>Track Income Growth</span>
                        </div>

                        <div className="flex items-center gap-3 bg-white/10 p-4 rounded-xl">
                            <IndianRupee />
                            <span>Monitor Savings Goals</span>
                        </div>

                    </div>

                </div>

                {/* Right Section */}

                <div className="p-10 flex flex-col justify-center">

                    <h2 className="text-4xl font-bold text-gray-800">
                        Welcome Back 👋
                    </h2>

                    <p className="text-gray-500 mt-2">
                        Login to continue.
                    </p>

                    <form
                        onSubmit={handleLogin}
                        className="mt-8 space-y-5"
                    >

                        <div>
                            <label className="block mb-2 font-medium">
                                Email
                            </label>

                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter email"
                                className="w-full border rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block mb-2 font-medium">
                                Password
                            </label>

                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter password"
                                className="w-full border rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-semibold transition"
                        >
                            Login
                        </button>

                        <p className="text-center mt-6 text-gray-600">
                            Don't have an account?{" "}
                            <button
                                type="button"
                                onClick={() => navigate("/register")}
                                className="text-blue-600 font-semibold hover:underline"
                            >
                                Register
                            </button>
                        </p>

                    </form>

                </div>

            </div>

        </div>
    );
}