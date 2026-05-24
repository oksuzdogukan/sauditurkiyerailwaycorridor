import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import PassengerLayout from "./pages/Passenger/PassengerLayout";
import AdminLayout from "./pages/Admin/AdminLayout";
import Login from "./pages/Login";
import SystemLayout from "./pages/System/SystemLayout";
import Landing from "./pages/Landing";
import Register from "./pages/Register";
import PrivateRoute from "./components/PrivateRoute";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        <Navbar />

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Dashboards with Route Protection */}
            <Route 
              path="/passenger/*" 
              element={
                <PrivateRoute allowedRole="passenger">
                  <PassengerLayout />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/admin/*" 
              element={
                <PrivateRoute allowedRole="admin">
                  <AdminLayout />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/system/*" 
              element={
                <PrivateRoute allowedRole="system">
                  <SystemLayout />
                </PrivateRoute>
              } 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
