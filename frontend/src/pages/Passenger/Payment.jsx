import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { processPayment } from "../../services/api";

export default function Payment() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Retrieve the dynamically calculated ticket price stored during booking, or default to 150.00
  const ticketPrice = localStorage.getItem(`ticket_price_${ticketId}`) || "150.00";

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await processPayment({ 
        reservationId: ticketId, 
        amount: parseFloat(ticketPrice), 
        paymentMethod: "Credit Card" 
      }); // Using processPayment service function aligned with backend body contract
      
      // Clean up saved ticket price
      localStorage.removeItem(`ticket_price_${ticketId}`);

      alert("Payment successful!");
      navigate("/passenger/tickets");
    } catch (err) {
      console.error(err);
      alert("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-slate-50 p-6 rounded-lg shadow-sm border border-slate-100">
      <h2 className="text-2xl font-bold mb-6 text-slate-800">Checkout</h2>

      <div className="mb-6 p-4 bg-yellow-50 text-yellow-800 rounded-md border border-yellow-200">
        <p className="font-semibold">Paying for Ticket Ref: #{ticketId}</p>
        <p className="text-sm mt-1">
          Total: <strong>${ticketPrice}</strong>
        </p>
      </div>

      <form onSubmit={handlePayment} className="space-y-4">
        {/* Dummy Payment Fields */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Card Number
          </label>
          <input
            type="text"
            placeholder="XXXX XXXX XXXX XXXX"
            required
            className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Expiry
            </label>
            <input
              type="text"
              placeholder="MM/YY"
              required
              className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              CVC
            </label>
            <input
              type="text"
              placeholder="123"
              required
              className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-4 rounded transition-colors disabled:bg-slate-400 mt-4"
        >
          {loading ? "Processing Payment..." : "Pay Securely"}
        </button>
      </form>
    </div>
  );
}
