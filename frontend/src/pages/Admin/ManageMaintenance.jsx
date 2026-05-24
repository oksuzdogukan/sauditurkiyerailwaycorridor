import { useState, useEffect } from "react";
import { getMaintenanceRecords, addMaintenanceRecord, getTrains, getStations } from "../../services/api";

export default function ManageMaintenance() {
  const [records, setRecords] = useState([]);
  const [trains, setTrains] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    targetType: "Train", // Train, Station, Track
    targetId: "", // trainId or stationId or trackId
    maintenanceType: "Routine Check",
    description: "",
    startDate: new Date().toISOString().split('T')[0],
    technicianId: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const recordsRes = await getMaintenanceRecords();
      setRecords(recordsRes.data || []);
      const trainsRes = await getTrains();
      setTrains(trainsRes.data || []);
      const stationsRes = await getStations();
      setStations(stationsRes.data || []);
    } catch (err) {
      console.warn("API error, loading mock maintenance history logs:", err);
      setTrains([
        { id: 1, trainName: "Haramain Express" },
        { id: 2, trainName: "Ankara Express" },
      ]);
      setStations([
        { id: 1, name: "Riyadh Central" },
        { id: 5, name: "Ankara Gar" },
      ]);
      setRecords([
        { id: 1, targetType: "Train", targetId: 1, targetName: "Haramain Express", maintenanceType: "Routine Check", description: "Biannual high-speed motor check.", startDate: "2026-05-15", technicianId: "TECH-101" },
        { id: 2, targetType: "Track", targetId: "Sector-SA4", targetName: "Sector-SA4 (Tabuk Sector)", maintenanceType: "Track maintenance", description: "Rail alignment validation.", startDate: "2026-05-20", technicianId: "TECH-204" },
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
        targetType: formData.targetType,
        maintenanceType: formData.maintenanceType,
        description: formData.description,
        startDate: formData.startDate,
        technicianId: formData.technicianId,
      };

      // Map corresponding target ID field based on type
      if (formData.targetType === "Train") {
        payload.trainId = parseInt(formData.targetId, 10);
      } else if (formData.targetType === "Station") {
        payload.stationId = parseInt(formData.targetId, 10);
      } else {
        payload.trackId = formData.targetId; // Track sector strings
      }

      await addMaintenanceRecord(payload);

      setMessage({ type: "success", text: "Maintenance scheduling successfully logged." });
      setFormData({
        targetType: "Train",
        targetId: "",
        maintenanceType: "Routine Check",
        description: "",
        startDate: new Date().toISOString().split('T')[0],
        technicianId: "",
      });
      fetchData();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to log maintenance check. Please verify input.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-slate-800">Maintenance Operations</h2>

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

      {/* Maintenance Form */}
      <form onSubmit={handleSubmit} className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-8 space-y-4">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-2">Schedule Maintenance Record</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Target Asset Type
            </label>
            <select
              value={formData.targetType}
              onChange={(e) => setFormData({ ...formData, targetType: e.target.value, targetId: "" })}
              className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 text-sm"
            >
              <option value="Train">Train Fleet Unit</option>
              <option value="Station">Railway Station</option>
              <option value="Track">Track Infrastructure</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Select Specific Asset
            </label>
            {formData.targetType === "Train" && (
              <select
                required
                value={formData.targetId}
                onChange={(e) => setFormData({ ...formData, targetId: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 text-sm"
              >
                <option value="">Select Train</option>
                {trains.map(t => (
                  <option key={t.id} value={t.id}>{t.trainName}</option>
                ))}
              </select>
            )}
            {formData.targetType === "Station" && (
              <select
                required
                value={formData.targetId}
                onChange={(e) => setFormData({ ...formData, targetId: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 text-sm"
              >
                <option value="">Select Station</option>
                {stations.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}
            {formData.targetType === "Track" && (
              <input
                type="text"
                required
                placeholder="e.g., Sector-SA4 (Tabuk)"
                value={formData.targetId}
                onChange={(e) => setFormData({ ...formData, targetId: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 text-sm"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Technician ID
            </label>
            <input
              type="text"
              required
              placeholder="e.g., TECH-99"
              value={formData.technicianId}
              onChange={(e) => setFormData({ ...formData, technicianId: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Maintenance Type
            </label>
            <select
              value={formData.maintenanceType}
              onChange={(e) => setFormData({ ...formData, maintenanceType: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 text-sm"
            >
              <option value="Routine Check">Routine Inspection</option>
              <option value="Engine Repair">Engine/Motor Overhaul</option>
              <option value="Track maintenance">Track Infrastructure Maintenance</option>
              <option value="Wheel Replacements">Wheel/Suspension Replacements</option>
              <option value="Customs Approval Facility">Customs Area Check</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              required
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Task Description
          </label>
          <textarea
            required
            rows="3"
            placeholder="Describe maintenance issues, actions, and remarks..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 text-sm"
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded transition-colors disabled:bg-blue-300"
        >
          {loading ? "Scheduling..." : "Submit Maintenance Log"}
        </button>
      </form>

      {/* History Log Table */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-slate-800">Maintenance Records History</h3>
        <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase text-xs border-b">
              <tr>
                <th className="p-4 font-bold">Record ID</th>
                <th className="p-4 font-bold">Asset Type</th>
                <th className="p-4 font-bold">Asset Name / ID</th>
                <th className="p-4 font-bold">Check Type</th>
                <th className="p-4 font-bold">Log Details</th>
                <th className="p-4 font-bold">Tech ID</th>
                <th className="p-4 font-bold">Start Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {records.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">{rec.id}</td>
                  <td className="p-4 font-semibold capitalize text-slate-800">{rec.targetType}</td>
                  <td className="p-4 font-medium">
                    {rec.targetName || `${rec.targetType} ID: ${rec.targetId}`}
                  </td>
                  <td className="p-4 text-xs font-semibold">
                    <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded">
                      {rec.maintenanceType}
                    </span>
                  </td>
                  <td className="p-4 text-xs max-w-xs truncate">{rec.description}</td>
                  <td className="p-4 font-mono text-xs">{rec.technicianId}</td>
                  <td className="p-4 font-medium">{rec.startDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
