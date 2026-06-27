import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Register() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:8000/api/v1/users/register",
        {
          fullName,
          email,
          username,
          password,
        }
      );

      console.log(response.data);
      alert("Registration Successful!");
      navigate("/");
    } catch (error) {
      console.log(error);
      alert(
        error.response?.data?.message || "Registration Failed"
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden grid lg:grid-cols-2">
        {/* Left Section */}
        <div className="flex flex-col justify-center bg-blue-600 p-12 text-white">
          <h1 className="text-5xl font-bold leading-tight">
            Start Your
            <br />
            Finance
            <br />
            Journey
          </h1>

          <p className="mt-6 text-blue-100 text-lg">
            Join the community, track expenses, share milestones,
            and grow your savings together.
          </p>

          <div className="mt-10 space-y-4">
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl">
              <h3 className="font-semibold text-lg">💰 Track Expenses</h3>
              <p className="text-blue-100 text-sm mt-1">
                Monitor every rupee you spend and stay on budget.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl">
              <h3 className="font-semibold text-lg">👥 Connect with Friends</h3>
              <p className="text-blue-100 text-sm mt-1">
                Follow friends and compare savings progress.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl">
              <h3 className="font-semibold text-lg">📈 Share Milestones</h3>
              <p className="text-blue-100 text-sm mt-1">
                Celebrate savings goals and financial achievements.
              </p>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="p-10 flex flex-col justify-center">
          <h2 className="text-4xl font-bold text-gray-800">
            Create Account 🚀
          </h2>

          <p className="text-gray-500 mt-2">
            Join Hisaab-Kitab Community.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleRegister}>
            <div>
              <label className="block mb-2 font-medium">
                Full Name
              </label>

              <input
                type="text"
                placeholder="Enter your full name"
                className="w-full border rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Username
              </label>

              <input
                type="text"
                placeholder="Choose a username"
                className="w-full border rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Email
              </label>

              <input
                type="email"
                placeholder="Enter your email"
                className="w-full border rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Password
              </label>

              <input
                type="password"
                placeholder="Create password"
                className="w-full border rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Avatar
              </label>

              <input
                type="file"
                accept="image/*"
                className="w-full border rounded-xl p-3 cursor-pointer"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-semibold transition"
            >
              Create Account
            </button>
          </form>

          <p className="text-center mt-6 text-gray-600">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/")}
              className="text-blue-600 font-semibold hover:underline"
            >
              Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}