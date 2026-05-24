import { useState, useEffect } from "react";
import { getStaffAssignments, addStaffAssignment, getTrains, deleteStaffAssignment } from "../../services/api";

export default function ManageStaff() {
  const [assignments, setAssignments] = useState([]);
  const [trains, setTrains] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this staff assignment?")) return;
    try {
      await deleteStaffAssignment(id);
      setMessage({ type: "success", text: "Staff assignment deleted successfully." });
      fetchData();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to delete assignment.",
      });
    }
  };

  const [formData, setFormData] = useState({
    staffId: "",
    staffName: "",
    role: "driver", // driver, engineer, station manager, customs coordinator, admin
    trainId: "",
    assignmentDate: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const assignRes = await getStaffAssignments();
      setAssignments(assignRes.data || []);
      
      const trainsRes = await getTrains();
      setTrains(trainsRes.data || []);
    } catch (err) {
      console.warn("API error, loading fallback mock staff data:", err);
      setTrains([
        { id: 1, trainName: "Haramain Express" },
        { id: 2, trainName: "Ankara Express" },
      ]);
      setAssignments([
        { id: 1, staffId: "ST-09", staffName: "Ali Al-Farsi", role: "driver", trainId: 1, trainName: "Haramain Express", assignmentDate: "2026-06-01" },
        { id: 2, staffId: "ST-22", staffName: "Mustafa Demir", role: "engineer", trainId: 2, trainName: "Ankara Express", assignmentDate: "2026-06-01" },
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

    // Rule check: "Bir personel, aynı saatte/tarihte iki farklı trene atanamaz."
    const conflict = assignments.find(
      (assign) => 
        assign.staffId === formData.staffId && 
        assign.assignmentDate === formData.assignmentDate &&
        parseInt(assign.trainId, 10) !== parseInt(formData.trainId, 10)
    );

    if (conflict) {
      setMessage({
        type: "error",
        text: `Scheduling Conflict: ${formData.staffName || 'Staff member'} is already assigned to Train ID #${conflict.trainId} (${conflict.trainName}) on ${formData.assignmentDate}.`,
      });
      alert(`Conflict: Staff member is already assigned to another train on ${formData.assignmentDate}.`);
      setLoading(false);
      return;
    }

    try {
      await addStaffAssignment({
        staffId: formData.staffId,
        staffName: formData.staffName,
        role: formData.role,
        trainId: parseInt(formData.trainId, 10),
        assignmentDate: formData.assignmentDate,
      });

      setMessage({ type: "success", text: "Staff assignment successfully created." });
      setFormData({
        staffId: "",
        staffName: "",
        role: "driver",
        trainId: "",
        assignmentDate: "",
      });
      fetchData();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to assign staff. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-slate-800">Staff Assignments</h2>

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

      {/* Assignment Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-8 grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
      >
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Staff ID Code
          </label>
          <input
            type="text"
            required
            placeholder="e.g., ST-89"
            value={formData.staffId}
            onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
            className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            required
            placeholder="e.g., Ali Al-Farsi"
            value={formData.staffName}
            onChange={(e) => setFormData({ ...formData, staffName: e.target.value })}
            className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Staff Role
          </label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800"
          >
            <option value="driver">Driver (Makinist)</option>
            <option value="engineer">Engineer (Mühendis)</option>
            <option value="station manager">Station Manager</option>
            <option value="customs coordinator">Customs Coordinator</option>
            <option value="admin">System Admin</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Assign Train
          </label>
          <select
            required
            value={formData.trainId}
            onChange={(e) => setFormData({ ...formData, trainId: e.target.value })}
            className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800"
          >
            <option value="">Select Train</option>
            {trains.map((t) => (
              <option key={t.id} value={t.id}>{t.trainName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Assignment Date
          </label>
          <input
            type="date"
            required
            value={formData.assignmentDate}
            onChange={(e) => setFormData({ ...formData, assignmentDate: e.target.value })}
            className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="md:col-span-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded transition-colors disabled:bg-blue-300"
        >
          {loading ? "Scheduling..." : "Create Duty Assignment"}
        </button>
      </form>

      {/* Staff Assignments List */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-slate-800">Duty Roster</h3>
        <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase text-xs border-b">
              <tr>
                <th className="p-4 font-bold">Staff Name</th>
                <th className="p-4 font-bold">Role</th>
                <th className="p-4 font-bold">Assigned Train</th>
                <th className="p-4 font-bold">Assignment Date</th>
                <th className="p-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {assignments.map((assign) => (
                <tr key={assign.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-semibold text-slate-800">{assign.staffName || `Staff Member`}</td>
                  <td className="p-4 capitalize">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs">
                      {assign.role}
                    </span>
                  </td>
                  <td className="p-4">{assign.trainName || `Train ID #${assign.trainId}`}</td>
                  <td className="p-4 font-medium">{new Date(assign.assignmentDate).toLocaleDateString()}</td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleDelete(assign.id)}
                      className="text-red-600 hover:text-red-800 font-medium text-sm"
                    >
                      Delete
                    </button>
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
