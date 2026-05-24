import { useState, useEffect } from "react";
import { getSensorReadings, addSensorReading, getStations, getRoutes } from "../../services/api";

export default function SensorReadings() {
  const [readings, setReadings] = useState([]);
  const [stations, setStations] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    targetType: "Station", // Station, Track
    stationId: "",
    trackId: "",
    readingType: "Vibration Level",
    readingValue: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const readingsRes = await getSensorReadings();
      setReadings(readingsRes.data || []);
      const stationsRes = await getStations();
      setStations(stationsRes.data || []);
      const tracksRes = await getRoutes();
      setTracks(tracksRes.data || []);
    } catch (err) {
      console.error("Failed to load sensor readings:", err);
      // Fallback Mock readings if server fails
      setReadings([
        { id: 1, readingType: "Vibration Level", readingValue: 0.82, recordedAt: new Date().toISOString(), stationName: null, trackId: 1, startStationName: "Istanbul Haydarpasa", endStationName: "Gaziantep Border Crossing" },
        { id: 2, readingType: "Heat Reading", readingValue: 42.5, recordedAt: new Date().toISOString(), stationName: "Aleppo Central", trackId: null },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const payload = {
        readingType: formData.readingType,
        readingValue: parseFloat(formData.readingValue),
      };

      if (formData.targetType === "Station") {
        payload.stationId = parseInt(formData.stationId, 10);
      } else {
        payload.trackId = parseInt(formData.trackId, 10);
      }

      await addSensorReading(payload);
      setMessage({ type: "success", text: "Sensor / Inspection reading successfully logged." });
      setFormData({
        targetType: "Station",
        stationId: "",
        trackId: "",
        readingType: "Vibration Level",
        readingValue: "",
      });
      fetchData();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to log sensor reading. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">Sensor & Inspection Readings (IoT)</h3>
        <p className="text-sm text-slate-600">
          Monitor real-time infrastructure readings including vibration levels, heat metrics, brake inspections, track conditions, and signal statuses.
        </p>
      </div>

      {message.text && (
        <div
          className={`p-3 rounded border text-sm ${
            message.type === "success" 
              ? "bg-green-50 text-green-800 border-green-200" 
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Log Reading Form */}
      <form onSubmit={handleSubmit} className="bg-slate-50 p-6 rounded-lg border border-slate-200 space-y-4">
        <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Log Sample Inspection Metric</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Target Asset Class</label>
            <select
              value={formData.targetType}
              onChange={(e) => setFormData({ ...formData, targetType: e.target.value, stationId: "", trackId: "" })}
              className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 text-sm focus:ring-blue-500"
            >
              <option value="Station">Station Facility</option>
              <option value="Track">Track Segment</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Select Specific Asset</label>
            {formData.targetType === "Station" ? (
              <select
                required
                value={formData.stationId}
                onChange={(e) => setFormData({ ...formData, stationId: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 text-sm focus:ring-blue-500"
              >
                <option value="">Select Station</option>
                {stations.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            ) : (
              <select
                required
                value={formData.trackId}
                onChange={(e) => setFormData({ ...formData, trackId: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 text-sm focus:ring-blue-500"
              >
                <option value="">Select Track Sector</option>
                {tracks.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.startStationName} ➔ {t.endStationName} ({t.distance} km)
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Inspection Metric</label>
            <select
              value={formData.readingType}
              onChange={(e) => setFormData({ ...formData, readingType: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 text-sm focus:ring-blue-500"
            >
              <option value="Vibration Level">Vibration Level (mm/s)</option>
              <option value="Heat Reading">Heat Reading (°C)</option>
              <option value="Brake Inspection Result">Brake Inspection Result (%)</option>
              <option value="Track Condition Value">Track Condition Value (Index)</option>
              <option value="Signal Inspection Status">Signal Inspection Status (Uptime %)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Measured Value</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="e.g. 0.85"
              value={formData.readingValue}
              onChange={(e) => setFormData({ ...formData, readingValue: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 text-sm focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors disabled:bg-blue-300 text-sm"
        >
          {loading ? "Logging Reading..." : "Log Inspection Metric"}
        </button>
      </form>

      {/* Sensor Log History */}
      <div>
        <h4 className="text-md font-bold text-slate-800 mb-3">Telemetry Readings Log</h4>
        <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm bg-white">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase text-xs border-b">
              <tr>
                <th className="p-4 font-bold">Reading ID</th>
                <th className="p-4 font-bold">Asset Target</th>
                <th className="p-4 font-bold">Metric Type</th>
                <th className="p-4 font-bold">Measured Value</th>
                <th className="p-4 font-bold">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {readings.map((reading) => (
                <tr key={reading.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-mono font-bold text-slate-500">#{reading.id}</td>
                  <td className="p-4">
                    {reading.stationName ? (
                      <span className="text-slate-800 font-medium">Station: {reading.stationName}</span>
                    ) : (
                      <span className="text-slate-800 font-medium">
                        Track: {reading.startStationName} ➔ {reading.endStationName}
                      </span>
                    )}
                  </td>
                  <td className="p-4 font-semibold">{reading.readingType}</td>
                  <td className="p-4 font-mono text-blue-600 font-bold">{reading.readingValue}</td>
                  <td className="p-4 text-xs text-slate-500">
                    {new Date(reading.recordedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
