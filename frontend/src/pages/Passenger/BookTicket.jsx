import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { bookTicket, getReservations } from "../../services/api";

export default function BookTicket() {
  const { trainId } = useParams(); // Grabs the ID from the URL
  const navigate = useNavigate();
  const { state } = useLocation();

  const fromStationId = state?.fromStationId || 1;
  const toStationId = state?.toStationId || 2;
  const travelDate = state?.travelDate || new Date().toISOString().split('T')[0];
  const fromStationName = state?.fromStationName || "Departure Station";
  const toStationName = state?.toStationName || "Destination Station";
  const trainName = state?.trainName || "Express Train";

  const passengerId = localStorage.getItem("passengerId") || "user123";
  const [bookingData, setBookingData] = useState({
    seatClass: "Economy",
    isDependent: false,
    loyaltyTier: localStorage.getItem("passengerLoyaltyTier") || "Regular",
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reservationCount, setReservationCount] = useState(0);

  // Base Prices for Seat Classes
  const basePrices = {
    Economy: 100.0,
    Business: 200.0,
    "First Class": 300.0,
  };

  // Fetch current reservation count to display validation alert
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const response = await getReservations(passengerId);
        if (response.data && Array.isArray(response.data)) {
          setReservationCount(response.data.length);
        }
      } catch (err) {
        console.error("Could not fetch active reservation count:", err);
      }
    };
    fetchReservations();
  }, [passengerId]);

  // Calculate pricing dynamics
  const basePrice = basePrices[bookingData.seatClass] || 100.0;
  let discountRate = 0.0;
  let discountReason = "None";

  if (bookingData.isDependent) {
    discountRate = 0.25; // 25% discount for dependents
    discountReason = "Dependent Discount (25%)";
  } else {
    // Loyalty class discounts: Green (5%), Silver (10%), Gold (25%)
    const loyaltyDiscounts = {
      Regular: 0.0,
      Green: 0.05,
      Silver: 0.10,
      Gold: 0.25,
    };
    discountRate = loyaltyDiscounts[bookingData.loyaltyTier] || 0.0;
    if (discountRate > 0) {
      discountReason = `Loyalty ${bookingData.loyaltyTier} Tier (${discountRate * 100}%)`;
    }
  }

  const discountAmount = basePrice * discountRate;
  const finalPrice = basePrice - discountAmount;

  const handleBook = async (e) => {
    e.preventDefault();
    
    // UI Guard check for 5 active reservations limit
    if (reservationCount >= 5) {
      alert("Reservation Limit Reached: A passenger can have a maximum of 5 active reservations. Please pay or complete outstanding tickets before making a new booking.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Sending the booking request to the backend via the centralized service
      const response = await bookTicket({
        passengerId,
        scheduleId: trainId, // Grabbing train/schedule ID
        coachType: bookingData.seatClass, // Mapping to coachType
        fromStationId: fromStationId,
        toStationId: toStationId,
        seatId: 15,
        travelDate: travelDate,
        ticketPrice: finalPrice
      });

      if (response.status === 202) {
        alert(`Notice: Coach class (${bookingData.seatClass}) is full. You have been placed on the waiting list at position #${response.data.queuePosition}.`);
        navigate("/passenger/tickets");
        return;
      }

      // Save calculated final price to localStorage so Payment screen reads the exact dynamic value
      const createdTicketId = response.data?.id || response.data?.reservationId || "temp";
      localStorage.setItem(`ticket_price_${createdTicketId}`, finalPrice.toFixed(2));

      // On success, send them to view their tickets
      navigate("/passenger/tickets");
    } catch (err) {
      console.error(err);
      if (err.response?.status === 409) {
        const backendMessage = err.response?.data?.message || "Limit exceeded.";
        setError(`Booking Conflict: ${backendMessage}`);
        alert("Booking Limit Exceeded: A passenger can have a maximum of 5 active reservations.");
      } else {
        setError(err.response?.data?.message || "Failed to book the ticket. Please try again.");
      }
    } finally {
      // Clean up local pricing references
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-slate-50 p-6 rounded-lg shadow-sm border border-slate-100">
      <h2 className="text-2xl font-bold mb-6 text-slate-800">
        Complete Your Booking
      </h2>

      {error && (
        <div className="mb-4 text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200">
          {error}
        </div>
      )}

      {reservationCount >= 5 && (
        <div className="mb-4 text-amber-800 text-sm bg-amber-50 p-3 rounded-md border border-amber-200">
          <strong>Warning:</strong> You currently have {reservationCount} reservations. You cannot exceed 5 active reservations.
        </div>
      )}

      <div className="mb-6 p-4 bg-blue-50 text-blue-800 rounded-md">
        <p className="font-semibold text-lg">{trainName}</p>
        <p className="text-sm mt-1">Route: <span className="font-medium">{fromStationName}</span> &rarr; <span className="font-medium">{toStationName}</span></p>
        <p className="text-sm">Departure Date: <span className="font-medium">{new Date(travelDate).toLocaleDateString()}</span></p>
        <p className="text-xs text-blue-600 mt-2">Current Active Bookings: {reservationCount} / 5</p>
      </div>

      <form onSubmit={handleBook} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Seat Class
          </label>
          <select
            className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500 bg-white"
            value={bookingData.seatClass}
            onChange={(e) =>
              setBookingData({ ...bookingData, seatClass: e.target.value })
            }
          >
            <option value="Economy">Economy ($100.00)</option>
            <option value="Business">Business ($200.00)</option>
            <option value="First Class">First Class ($300.00)</option>
          </select>
        </div>

        <div className="border-t border-slate-200 pt-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Passenger Loyalty & Dependent Status</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Your Loyalty Tier
              </label>
              <select
                className="w-full p-2 border border-slate-300 rounded bg-white text-sm"
                value={bookingData.loyaltyTier}
                disabled={bookingData.isDependent}
                onChange={(e) => {
                  setBookingData({ ...bookingData, loyaltyTier: e.target.value });
                  localStorage.setItem("passengerLoyaltyTier", e.target.value);
                }}
              >
                <option value="Regular">Regular (0% Off)</option>
                <option value="Green">Green (5% Off)</option>
                <option value="Silver">Silver (10% Off)</option>
                <option value="Gold">Gold (25% Off)</option>
              </select>
            </div>
            
            <div className="flex items-center mt-6">
              <input
                id="isDependent"
                type="checkbox"
                checked={bookingData.isDependent}
                onChange={(e) =>
                  setBookingData({ ...bookingData, isDependent: e.target.checked })
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
              />
              <label htmlFor="isDependent" className="ml-2 block text-sm text-slate-700 select-none">
                Booking for a Dependent (25% Off)
              </label>
            </div>
          </div>
        </div>

        {/* Dynamic Price Calculation Review */}
        <div className="border-t border-slate-200 pt-4 bg-white p-4 rounded-md shadow-inner">
          <h3 className="text-sm font-semibold text-slate-800 mb-2">Price Breakdown</h3>
          <div className="space-y-1 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>Base Price ({bookingData.seatClass}):</span>
              <span>${basePrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>Discount ({discountReason}):</span>
              <span>-${discountAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-800 text-base border-t pt-2 mt-2">
              <span>Total Price:</span>
              <span>${finalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || reservationCount >= 5}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded transition-colors disabled:bg-green-300 mt-4"
        >
          {loading ? "Processing..." : "Confirm Booking"}
        </button>
      </form>
    </div>
  );
}
