import { Routes, Route, Link, useLocation } from "react-router-dom";
import ManageTrains from "./ManageTrains";
import ManageStations from "./ManageStation";
import ManageStaff from "./ManageStaff";
import ManageFreight from "./ManageFreight";
import ManageMaintenance from "./ManageMaintenance";
import ManageWaitingList from "./ManageWaitingList";

export default function AdminLayout() {
  const location = useLocation();

  const navItems = [
    { name: "Trains", path: "/admin" },
    { name: "Stations", path: "/admin/stations" },
    { name: "Staff Assignments", path: "/admin/staff" },
    { name: "Freight", path: "/admin/freight" },
    { name: "Maintenance", path: "/admin/maintenance" },
    { name: "Waiting List Queue", path: "/admin/waitinglist" },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 rounded-lg p-4 h-fit shadow-md">
        <h2 className="text-lg font-bold text-white mb-4 border-b border-slate-700 pb-2">
          Admin Control
        </h2>
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`px-4 py-2 rounded-md transition-colors ${
                location.pathname === item.path ||
                (location.pathname === "/admin/" && item.path === "/admin")
                  ? "bg-blue-600 text-white font-semibold"
                  : "hover:bg-slate-800 hover:text-white"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex-1 bg-white shadow-sm rounded-lg p-6 border border-slate-100">
        <Routes>
          <Route path="/" element={<ManageTrains />} />
          <Route path="/stations" element={<ManageStations />} />
          <Route path="/staff" element={<ManageStaff />} />
          <Route path="/freight" element={<ManageFreight />} />
          <Route path="/maintenance" element={<ManageMaintenance />} />
          <Route path="/waitinglist" element={<ManageWaitingList />} />
        </Routes>
      </div>
    </div>
  );
}
