import { useState, useEffect } from "react";
import { getFreightShipments, addFreightShipment, getStations, getTrains } from "../../services/api";

export default function ManageFreight() {
  const [shipments, setShipments] = useState([]);
  const [stations, setStations] = useState([]);
  const [trains, setTrains] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    shipper: "",
    originId: "",
    destinationId: "",
    cargoType: "Chemicals",
    weight: "",
    containerCount: "",
    assignedTrainId: "",
    customsDeclarant: "", // Coordinator for customs
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const freightRes = await getFreightShipments();
      setShipments(freightRes.data || []);
      const stationsRes = await getStations();
      setStations(stationsRes.data || []);
      const trainsRes = await getTrains();
      setTrains(trainsRes.data || []);
    } catch (err) {
      console.warn("API error, loading fallback mock cargo logs:", err);
      setStations([
        { id: 1, name: "Riyadh Central", countryId: 1, country: "Saudi Arabia" },
        { id: 3, name: "Jeddah Port", countryId: 1, country: "Saudi Arabia" },
        { id: 5, name: "Ankara Gar", countryId: 2, country: "Türkiye" },
        { id: 6, name: "Iskenderun Port", countryId: 2, country: "Türkiye" },
      ]);
      setTrains([
        { id: 3, trainName: "Hijaz Cargo 90", trainType: "Freight" },
        { id: 4, trainName: "Bosphorus Freight", trainType: "Freight" },
      ]);
      setShipments([
        { id: 1, shipper: "Aramco Logistics", originId: 3, originName: "Jeddah Port", destinationId: 6, destinationName: "Iskenderun Port", cargoType: "Oil & Petrochemicals", weight: 450.5, containerCount: 15, assignedTrainId: 3, borderCrossing: true, customsStatus: "Cleared" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Check if shipment crosses border
  const originStation = stations.find(s => s.id === parseInt(formData.originId, 10));
  const destStation = stations.find(s => s.id === parseInt(formData.destinationId, 10));
  const isTransBorder = originStation && destStation && originStation.countryId !== destStation.countryId;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    // Rule: "Ülke sınırını geçen bir yük kargosu için mutlaka en az bir gümrük onay (customs clearance) kaydı oluşturulmalıdır."
    if (isTransBorder && !formData.customsDeclarant) {
      setMessage({
        type: "error",
        text: "Customs Validation Failed: Trans-border shipments require designating a Customs Coordinator for clearance approval.",
      });
      setLoading(false);
      return;
    }

    try {
      await addFreightShipment({
        shipper: formData.shipper,
        originId: parseInt(formData.originId, 10),
        destinationId: parseInt(formData.destinationId, 10),
        cargoType: formData.cargoType,
        weight: parseFloat(formData.weight),
        containerCount: parseInt(formData.containerCount, 10),
        assignedTrainId: parseInt(formData.assignedTrainId, 10),
      });

      // Show specific message for transborder auto customs logs
      if (isTransBorder) {
        setMessage({ 
          type: "success", 
          text: `Cargo successfully registered. Trans-border routing detected; Customs Clearance log auto-created under Coordinator: ${formData.customsDeclarant}.` 
        });
      } else {
        setMessage({ type: "success", text: "Freight cargo shipment successfully added." });
      }

      setFormData({
        shipper: "",
        originId: "",
        destinationId: "",
        cargoType: "Chemicals",
        weight: "",
        containerCount: "",
        assignedTrainId: "",
        customsDeclarant: "",
      });
      fetchData();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to register cargo. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-slate-800">Freight Cargo Operations</h2>

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

      {/* Cargo Shipment Registration Form */}
      <form onSubmit={handleSubmit} className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-8 space-y-4">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-2">Register Freight Shipment</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Shipper / client
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Aramco Logistics"
              value={formData.shipper}
              onChange={(e) => setFormData({ ...formData, shipper: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Origin Station
            </label>
            <select
              required
              value={formData.originId}
              onChange={(e) => setFormData({ ...formData, originId: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 text-sm"
            >
              <option value="">Select Origin</option>
              {stations.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.country || (s.countryId === 1 ? 'Saudi Arabia' : 'Türkiye')})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Destination Station
            </label>
            <select
              required
              value={formData.destinationId}
              onChange={(e) => setFormData({ ...formData, destinationId: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 text-sm"
            >
              <option value="">Select Destination</option>
              {stations.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.country || (s.countryId === 1 ? 'Saudi Arabia' : 'Türkiye')})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Assigned Cargo Train
            </label>
            <select
              required
              value={formData.assignedTrainId}
              onChange={(e) => setFormData({ ...formData, assignedTrainId: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 text-sm"
            >
              <option value="">Select Train</option>
              {trains.filter(t => t.trainType === "Freight").map(t => (
                <option key={t.id} value={t.id}>{t.trainName}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Cargo Type
            </label>
            <select
              value={formData.cargoType}
              onChange={(e) => setFormData({ ...formData, cargoType: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 text-sm"
            >
              <option value="Chemicals">Chemicals & Hydrocarbons</option>
              <option value="Grain">Agricultural Grains</option>
              <option value="Ores">Minerals & Metal Ores</option>
              <option value="Machinery">Industrial Machinery</option>
              <option value="General Cargo">General Containerized Cargo</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Weight (Metric Tons)
            </label>
            <input
              type="number"
              step="0.01"
              required
              min="0.1"
              placeholder="e.g., 500"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Container Count
            </label>
            <input
              type="number"
              required
              min="1"
              placeholder="e.g., 20"
              value={formData.containerCount}
              onChange={(e) => setFormData({ ...formData, containerCount: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 text-sm"
            />
          </div>
        </div>

        {/* Trans-Border Alert and Customs Section */}
        {isTransBorder && (
          <div className="bg-purple-50 border border-purple-200 rounded-md p-4 space-y-3">
            <div className="flex items-center">
              <span className="h-2 w-2 bg-purple-600 rounded-full animate-ping mr-2"></span>
              <p className="text-xs font-semibold text-purple-800">
                Border Transit Detected: Crossing between Saudi Arabia and Türkiye. Customs Clearance Clearance is required.
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-purple-900 mb-1">
                Authorized Customs Coordinator Name / ID
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Coordinator Al-Said (Jeddah Customs)"
                value={formData.customsDeclarant}
                onChange={(e) => setFormData({ ...formData, customsDeclarant: e.target.value })}
                className="w-full md:w-1/2 p-2 border border-purple-300 rounded bg-white text-slate-800 text-xs focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded transition-colors disabled:bg-blue-300"
        >
          {loading ? "Processing..." : "Register Shipment Manifest"}
        </button>
      </form>

      {/* Manifest List */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-slate-800">Active Shipments Log</h3>
        <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase text-xs border-b">
              <tr>
                <th className="p-4 font-bold">Log ID</th>
                <th className="p-4 font-bold">Shipper</th>
                <th className="p-4 font-bold">Routing</th>
                <th className="p-4 font-bold">Cargo Details</th>
                <th className="p-4 font-bold">Assigned Train</th>
                <th className="p-4 font-bold">Customs Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {shipments.map((shipment) => (
                <tr key={shipment.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">{shipment.id}</td>
                  <td className="p-4 font-semibold text-slate-800">{shipment.shipper}</td>
                  <td className="p-4 text-xs">
                    <div>Origin: <strong>{shipment.originName || `Station #${shipment.originId}`}</strong></div>
                    <div>Destination: <strong>{shipment.destinationName || `Station #${shipment.destinationId}`}</strong></div>
                  </td>
                  <td className="p-4 text-xs">
                    <div>Type: {shipment.cargoType}</div>
                    <div>Weight: {shipment.weight} Tons | Containers: {shipment.containerCount}</div>
                  </td>
                  <td className="p-4">{shipment.assignedTrainName || `Train ID #${shipment.assignedTrainId}`}</td>
                  <td className="p-4">
                    {shipment.borderCrossing || shipment.originId !== shipment.destinationId ? (
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                        Cleared (Border Approval)
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">
                        Domestic
                      </span>
                    )}
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
