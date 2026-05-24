import { useState } from "react";
import { cancelExpiredReservations, updateLoyaltyTiers, updateWaitingList } from "../../services/api";

export default function AutomatedTasks() {
  const [loadingTask, setLoadingTask] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Waiting list evaluation state
  const [waitingListParams, setWaitingListParams] = useState({
    scheduleId: "",
    travelDate: "",
    coachType: "Economy",
  });

  const handleCancelExpired = async () => {
    setLoadingTask("Ticket Cleanup");
    setMessage({ type: "", text: "" });
    try {
      await cancelExpiredReservations();
      setMessage({
        type: "success",
        text: "Clean Up Expired Tickets job executed successfully. All unpaid expired reservations were cancelled.",
      });
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to execute Ticket Cleanup." });
    } finally {
      setLoadingTask(null);
    }
  };

  const handleUpdateLoyalty = async () => {
    setLoadingTask("Loyalty Update");
    setMessage({ type: "", text: "" });
    try {
      await updateLoyaltyTiers();
      setMessage({
        type: "success",
        text: "Loyalty Tier Engine execution finished. All passenger tiers (Green, Silver, Gold) updated based on total miles.",
      });
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to execute Loyalty Update." });
    } finally {
      setLoadingTask(null);
    }
  };

  const handleUpdateWaitingList = async (e) => {
    e.preventDefault();
    setLoadingTask("Waiting List Sync");
    setMessage({ type: "", text: "" });

    try {
      await updateWaitingList({
        scheduleId: parseInt(waitingListParams.scheduleId, 10),
        travelDate: waitingListParams.travelDate,
        coachType: waitingListParams.coachType,
      });
      setMessage({
        type: "success",
        text: `Waiting list evaluated for Schedule #${waitingListParams.scheduleId} on ${waitingListParams.travelDate} (${waitingListParams.coachType}). Eligible passengers upgraded.`,
      });
      setWaitingListParams({ scheduleId: "", travelDate: "", coachType: "Economy" });
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to process Waiting List sync." });
    } finally {
      setLoadingTask(null);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-slate-800">System Tasks & Operations</h2>

      {message.text && (
        <div
          className={`mb-6 p-4 rounded border text-sm ${
            message.type === "success" 
              ? "bg-green-50 text-green-800 border-green-200" 
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Task 1 */}
        <div className="border border-slate-200 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              Clean Up Expired Tickets
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Scans the database and cancels all pending reservations that have
              exceeded their payment window (unpaid expired).
            </p>
          </div>
          <button
            onClick={handleCancelExpired}
            disabled={loadingTask !== null}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded transition-colors disabled:bg-indigo-300 mt-4"
          >
            {loadingTask === "Ticket Cleanup" ? "Running Cleanup..." : "Run Cleanup Job"}
          </button>
        </div>

        {/* Task 2 */}
        <div className="border border-slate-200 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              Update Loyalty Tiers
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Recalculates passenger loyalty classes based on total miles:
              Green (10k+ miles, 5% off), Silver (50k+ miles, 10% off), Gold (100k+ miles, 25% off).
            </p>
          </div>
          <button
            onClick={handleUpdateLoyalty}
            disabled={loadingTask !== null}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded transition-colors disabled:bg-indigo-300 mt-4"
          >
            {loadingTask === "Loyalty Update" ? "Running Loyalty Engine..." : "Run Loyalty Engine"}
          </button>
        </div>

        {/* Task 3 */}
        <div className="border border-slate-200 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800 mb-2">
            Waiting List Evaluation
          </h3>
          <p className="text-xs text-slate-600 mb-4">
            If tickets become available (e.g., due to cancellation), runs evaluation to promote waitlisted passengers.
          </p>
          
          <form onSubmit={handleUpdateWaitingList} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-0.5">Schedule ID</label>
              <input
                type="number"
                required
                value={waitingListParams.scheduleId}
                onChange={(e) => setWaitingListParams({ ...waitingListParams, scheduleId: e.target.value })}
                placeholder="e.g., 1"
                className="w-full p-1.5 border rounded text-xs bg-white text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-0.5">Travel Date</label>
              <input
                type="date"
                required
                value={waitingListParams.travelDate}
                onChange={(e) => setWaitingListParams({ ...waitingListParams, travelDate: e.target.value })}
                className="w-full p-1.5 border rounded text-xs bg-white text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-0.5">Coach Type</label>
              <select
                value={waitingListParams.coachType}
                onChange={(e) => setWaitingListParams({ ...waitingListParams, coachType: e.target.value })}
                className="w-full p-1.5 border rounded text-xs bg-white text-slate-800"
              >
                <option value="Economy">Economy</option>
                <option value="Business">Business</option>
                <option value="First Class">First Class</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loadingTask !== null}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded transition-colors disabled:bg-indigo-300 text-xs mt-2"
            >
              {loadingTask === "Waiting List Sync" ? "Processing Sync..." : "Sync Waiting List"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
