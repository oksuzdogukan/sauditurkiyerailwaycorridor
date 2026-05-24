import { Routes, Route, Link, useLocation } from "react-router-dom";
import SearchTrains from "./SearchTrains";
import BookTicket from "./BookTicket";
import MyTickets from "./MyTickets";
import Payment from "./Payment";
import Extras from "./Extras";

export default function PassengerLayout() {
  const location = useLocation();

  const navItems = [
    { name: "Search Trains", path: "/passenger" },
    { name: "My Tickets", path: "/passenger/tickets" },
    { name: "Dependents & Luggage", path: "/passenger/extras" },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Passenger Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white shadow-sm rounded-lg p-4 h-fit">
        <h2 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">
          Passenger Menu
        </h2>
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`px-4 py-2 rounded-md transition-colors ${
                location.pathname === item.path ||
                (location.pathname === "/passenger/" &&
                  item.path === "/passenger")
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Passenger Content Area */}
      <div className="flex-1 bg-white shadow-sm rounded-lg p-6">
        <Routes>
          <Route path="/" element={<SearchTrains />} />
          <Route path="/book/:trainId" element={<BookTicket />} />
          <Route path="/tickets" element={<MyTickets />} />
          <Route path="/extras" element={<Extras />} />
          <Route path="/payment/:ticketId" element={<Payment />} />
        </Routes>
      </div>
    </div>
  );
}
