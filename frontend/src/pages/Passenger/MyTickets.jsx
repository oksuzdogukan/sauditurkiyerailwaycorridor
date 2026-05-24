import { useState, useEffect } from "react";
import { getReservations, cancelReservation } from "../../services/api";
import { useNavigate } from "react-router-dom";

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const passengerId = localStorage.getItem("passengerId") || "user123";

  const fetchTickets = async () => {
    try {
      const response = await getReservations(passengerId);
      setTickets(response.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCancel = async (reservationId) => {
    if (!window.confirm("Are you sure you want to cancel this reservation?")) return;
    try {
      await cancelReservation(reservationId);
      alert("Reservation canceled successfully. Waitlisted passengers prioritized by loyalty class will be automatically promoted!");
      fetchTickets();
    } catch (err) {
      console.error(err);
      alert("Failed to cancel reservation.");
    }
  };

  if (loading)
    return <div className="text-slate-500">Loading your tickets...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-slate-800">My Tickets</h2>

      {tickets.length === 0 ? (
        <p className="text-slate-500">You don't have any upcoming trips.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {tickets.map((ticket) => {
            const isCanceled = ticket.ticketStatus === "Canceled" || ticket.status === "Canceled";
            return (
              <div
                key={ticket.ticketId || ticket.id}
                className="border border-slate-200 rounded-lg p-5 shadow-sm bg-white flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-slate-800">
                        {ticket.trainName || "Train Route"}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Booking Ref: #{ticket.id}
                        {ticket.ticketId && ` | Ticket ID: #${ticket.ticketId}`}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        isCanceled
                          ? "bg-red-100 text-red-800"
                          : ticket.status === "Paid"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {isCanceled ? "Canceled" : ticket.status || "Pending Payment"}
                    </span>
                  </div>

                  <div className="text-sm text-slate-600 mb-4 space-y-1">
                    <p>
                      <span className="font-medium">Class:</span> {ticket.seatClass}
                    </p>
                    <p>
                      <span className="font-medium">Seat:</span> {ticket.seatNumber || "N/A"}
                    </p>
                    <p>
                      <span className="font-medium">Price:</span> ${ticket.ticketPrice || "0.00"}
                    </p>
                    <p>
                      <span className="font-medium">Date:</span> {new Date(ticket.travelDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  {!isCanceled && ticket.status !== "Paid" && (
                    <button
                      onClick={() =>
                        navigate(`/passenger/payment/${ticket.id}`)
                      }
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm font-medium transition-colors"
                    >
                      Pay Now
                    </button>
                  )}
                  {!isCanceled && (
                    <button
                      onClick={() => handleCancel(ticket.id)}
                      className="w-full border border-red-200 hover:bg-red-50 text-red-600 py-2 rounded text-sm font-medium transition-colors"
                    >
                      Cancel Reservation
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
