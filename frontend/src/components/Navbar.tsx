import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <nav className="bg-slate-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex-shrink-0">
            <Link to="/" className="text-xl font-bold tracking-wider">
              SAUDI-TÜRKIYE <span className="text-blue-400">RAIL</span>
            </Link>
          </div>

          {/* Dynamic Menu */}
          <div className="flex items-baseline space-x-4">
            {token ? (
              <>
                {userRole === "passenger" && (
                  <Link
                    to="/passenger"
                    className="hover:bg-slate-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Passenger Panel
                  </Link>
                )}
                {userRole === "admin" && (
                  <Link
                    to="/admin"
                    className="hover:bg-slate-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Admin Panel
                  </Link>
                )}
                {userRole === "system" && (
                  <Link
                    to="/system"
                    className="hover:bg-slate-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    System Ops
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="border border-slate-600 hover:bg-slate-800 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
