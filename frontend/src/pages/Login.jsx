import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginPassenger } from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await loginPassenger(formData);
      // Assuming backend returns a user object or token.
      // We store the passenger ID to use in our other API calls.
      const passengerId =
        response.data.id || response.data.passengerId || "user123";
      localStorage.setItem("passengerId", passengerId);
      
      const role = response.data.role || "passenger";
      localStorage.setItem("userRole", role);
      
      // Store passenger loyalty status if returned
      if (response.data.loyaltyClass) {
        localStorage.setItem("passengerLoyaltyTier", response.data.loyaltyClass);
      }
      
      // If backend returns a token, store it as well
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      }

      if (role === "admin") {
        navigate("/admin");
      } else if (role === "system") {
        navigate("/system");
      } else {
        navigate("/passenger");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-sm border border-slate-100 mt-10">
      <h2 className="text-2xl font-bold mb-6 text-center text-slate-800">
        Welcome Back
      </h2>

      {error && (
        <div className="mb-4 text-red-600 text-sm bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Email
          </label>
          <input
            type="email"
            required
            className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500"
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Password
          </label>
          <input
            type="password"
            required
            className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500"
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors disabled:bg-blue-300"
        >
          {loading ? "Logging in..." : "Log In"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600">
        Don't have an account?{" "}
        <Link to="/register" className="text-blue-600 hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}
