import { useState, useEffect } from "react";
import { getStations, searchTrainsByRoute, getRouteDates } from "../../services/api";
import { useNavigate } from "react-router-dom";

export default function SearchTrains() {
  const navigate = useNavigate();

  // Core wizard states
  const [stations, setStations] = useState([]);
  const [fromStation, setFromStation] = useState("");
  const [toStation, setToStation] = useState("");

  const [trains, setTrains] = useState([]);
  const [selectedTrain, setSelectedTrain] = useState("");

  const [availableDates, setAvailableDates] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null); // stores { scheduleId, departureDate }

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Load all stations
  useEffect(() => {
    const fetchStations = async () => {
      try {
        const response = await getStations();
        setStations(response.data || []);
      } catch (err) {
        console.error("Failed to load stations:", err);
        setError("Could not load station options. Please try again.");
      }
    };
    fetchStations();
  }, []);

  // Action 1: When stations are chosen, search for trains operating on that route
  useEffect(() => {
    if (fromStation && toStation) {
      const fetchTrainsOnRoute = async () => {
        setLoading(true);
        setError("");
        setTrains([]);
        setSelectedTrain("");
        setAvailableDates([]);
        setSelectedSchedule(null);

        try {
          const response = await searchTrainsByRoute(fromStation, toStation);
          setTrains(response.data || []);
          if (response.data && response.data.length === 0) {
            setError("No active trains operate on this specific route.");
          }
        } catch (err) {
          console.error("Error fetching trains on route:", err);
          setError("Failed to fetch trains for this route.");
        } finally {
          setLoading(false);
        }
      };
      fetchTrainsOnRoute();
    } else {
      setTrains([]);
      setSelectedTrain("");
      setAvailableDates([]);
      setSelectedSchedule(null);
    }
  }, [fromStation, toStation]);

  // Action 2 & 3: When a train is selected, fetch the available scheduled dates
  const handleTrainSelect = async (trainId) => {
    setSelectedTrain(trainId);
    setAvailableDates([]);
    setSelectedSchedule(null);

    if (!trainId) return;

    setLoading(true);
    setError("");
    try {
      const response = await getRouteDates(trainId, fromStation, toStation);
      setAvailableDates(response.data || []);
      if (response.data && response.data.length === 0) {
        setError("This train has no upcoming scheduled dates on this route.");
      }
    } catch (err) {
      console.error("Error fetching dates:", err);
      setError("Failed to load scheduled dates for the selected train.");
    } finally {
      setLoading(false);
    }
  };

  // Action 4: Proceed to final booking details
  const handleProceed = () => {
    if (!selectedSchedule || !fromStation || !toStation || !selectedTrain) return;

    const fromStationObj = stations.find((s) => s.name === fromStation);
    const toStationObj = stations.find((s) => s.name === toStation);
    const trainObj = trains.find((t) => Number(t.trainId) === Number(selectedTrain));

    navigate(`/passenger/book/${selectedSchedule.scheduleId}`, {
      state: {
        fromStationId: fromStationObj?.id,
        toStationId: toStationObj?.id,
        travelDate: selectedSchedule.departureDate,
        fromStationName: fromStation,
        toStationName: toStation,
        trainName: trainObj?.trainName || "Express Train",
      },
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold mb-2 text-slate-800">Book Your Journey</h2>
      <p className="text-slate-500 mb-8">Follow the guided steps below to search routes, trains, and select available travel dates.</p>

      {error && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* STEP 1: SELECT STATIONS */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">1</span>
            <h3 className="font-semibold text-lg text-slate-800">Select Route</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">From (Departure Station)</label>
              <select
                value={fromStation}
                onChange={(e) => setFromStation(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-800 outline-none transition-all"
              >
                <option value="">Choose Departure Station</option>
                {stations.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name} ({s.country || "Station"})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">To (Destination Station)</label>
              <select
                value={toStation}
                onChange={(e) => setToStation(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-800 outline-none transition-all"
                disabled={!fromStation}
              >
                <option value="">Choose Destination Station</option>
                {stations
                  .filter((s) => s.name !== fromStation)
                  .map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.country || "Station"})
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        {/* STEP 2: CHOOSE TRAIN */}
        <div className={`bg-white p-6 rounded-xl border border-slate-100 shadow-sm transition-all ${(!fromStation || !toStation) ? "opacity-50 pointer-events-none" : ""}`}>
          <div className="flex items-center space-x-3 mb-4">
            <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">2</span>
            <h3 className="font-semibold text-lg text-slate-800">Select Available Train</h3>
          </div>
          {loading && trains.length === 0 ? (
            <p className="text-slate-500 text-sm animate-pulse">Searching for trains operating on this route...</p>
          ) : trains.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {trains.map((t) => (
                <div
                  key={t.trainId}
                  onClick={() => handleTrainSelect(t.trainId)}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    Number(selectedTrain) === Number(t.trainId)
                      ? "border-blue-600 bg-blue-50 text-blue-900 shadow-sm"
                      : "border-slate-100 hover:border-slate-300 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-base">{t.trainName}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Route Passenger Express</p>
                    </div>
                    {Number(selectedTrain) === Number(t.trainId) && (
                      <span className="text-xs font-semibold bg-blue-600 text-white px-2 py-0.5 rounded-full">Selected</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm italic">Please complete Step 1 to load operating trains.</p>
          )}
        </div>

        {/* STEP 3: SELECT SCHEDULED DATE */}
        <div className={`bg-white p-6 rounded-xl border border-slate-100 shadow-sm transition-all ${(!selectedTrain) ? "opacity-50 pointer-events-none" : ""}`}>
          <div className="flex items-center space-x-3 mb-4">
            <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">3</span>
            <h3 className="font-semibold text-lg text-slate-800">Choose Departure Date</h3>
          </div>
          {loading && availableDates.length === 0 ? (
            <p className="text-slate-500 text-sm animate-pulse">Loading scheduled dates...</p>
          ) : availableDates.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {availableDates.map((d) => {
                const dateStr = new Date(d.departureDate).toLocaleDateString(undefined, {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });
                const isSelected = selectedSchedule?.scheduleId === d.scheduleId;
                return (
                  <div
                    key={d.scheduleId}
                    onClick={() => setSelectedSchedule(d)}
                    className={`p-4 border-2 rounded-xl cursor-pointer text-center transition-all ${
                      isSelected
                        ? "border-green-600 bg-green-50 text-green-900 shadow-sm"
                        : "border-slate-100 hover:border-slate-300 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <p className="font-bold text-sm">{dateStr}</p>
                    <p className="text-xs text-slate-500 mt-1">Ref ID: #{d.scheduleId}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-400 text-sm italic">Please select an operating train in Step 2 to view scheduled dates.</p>
          )}
        </div>

        {/* STEP 4: PROCEED TO BOOKING */}
        <div className={`pt-4 transition-all ${(!selectedSchedule) ? "opacity-50 pointer-events-none" : ""}`}>
          <button
            onClick={handleProceed}
            disabled={!selectedSchedule}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md hover:shadow-lg text-center"
          >
            Confirm Date & Proceed to Book Seat
          </button>
        </div>
      </div>
    </div>
  );
}
