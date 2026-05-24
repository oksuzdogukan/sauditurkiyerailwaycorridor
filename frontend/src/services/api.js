import axios from "axios";

// Create an Axios instance with the base URL pointing to the Node.js backend
const api = axios.create({
  baseURL: "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to attach the JWT token if the passenger is logged in
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ==========================================
// PASSENGER ENDPOINTS
// ==========================================

/**
 * Register a new passenger
 * @param {Object} data - { username, email, password, firstName, lastName, nationalId, dateOfBirth }
 */
export const registerPassenger = (data) => 
  api.post("/api/passenger/register", data);

/**
 * Login a passenger
 * @param {Object} credentials - { email, password }
 */
export const loginPassenger = (credentials) => 
  api.post("/api/passenger/login", credentials);

/**
 * Search available trains
 * @param {Object} params - { fromStation, toStation, travelDate }
 */
export const searchTrains = (params) => 
  api.get("/api/trains/search", { params });

/**
 * Find active trains operating on a specific route
 * @param {string} fromStation
 * @param {string} toStation
 */
export const searchTrainsByRoute = (fromStation, toStation) => 
  api.get("/api/trains/route-search", { params: { fromStation, toStation } });

/**
 * Fetch available travel dates for a train on a route
 * @param {number|string} trainId
 * @param {string} fromStation
 * @param {string} toStation
 */
export const getRouteDates = (trainId, fromStation, toStation) => 
  api.get("/api/trains/route-dates", { params: { trainId, fromStation, toStation } });

/**
 * Book a new train ticket/reservation
 * @param {Object} bookingData - { passengerId, scheduleId, fromStationId, toStationId, seatId, coachType, travelDate, ticketPrice }
 */
export const bookTicket = (bookingData) => 
  api.post("/api/passenger/book", bookingData);

/**
 * Process payment for a reservation
 * @param {Object} paymentData - { reservationId, amount, paymentMethod }
 */
export const processPayment = (paymentData) => 
  api.post("/api/passenger/payment", paymentData);

/**
 * Get reservations for a specific passenger
 * @param {string|number} passengerId
 */
export const getReservations = (passengerId) => 
  api.get(`/api/passenger/${passengerId}/reservations`);

/**
 * Cancel a passenger reservation
 * @param {string|number} reservationId
 */
export const cancelReservation = (reservationId) => 
  api.post("/api/passenger/cancel-reservation", { reservationId });

/**
 * Add a dependent to a passenger profile
 * @param {Object} dependentData - { passengerId, name, age }
 */
export const addDependent = (dependentData) => 
  api.post("/api/passenger/dependent", dependentData);

/**
 * Add luggage information for a reservation
 * @param {Object} luggageData - { reservationNumber, weight, itemCount }
 */
export const addLuggage = (luggageData) => 
  api.post("/api/passenger/luggage", luggageData);

// ==========================================
// ADMIN ENDPOINTS
// ==========================================

// Trains
export const getTrains = () => api.get("/api/admin/trains");
export const addTrain = (data) => api.post("/api/admin/trains", data);
export const editTrain = (id, data) => api.put(`/api/admin/trains/${id}`, data);

// Stations
export const getStations = () => api.get("/api/admin/stations");
export const addStation = (data) => api.post("/api/admin/stations", data);
export const editStation = (id, data) => api.put(`/api/admin/stations/${id}`, data);

// Routes
export const getRoutes = () => api.get("/api/admin/routes");
export const addRoute = (data) => api.post("/api/admin/routes", data);

// Schedules
export const getSchedules = () => api.get("/api/admin/schedules");
export const addSchedule = (data) => api.post("/api/admin/schedules", data);

// Staff Assignments
export const getStaffAssignments = () => api.get("/api/admin/staff-assignments");
export const addStaffAssignment = (data) => api.post("/api/admin/staff-assignments", data);
export const deleteStaffAssignment = (id) => api.delete(`/api/admin/staff-assignments/${id}`);

// Freight Shipments
export const getFreightShipments = () => api.get("/api/admin/freight-shipments");
export const addFreightShipment = (data) => api.post("/api/admin/freight-shipments", data);

// Maintenance
export const getMaintenanceRecords = () => api.get("/api/admin/maintenance");
export const addMaintenanceRecord = (data) => api.post("/api/admin/maintenance", data);

// Waiting List Report
export const getWaitingListReport = () => api.get("/api/admin/waitinglist");

// ==========================================
// SYSTEM & OPERATIONS ENDPOINTS
// ==========================================

export const cancelExpiredReservations = () => api.post("/api/system/cancel-expired");
export const updateLoyaltyTiers = () => api.post("/api/system/update-loyalty");
export const updateWaitingList = (data) => api.post("/api/system/update-waitinglist", data);
export const getSensorReadings = () => api.get("/api/system/sensor-readings");
export const addSensorReading = (data) => api.post("/api/system/sensor-readings", data);

// Export api instance as default for backward compatibility or general requests
export default api;
