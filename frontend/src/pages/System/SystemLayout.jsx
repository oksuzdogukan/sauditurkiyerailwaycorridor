import { useState } from "react";
import AutomatedTasks from "./AutomatedTasks";
import SensorReadings from "./SensorReadings";

export default function SystemLayout() {
  const [activeView, setActiveView] = useState("tasks");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar Menu */}
      <div className="lg:col-span-1 bg-white border border-slate-200 rounded-lg p-4 h-fit shadow-sm space-y-1">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-3">
          Operations Menu
        </h3>
        <button
          onClick={() => setActiveView("tasks")}
          className={`w-full text-left px-3 py-2 rounded text-sm font-semibold transition-colors cursor-pointer ${
            activeView === "tasks"
              ? "bg-blue-50 text-blue-600"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          Automated Jobs
        </button>
        <button
          onClick={() => setActiveView("sensors")}
          className={`w-full text-left px-3 py-2 rounded text-sm font-semibold transition-colors cursor-pointer ${
            activeView === "sensors"
              ? "bg-blue-50 text-blue-600"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          Sensor & IoT Logs
        </button>
      </div>

      {/* Content Area */}
      <div className="lg:col-span-3 bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
        {activeView === "tasks" ? <AutomatedTasks /> : <SensorReadings />}
      </div>
    </div>
  );
}
