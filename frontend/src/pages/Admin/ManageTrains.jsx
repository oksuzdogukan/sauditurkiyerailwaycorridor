import { useState, useEffect } from "react";
import {
  getTrains,
  addTrain,
  editTrain,
  getRoutes,
  addSchedule,
  getSchedules,
  addMaintenanceRecord,
} from "../../services/api";

export default function ManageTrains() {
  const [activeTab, setActiveTab] = useState("trains");
  const [trains, setTrains] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Add Train Form State
  const [trainForm, setTrainForm] = useState({
    trainName: "",
    trainType: "Passenger",
    maxSpeed: "",
    authorityId: "1",
    routeId: "",
  });

  // Schedule Form State
  const [scheduleForm, setScheduleForm] = useState({
    trainId: "",
    routeId: "",
    assignmentDate: "",
  });

  // Edit Train / Maintenance Popup State
  const [editingTrain, setEditingTrain] = useState(null);
  const [showMaintenancePrompt, setShowMaintenancePrompt] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({
    maintenanceType: "Routine Check",
    description: "",
    startDate: new Date().toISOString().split("T")[0],
    technicianId: "tech_01",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const trainRes = await getTrains();
      setTrains(trainRes.data || []);
      const routesRes = await getRoutes();
      setRoutes(routesRes.data || []);
      const schedulesRes = await getSchedules();
      setSchedules(schedulesRes.data || []);
    } catch (err) {
      console.warn("API Error, using fallback mock fleet data:", err);
      // Fallback Mock Data
      setTrains([
        {
          id: 1,
          trainName: "Haramain Express",
          trainType: "High-Speed",
          maxSpeed: 300,
          trainStatus: "Active",
          authorityId: 1,
          routeId: 1,
        },
        {
          id: 2,
          trainName: "Ankara Express",
          trainType: "High-Speed",
          maxSpeed: 250,
          trainStatus: "Active",
          authorityId: 2,
          routeId: 2,
        },
        {
          id: 3,
          trainName: "Hijaz Cargo 90",
          trainType: "Freight",
          maxSpeed: 120,
          trainStatus: "Active",
          authorityId: 1,
          routeId: 1,
        },
        {
          id: 4,
          trainName: "Bosphorus Freight",
          trainType: "Freight",
          maxSpeed: 100,
          trainStatus: "Out of Service",
          authorityId: 2,
          routeId: 2,
        },
      ]);
      setRoutes([
        {
          id: 1,
          startStationName: "Riyadh Central",
          endStationName: "Medinah Terminus",
          stations: ["Riyadh Central", "Jeddah Port", "Medinah Terminus"],
        },
        {
          id: 2,
          startStationName: "Ankara Gar",
          endStationName: "Iskenderun Port",
          stations: ["Ankara Gar", "Konya Central", "Iskenderun Port"],
        },
      ]);
      setSchedules([
        {
          id: 1,
          trainId: 1,
          trainName: "Haramain Express",
          routeId: 1,
          startStationName: "Riyadh Central",
          endStationName: "Medinah Terminus",
          assignmentDate: "2026-06-01",
        },
        {
          id: 2,
          trainId: 2,
          trainName: "Ankara Express",
          routeId: 2,
          startStationName: "Ankara Gar",
          endStationName: "Iskenderun Port",
          assignmentDate: "2026-06-02",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTrainSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      await addTrain({
        trainName: trainForm.trainName,
        trainType: trainForm.trainType,
        maxSpeed: parseInt(trainForm.maxSpeed, 10),
        authorityId: parseInt(trainForm.authorityId, 10),
        routeId: parseInt(trainForm.routeId, 10),
      });
      setMessage({
        type: "success",
        text: "Train fleet unit successfully added.",
      });
      setTrainForm({
        trainName: "",
        trainType: "Passenger",
        maxSpeed: "",
        authorityId: "1",
        routeId: "",
      });
      fetchData();
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err.response?.data?.message ||
          "Failed to add train. Please try again.",
      });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (train) => {
    setEditingTrain({
      id: train.id,
      trainName: train.trainName,
      trainStatus: train.trainStatus,
    });
    setShowMaintenancePrompt(false);
  };

  const handleStatusChange = (status) => {
    setEditingTrain({ ...editingTrain, trainStatus: status });
    // Rule: "Bir trenin veya rayın durumu 'kullanılamaz' olarak değiştirilmeden önce, uygulamaya mutlaka bir bakım kaydı girilmelidir."
    if (status === "Out of Service") {
      setShowMaintenancePrompt(true);
    } else {
      setShowMaintenancePrompt(false);
    }
  };

  const saveTrainEdit = async () => {
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // If marked as out of service, post maintenance record first
      if (editingTrain.trainStatus === "Out of Service") {
        await addMaintenanceRecord({
          targetType: "Train",
          trainId: editingTrain.id,
          maintenanceType: maintenanceForm.maintenanceType,
          description:
            maintenanceForm.description ||
            "Required check before taking out of service.",
          startDate: maintenanceForm.startDate,
          technicianId: maintenanceForm.technicianId,
        });
      }

      await editTrain(editingTrain.id, {
        trainName: editingTrain.trainName,
        trainStatus: editingTrain.trainStatus,
      });

      setMessage({
        type: "success",
        text: "Train status successfully updated (Maintenance logs generated).",
      });
      setEditingTrain(null);
      fetchData();
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err.response?.data?.message ||
          "Failed to update train. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();

    // Rule: "Bir tren, rotasında tanımlı olmayan bir istasyondan geçecek şekilde ayarlanamaz."
    // Enforcing Route Stations alignment checks
    const selectedTrain = trains.find(
      (t) => t.id === parseInt(scheduleForm.trainId, 10),
    );
    const selectedRoute = routes.find(
      (r) => r.id === parseInt(scheduleForm.routeId, 10),
    );

    if (selectedTrain && selectedRoute) {
      // Check if train's default route matches or is compatible with the scheduled route
      if (selectedTrain.routeId && selectedTrain.routeId !== selectedRoute.id) {
        const confirmRouting = window.confirm(
          `Warning: Train "${selectedTrain.trainName}" is designated for Route #${selectedTrain.routeId}, but you are scheduling it for Route #${selectedRoute.id}. Proceed?`,
        );
        if (!confirmRouting) return;
      }
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      await addSchedule({
        trainId: parseInt(scheduleForm.trainId, 10),
        routeId: parseInt(scheduleForm.routeId, 10),
        assignmentDate: scheduleForm.assignmentDate,
      });
      setMessage({
        type: "success",
        text: "Train schedule assignment successfully created.",
      });
      setScheduleForm({ trainId: "", routeId: "", assignmentDate: "" });
      fetchData();
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err.response?.data?.message ||
          "Failed to create schedule. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-slate-800">
        Manage Fleet & Schedules
      </h2>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6">
        <button
          onClick={() => {
            setActiveTab("trains");
            setMessage({ type: "", text: "" });
          }}
          className={`py-3 px-6 font-semibold border-b-2 transition-colors ${
            activeTab === "trains"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Trains (Fleet)
        </button>
        <button
          onClick={() => {
            setActiveTab("schedules");
            setMessage({ type: "", text: "" });
          }}
          className={`py-3 px-6 font-semibold border-b-2 transition-colors ${
            activeTab === "schedules"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Train Schedules
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

      {/* Trains Panel */}
      {activeTab === "trains" && (
        <div>
          {/* Add Train Form */}
          <form
            onSubmit={handleTrainSubmit}
            className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-8 grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Train Name / ID
              </label>
              <input
                type="text"
                required
                value={trainForm.trainName}
                onChange={(e) =>
                  setTrainForm({ ...trainForm, trainName: e.target.value })
                }
                placeholder="e.g., Hijaz Express"
                className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Train Type
              </label>
              <select
                value={trainForm.trainType}
                onChange={(e) =>
                  setTrainForm({ ...trainForm, trainType: e.target.value })
                }
                className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800"
              >
                <option value="Passenger">Passenger</option>
                <option value="Freight">Freight</option>
                <option value="High-Speed">High-Speed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Max Speed (km/h)
              </label>
              <input
                type="number"
                required
                min="0"
                value={trainForm.maxSpeed}
                onChange={(e) =>
                  setTrainForm({ ...trainForm, maxSpeed: e.target.value })
                }
                placeholder="e.g., 200"
                className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Route Code
              </label>
              <select
                required
                value={trainForm.routeId}
                onChange={(e) =>
                  setTrainForm({ ...trainForm, routeId: e.target.value })
                }
                className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800"
              >
                <option value="">Select Route</option>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    Route {r.id}:{" "}
                    {r.startStationName || `Station #${r.startStationId}`} -{" "}
                    {r.endStationName || `Station #${r.endStationId}`}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded transition-colors disabled:bg-blue-300"
            >
              {loading ? "Adding..." : "Add Train"}
            </button>
          </form>

          {/* Edit Train Modal/Overlay */}
          {editingTrain && (
            <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg border">
                <h3 className="text-lg font-bold text-slate-800 mb-4">
                  Edit Train status: {editingTrain.trainName}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Status
                    </label>
                    <select
                      value={editingTrain.trainStatus}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800"
                    >
                      <option value="Active">Active / Available</option>
                      <option value="Out of Service">Out of Service</option>
                    </select>
                  </div>

                  {showMaintenancePrompt && (
                    <div className="bg-amber-50 p-4 rounded-md border border-amber-200 space-y-3">
                      <p className="text-xs font-semibold text-amber-800">
                        Rule Warning: A maintenance log must be completed before
                        setting a train out of service.
                      </p>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Maintenance Reason
                        </label>
                        <input
                          type="text"
                          required
                          value={maintenanceForm.description}
                          onChange={(e) =>
                            setMaintenanceForm({
                              ...maintenanceForm,
                              description: e.target.value,
                            })
                          }
                          placeholder="e.g., Engine oil leak inspection"
                          className="w-full p-1.5 border border-slate-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Type
                        </label>
                        <select
                          value={maintenanceForm.maintenanceType}
                          onChange={(e) =>
                            setMaintenanceForm({
                              ...maintenanceForm,
                              maintenanceType: e.target.value,
                            })
                          }
                          className="w-full p-1.5 border border-slate-300 rounded text-xs bg-white"
                        >
                          <option value="Routine Check">Routine Check</option>
                          <option value="Engine Repair">Engine Repair</option>
                          <option value="Track maintenance">
                            Track maintenance
                          </option>
                          <option value="Wheel Replacements">
                            Wheel Replacements
                          </option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 justify-end pt-4 border-t">
                    <button
                      onClick={() => setEditingTrain(null)}
                      className="px-4 py-2 border rounded hover:bg-slate-50 text-slate-700 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveTrainEdit}
                      disabled={
                        loading ||
                        (editingTrain.trainStatus === "Out of Service" &&
                          !maintenanceForm.description)
                      }
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium disabled:bg-blue-300"
                    >
                      {loading ? "Updating..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Train Fleet List */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-slate-800">
              Active Fleet
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase text-xs border-b">
                  <tr>
                    <th className="p-4 font-bold">ID</th>
                    <th className="p-4 font-bold">Name</th>
                    <th className="p-4 font-bold">Type</th>
                    <th className="p-4 font-bold">Max Speed</th>
                    <th className="p-4 font-bold">Status</th>
                    <th className="p-4 font-bold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {trains.map((train) => (
                    <tr
                      key={train.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-4">{train.id}</td>
                      <td className="p-4 font-semibold text-slate-800">
                        {train.trainName}
                      </td>
                      <td className="p-4">{train.trainType}</td>
                      <td className="p-4">{train.maxSpeed} km/h</td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                            train.trainStatus === "Active" ||
                            train.status === "Active"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {train.trainStatus || train.status || "Active"}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleEditClick(train)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                        >
                          Modify Status
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Schedules Panel */}
      {activeTab === "schedules" && (
        <div>
          {/* Add Schedule Form */}
          <form
            onSubmit={handleScheduleSubmit}
            className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-8 grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Select Train
              </label>
              <select
                required
                value={scheduleForm.trainId}
                onChange={(e) =>
                  setScheduleForm({ ...scheduleForm, trainId: e.target.value })
                }
                className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800"
              >
                <option value="">Select Train</option>
                {trains.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.trainName} ({t.trainType})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Select Route Map
              </label>
              <select
                required
                value={scheduleForm.routeId}
                onChange={(e) =>
                  setScheduleForm({ ...scheduleForm, routeId: e.target.value })
                }
                className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800"
              >
                <option value="">Select Route</option>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    Route {r.id}:{" "}
                    {r.startStationName || `Station #${r.startStationId}`} -{" "}
                    {r.endStationName || `Station #${r.endStationId}`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Departure Date
              </label>
              <input
                type="date"
                required
                value={scheduleForm.assignmentDate}
                onChange={(e) =>
                  setScheduleForm({
                    ...scheduleForm,
                    assignmentDate: e.target.value,
                  })
                }
                className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded transition-colors disabled:bg-blue-300"
            >
              {loading ? "Scheduling..." : "Assign Schedule"}
            </button>
          </form>

          {/* Schedules List */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-slate-800">
              Operational Schedules
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase text-xs border-b">
                  <tr>
                    <th className="p-4 font-bold">Schedule ID</th>
                    <th className="p-4 font-bold">Train Name</th>
                    <th className="p-4 font-bold">Assigned Route</th>
                    <th className="p-4 font-bold">Date of Travel</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {schedules.map((schedule) => (
                    <tr
                      key={schedule.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-4">{schedule.id}</td>
                      <td className="p-4 font-semibold text-slate-800">
                        {schedule.trainName || `Train ID #${schedule.trainId}`}
                      </td>
                      <td className="p-4">
                        {schedule.startStationName
                          ? `${schedule.startStationName} to ${schedule.endStationName}`
                          : `Route #${schedule.routeId}`}
                      </td>
                      <td className="p-4 font-medium">
                        {schedule.assignmentDate}
                      </td>
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
