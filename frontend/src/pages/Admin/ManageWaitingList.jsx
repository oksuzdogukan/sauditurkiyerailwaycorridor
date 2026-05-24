import { useState, useEffect } from "react";
import { getWaitingListReport } from "../../services/api";

export default function ManageWaitingList() {
  const [waitingList, setWaitingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterTrain, setFilterTrain] = useState("");

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await getWaitingListReport();
        setWaitingList(response.data || []);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch the waiting list report.");
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  const uniqueTrains = [...new Set(waitingList.map((item) => item.trainName).filter(Boolean))];

  const filteredList = waitingList.filter((item) => {
    if (filterTrain && item.trainName !== filterTrain) return false;
    return true;
  });

  if (loading) return <div className="text-slate-500 text-sm p-4">Loading waiting list report...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Waiting List Queue</h2>
          <p className="text-sm text-slate-500">Report #4: View waitlisted passengers sorted by Train, Travel Date, and Loyalty Tier priority.</p>
        </div>

        {/* Filter Controls */}
        <div>
          <select
            value={filterTrain}
            onChange={(e) => setFilterTrain(e.target.value)}
            className="p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 outline-none text-slate-700"
          >
            <option value="">All Trains</option>
            {uniqueTrains.map((trainName) => (
              <option key={trainName} value={trainName}>
                {trainName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      {filteredList.length === 0 ? (
        <div className="text-center p-8 bg-slate-50 rounded-xl border border-slate-100 text-slate-400 italic">
          No waitlisted passengers matching the criteria.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase border-b border-slate-100">
                  <th className="py-4 px-6 text-center">Pos</th>
                  <th className="py-4 px-6">Passenger Name</th>
                  <th className="py-4 px-6">Loyalty Class</th>
                  <th className="py-4 px-6">Train Name</th>
                  <th className="py-4 px-6">Coach Class</th>
                  <th className="py-4 px-6">Travel Date</th>
                  <th className="py-4 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {filteredList.map((item) => {
                  // Loyalty Tier Badges
                  const loyaltyColors = {
                    Gold: "bg-yellow-100 text-yellow-800 border-yellow-200",
                    Silver: "bg-slate-100 text-slate-800 border-slate-200",
                    Green: "bg-green-100 text-green-800 border-green-200",
                    Regular: "bg-slate-50 text-slate-600 border-slate-100",
                  };
                  const loyaltyBadge = loyaltyColors[item.loyaltyClass] || loyaltyColors.Regular;

                  // Status Badges
                  const statusColors = {
                    Waiting: "bg-amber-100 text-amber-800 border-amber-200",
                    Promoted: "bg-blue-100 text-blue-800 border-blue-200",
                    Canceled: "bg-rose-100 text-rose-800 border-rose-200",
                  };
                  const statusBadge = statusColors[item.status] || "bg-slate-50 text-slate-600 border-slate-100";

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 text-center font-bold text-slate-500">
                        #{item.queuePosition}
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-800">
                        {item.passengerName}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${loyaltyBadge}`}>
                          {item.loyaltyClass || "Regular"}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {item.trainName || "N/A"}
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-600">
                        {item.coachType}
                      </td>
                      <td className="py-4 px-6">
                        {new Date(item.travelDate).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusBadge}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
