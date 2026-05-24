import { useState } from "react";
import { addDependent, addLuggage } from "../../services/api";

export default function Extras() {
  const passengerId = localStorage.getItem("passengerId") || "user123";

  // Tab state: 'dependents' | 'luggage'
  const [activeTab, setActiveTab] = useState("dependents");

  // Dependent Form State
  const [dependentData, setDependentData] = useState({
    name: "",
    age: "",
  });
  const [depLoading, setDepLoading] = useState(false);
  const [depError, setDepError] = useState("");
  const [depSuccess, setDepSuccess] = useState("");

  // Luggage Form State
  const [luggageData, setLuggageData] = useState({
    reservationNumber: "",
    weight: "",
    itemCount: "",
  });
  const [lugLoading, setLugLoading] = useState(false);
  const [lugError, setLugError] = useState("");
  const [lugSuccess, setLugSuccess] = useState("");

  const handleAddDependent = async (e) => {
    e.preventDefault();
    setDepLoading(true);
    setDepError("");
    setDepSuccess("");

    try {
      await addDependent({
        passengerId,
        name: dependentData.name,
        age: parseInt(dependentData.age, 10),
      });
      setDepSuccess(`Dependent "${dependentData.name}" successfully registered! They are now eligible for a 25% ticket discount.`);
      setDependentData({ name: "", age: "" });
    } catch (err) {
      console.error(err);
      setDepError(err.response?.data?.message || "Failed to register dependent. Please try again.");
    } finally {
      setDepLoading(false);
    }
  };

  const handleAddLuggage = async (e) => {
    e.preventDefault();
    setLugLoading(true);
    setLugError("");
    setLugSuccess("");

    try {
      await addLuggage({
        reservationNumber: luggageData.reservationNumber,
        weight: parseFloat(luggageData.weight),
        itemCount: parseInt(luggageData.itemCount, 10),
      });
      setLugSuccess("Luggage information successfully linked to reservation!");
      setLuggageData({ reservationNumber: "", weight: "", itemCount: "" });
    } catch (err) {
      console.error(err);
      setLugError(err.response?.data?.message || "Failed to link luggage. Verify the Reservation Reference.");
    } finally {
      setLugLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-slate-800">Extras & Services</h2>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab("dependents")}
          className={`py-3 px-6 font-semibold border-b-2 transition-colors ${
            activeTab === "dependents"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Manage Dependents
        </button>
        <button
          onClick={() => setActiveTab("luggage")}
          className={`py-3 px-6 font-semibold border-b-2 transition-colors ${
            activeTab === "luggage"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Add Luggage
        </button>
      </div>

      {/* Dependents Panel */}
      {activeTab === "dependents" && (
        <div className="bg-slate-50 p-6 rounded-lg border border-slate-100 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Register a Dependent</h3>
            <p className="text-sm text-slate-600">
              Register family members or travel companions as dependents. Under our railway rules, 
              tickets booked for registered dependents automatically receive a <strong>25% discount</strong>.
            </p>
          </div>

          {depSuccess && (
            <div className="mb-4 text-green-700 bg-green-50 p-3 rounded border border-green-200 text-sm">
              {depSuccess}
            </div>
          )}

          {depError && (
            <div className="mb-4 text-red-700 bg-red-50 p-3 rounded border border-red-200 text-sm">
              {depError}
            </div>
          )}

          <form onSubmit={handleAddDependent} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Jane Yilmaz"
                value={dependentData.name}
                onChange={(e) => setDependentData({ ...dependentData, name: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Age
              </label>
              <input
                type="number"
                required
                min="0"
                max="120"
                placeholder="e.g., 12"
                value={dependentData.age}
                onChange={(e) => setDependentData({ ...dependentData, age: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800"
              />
            </div>

            <button
              type="submit"
              disabled={depLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors disabled:bg-blue-300"
            >
              {depLoading ? "Registering..." : "Add Dependent"}
            </button>
          </form>
        </div>
      )}

      {/* Luggage Panel */}
      {activeTab === "luggage" && (
        <div className="bg-slate-50 p-6 rounded-lg border border-slate-100 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Link Luggage to Reservation</h3>
            <p className="text-sm text-slate-600">
              Declare cargo weight and container count for your railway journey. Link this info directly
              to your ticket reservation number.
            </p>
          </div>

          {lugSuccess && (
            <div className="mb-4 text-green-700 bg-green-50 p-3 rounded border border-green-200 text-sm">
              {lugSuccess}
            </div>
          )}

          {lugError && (
            <div className="mb-4 text-red-700 bg-red-50 p-3 rounded border border-red-200 text-sm">
              {lugError}
            </div>
          )}

          <form onSubmit={handleAddLuggage} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Reservation Reference Number
              </label>
              <input
                type="text"
                required
                placeholder="e.g., res123"
                value={luggageData.reservationNumber}
                onChange={(e) => setLuggageData({ ...luggageData, reservationNumber: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  min="0.1"
                  placeholder="e.g., 23.5"
                  value={luggageData.weight}
                  onChange={(e) => setLuggageData({ ...luggageData, weight: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Item/Bag Count
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g., 2"
                  value={luggageData.itemCount}
                  onChange={(e) => setLuggageData({ ...luggageData, itemCount: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={lugLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors disabled:bg-blue-300"
            >
              {lugLoading ? "Linking Cargo..." : "Link Luggage"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
