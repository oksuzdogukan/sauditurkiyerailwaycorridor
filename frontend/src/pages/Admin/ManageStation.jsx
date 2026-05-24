import { useState, useEffect } from "react";
import { getStations, addStation, getRoutes, addRoute } from "../../services/api";

export default function ManageStations() {
  const [activeTab, setActiveTab] = useState("stations");
  const [stations, setStations] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Station Form State
  const [stationForm, setStationForm] = useState({
    name: "",
    stationType: "passenger",
    countryId: "1", // 1 for Saudi Arabia, 2 for Türkiye
  });

  // Route Form State
  const [routeForm, setRouteForm] = useState({
    startStationId: "",
    endStationId: "",
    distance: "",
    maxSpeed: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const stationsRes = await getStations();
      setStations(stationsRes.data || []);
      
      const routesRes = await getRoutes();
      setRoutes(routesRes.data || []);
    } catch (err) {
      console.warn("API error, using mock data for demonstration:", err);
      // Fallback Mock Data
      setStations([
        { id: 1, name: "Riyadh Central", stationType: "passenger", countryId: 1, country: "Saudi Arabia" },
        { id: 2, name: "Medinah Terminus", stationType: "passenger", countryId: 1, country: "Saudi Arabia" },
        { id: 3, name: "Jeddah Port", stationType: "port", countryId: 1, country: "Saudi Arabia" },
        { id: 4, name: "Tabuk Border Crossing", stationType: "border", countryId: 1, country: "Saudi Arabia" },
        { id: 5, name: "Ankara Gar", stationType: "passenger", countryId: 2, country: "Türkiye" },
        { id: 6, name: "Iskenderun Port", stationType: "port", countryId: 2, country: "Türkiye" },
      ]);
      setRoutes([
        { id: 1, startStationId: 1, endStationId: 2, startStationName: "Riyadh Central", endStationName: "Medinah Terminus", distance: 450, maxSpeed: 300 },
        { id: 2, startStationId: 3, endStationId: 4, startStationName: "Jeddah Port", endStationName: "Tabuk Border Crossing", distance: 900, maxSpeed: 160 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStationSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      await addStation({
        name: stationForm.name,
        stationType: stationForm.stationType,
        countryId: parseInt(stationForm.countryId, 10),
      });
      setMessage({ type: "success", text: "Station successfully added." });
      setStationForm({ name: "", stationType: "passenger", countryId: "1" });
      fetchData();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to add station. Please try again.",
      });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRouteSubmit = async (e) => {
    e.preventDefault();
    
    if (routeForm.startStationId === routeForm.endStationId) {
      setMessage({ type: "error", text: "Start and End stations cannot be the same." });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      await addRoute({
        startStationId: parseInt(routeForm.startStationId, 10),
        endStationId: parseInt(routeForm.endStationId, 10),
        distance: parseFloat(routeForm.distance),
        maxSpeed: parseInt(routeForm.maxSpeed, 10),
      });
      setMessage({ type: "success", text: "Route successfully created." });
      setRouteForm({ startStationId: "", endStationId: "", distance: "", maxSpeed: "" });
      fetchData();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to create route. Please try again.",
      });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-slate-800">Manage Network</h2>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6">
        <button
          onClick={() => { setActiveTab("stations"); setMessage({ type: "", text: "" }); }}
          className={`py-3 px-6 font-semibold border-b-2 transition-colors ${
            activeTab === "stations"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Stations
        </button>
        <button
          onClick={() => { setActiveTab("routes"); setMessage({ type: "", text: "" }); }}
          className={`py-3 px-6 font-semibold border-b-2 transition-colors ${
            activeTab === "routes"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Routes
        </button>
      </div>

      {message.text && (
        <div
          className={`mb-6 p-3 rounded border text-sm ${
            message.type === "success" 
              ? "bg-green-50 text-green-800 border-green-200" 
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Station Panel */}
      {activeTab === "stations" && (
        <div>
          {/* Add Station Form */}
          <form
            onSubmit={handleStationSubmit}
            className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-8 grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Station Name
              </label>
              <input
                type="text"
                required
                value={stationForm.name}
                onChange={(e) => setStationForm({ ...stationForm, name: e.target.value })}
                placeholder="e.g., Tabuk Crossing"
                className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Station Type
              </label>
              <select
                value={stationForm.stationType}
                onChange={(e) => setStationForm({ ...stationForm, stationType: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800"
              >
                <option value="passenger">Passenger Station</option>
                <option value="freight">Freight Yard</option>
                <option value="port">Sea Port Link</option>
                <option value="customs">Customs Checkpoint</option>
                <option value="border">Border Crossing</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Country
              </label>
              <select
                value={stationForm.countryId}
                onChange={(e) => setStationForm({ ...stationForm, countryId: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800"
              >
                <option value="1">Saudi Arabia</option>
                <option value="2">Türkiye</option>
                <option value="3">Jordan</option>
                <option value="4">Syria</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded transition-colors disabled:bg-blue-300"
            >
              {loading ? "Saving..." : "Add Station"}
            </button>
          </form>

          {/* Station List */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-slate-800">Station Directory</h3>
            <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase text-xs border-b">
                  <tr>
                    <th className="p-4 font-bold">ID</th>
                    <th className="p-4 font-bold">Name</th>
                    <th className="p-4 font-bold">Type</th>
                    <th className="p-4 font-bold">Country</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {stations.map((station) => (
                    <tr key={station.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">{station.id}</td>
                      <td className="p-4 font-semibold text-slate-800">{station.name}</td>
                      <td className="p-4 capitalize">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                          station.stationType === 'border' ? 'bg-amber-100 text-amber-800' :
                          station.stationType === 'customs' ? 'bg-purple-100 text-purple-800' :
                          station.stationType === 'freight' ? 'bg-orange-100 text-orange-800' :
                          station.stationType === 'port' ? 'bg-teal-100 text-teal-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {station.stationType}
                        </span>
                      </td>
                      <td className="p-4">{station.countryId === 2 || station.country === "Türkiye" ? "Türkiye" : "Saudi Arabia"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Route Panel */}
      {activeTab === "routes" && (
        <div>
          {/* Add Route Form */}
          <form
            onSubmit={handleRouteSubmit}
            className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-8 grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Start Station
              </label>
              <select
                required
                value={routeForm.startStationId}
                onChange={(e) => setRouteForm({ ...routeForm, startStationId: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800"
              >
                <option value="">Select Station</option>
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                End Station
              </label>
              <select
                required
                value={routeForm.endStationId}
                onChange={(e) => setRouteForm({ ...routeForm, endStationId: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800"
              >
                <option value="">Select Station</option>
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Distance (km)
              </label>
              <input
                type="number"
                required
                min="1"
                value={routeForm.distance}
                onChange={(e) => setRouteForm({ ...routeForm, distance: e.target.value })}
                placeholder="e.g., 450"
                className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Max Allowed Speed (km/h)
              </label>
              <input
                type="number"
                required
                min="50"
                value={routeForm.maxSpeed}
                onChange={(e) => setRouteForm({ ...routeForm, maxSpeed: e.target.value })}
                placeholder="e.g., 250"
                className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded transition-colors disabled:bg-blue-300"
            >
              {loading ? "Creating..." : "Create Route"}
            </button>
          </form>

          {/* Route List */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-slate-800">Route Map</h3>
            <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase text-xs border-b">
                  <tr>
                    <th className="p-4 font-bold">Route ID</th>
                    <th className="p-4 font-bold">Start Station</th>
                    <th className="p-4 font-bold">End Station</th>
                    <th className="p-4 font-bold">Distance</th>
                    <th className="p-4 font-bold">Max Speed</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {routes.map((route) => (
                    <tr key={route.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">{route.id}</td>
                      <td className="p-4 font-semibold text-slate-800">
                        {route.startStationName || `Station #${route.startStationId}`}
                      </td>
                      <td className="p-4 font-semibold text-slate-800">
                        {route.endStationName || `Station #${route.endStationId}`}
                      </td>
                      <td className="p-4">{route.distance} km</td>
                      <td className="p-4">{route.maxSpeed} km/h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
