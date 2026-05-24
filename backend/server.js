const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ============================================================
// DATABASE CONNECTION CONFIGURATION
// ============================================================
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "esraerol",
  database: process.env.DB_NAME || "sauditurkiyerailwaycorridor",
};

async function getConnection() {
  return await mysql.createConnection(dbConfig);
}

// Helper to sanitize database output and ensure all fields are serializable
function sanitizeRows(rows) {
  return JSON.parse(JSON.stringify(rows));
}

// ============================================================
// AUTO-INITIALIZER & SCHEMA MIGRATION ROUTINE
// Enforces table and column existence dynamically on startup.
// ============================================================
async function initializeMissingTables() {
  try {
    const connection = await getConnection();
    console.log("Checking table initialization & migrations...");

    // 1. Create auxiliary tables if missing
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS luggage (
        LuggageID INT AUTO_INCREMENT PRIMARY KEY,
        ReservationNumber VARCHAR(50),
        Weight DECIMAL(10,2),
        ItemCount INT
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS trainschedule (
        ScheduleID INT AUTO_INCREMENT PRIMARY KEY,
        TrainID INT,
        DepartureDate DATE,
        Status VARCHAR(50) DEFAULT 'scheduled'
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS schedulestop (
        ScheduleID INT,
        StationID INT,
        DepartureTime TIME,
        ArrivalTime TIME,
        StopSequence INT,
        PRIMARY KEY (ScheduleID, StationID)
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS waitinglist (
        WaitingID INT AUTO_INCREMENT PRIMARY KEY,
        PassengerID INT,
        ScheduleID INT,
        TravelDate DATE,
        CoachType VARCHAR(50),
        WLStatus VARCHAR(50) DEFAULT 'Waiting',
        QueuePosition INT
      )
    `);

    // 2. Dynamic Schema Migrations (Add missing RouteID columns)
    try {
      const [columns] = await connection.execute("DESCRIBE train");
      const hasRouteId = columns.some(
        (c) => c.Field.toLowerCase() === "routeid",
      );
      if (!hasRouteId) {
        await connection.execute(
          "ALTER TABLE train ADD COLUMN RouteID INT NULL",
        );
        console.log("Migration SUCCESS: RouteID column added to train table.");
      }
    } catch (e) {
      console.warn("Train table migration note:", e.message);
    }

    try {
      const [columns] = await connection.execute("DESCRIBE trainschedule");
      const hasRouteId = columns.some(
        (c) => c.Field.toLowerCase() === "routeid",
      );
      if (!hasRouteId) {
        await connection.execute(
          "ALTER TABLE trainschedule ADD COLUMN RouteID INT NULL",
        );
        console.log(
          "Migration SUCCESS: RouteID column added to trainschedule table.",
        );
      }
    } catch (e) {
      console.warn("Trainschedule table migration note:", e.message);
    }

    try {
      const [columns] = await connection.execute("DESCRIBE tracksegment");
      const hasElectrified = columns.some(
        (c) =>
          c.Field.toLowerCase() === "electrified" ||
          c.Field.toLowerCase() === "electrification",
      );
      if (!hasElectrified) {
        await connection.execute(
          "ALTER TABLE tracksegment ADD COLUMN Electrification VARCHAR(50) DEFAULT 'Electrified'",
        );
        console.log(
          "Migration SUCCESS: Electrification column added to tracksegment table.",
        );
      }
    } catch (e) {
      console.warn("Tracksegment table migration note:", e.message);
    }

    try {
      const [currentConstraints] = await connection.execute(`
        SELECT CONSTRAINT_NAME 
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
        WHERE TABLE_SCHEMA = 'sauditurkiyerailwaycorridor'
      `);
      const existingNames = currentConstraints.map((c) =>
        c.CONSTRAINT_NAME.toLowerCase(),
      );

      if (!existingNames.includes("fk_schedule_train")) {
        await connection.execute(
          "ALTER TABLE trainschedule ADD CONSTRAINT fk_schedule_train FOREIGN KEY (TrainID) REFERENCES train(TrainID) ON DELETE CASCADE",
        );
        console.log("Migration SUCCESS: Constraint fk_schedule_train added.");
      }
      if (!existingNames.includes("fk_stop_schedule")) {
        await connection.execute(
          "ALTER TABLE schedulestop ADD CONSTRAINT fk_stop_schedule FOREIGN KEY (ScheduleID) REFERENCES trainschedule(ScheduleID) ON DELETE CASCADE",
        );
        console.log("Migration SUCCESS: Constraint fk_stop_schedule added.");
      }
      if (!existingNames.includes("fk_stop_station")) {
        await connection.execute(
          "ALTER TABLE schedulestop ADD CONSTRAINT fk_stop_station FOREIGN KEY (StationID) REFERENCES station(StationID) ON DELETE CASCADE",
        );
        console.log("Migration SUCCESS: Constraint fk_stop_station added.");
      }
      if (!existingNames.includes("fk_luggage_reservation")) {
        // Clean up any orphan rows that don't match reservation references
        await connection.execute(
          "DELETE FROM luggage WHERE ReservationNumber NOT IN (SELECT ReservationNumber FROM reservation)",
        );
        await connection.execute(
          "ALTER TABLE luggage MODIFY COLUMN ReservationNumber VARCHAR(50) NOT NULL",
        );
        await connection.execute(
          "ALTER TABLE luggage ADD CONSTRAINT fk_luggage_reservation FOREIGN KEY (ReservationNumber) REFERENCES reservation(ReservationNumber) ON DELETE CASCADE",
        );
        console.log(
          "Migration SUCCESS: Constraint fk_luggage_reservation added.",
        );
      }
      if (!existingNames.includes("fk_waitinglist_passenger")) {
        await connection.execute(
          "ALTER TABLE waitinglist ADD CONSTRAINT fk_waitinglist_passenger FOREIGN KEY (PassengerID) REFERENCES passenger(PassengerID) ON DELETE CASCADE",
        );
        console.log(
          "Migration SUCCESS: Constraint fk_waitinglist_passenger added.",
        );
      }
      if (!existingNames.includes("fk_waitinglist_schedule")) {
        await connection.execute(
          "ALTER TABLE waitinglist ADD CONSTRAINT fk_waitinglist_schedule FOREIGN KEY (ScheduleID) REFERENCES trainschedule(ScheduleID) ON DELETE CASCADE",
        );
        console.log(
          "Migration SUCCESS: Constraint fk_waitinglist_schedule added.",
        );
      }
    } catch (e) {
      console.warn("Constraints migration note:", e.message);
    }

    await connection.end();
    console.log("Database verification checks complete.");
  } catch (err) {
    console.error("Database initialization warning:", err.message);
  }
}

// ============================================================
//  SECTION 1 — PASSENGER AUTH & ACTIONS
// ============================================================

// ------------------------------------------------------------
// POST /api/passenger/login
// ------------------------------------------------------------
app.post("/api/passenger/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required." });
    }

    // Check administrators first
    if (
      (email === "admin@rail.com" || email === "admin@railway.com") &&
      password === "admin123"
    ) {
      return res.json({
        token: "mock-jwt-token-admin",
        id: "admin",
        passengerId: "admin",
        name: "System Admin",
        email: email,
        role: "admin",
      });
    }

    // Check system operators first
    if (
      (email === "system@rail.com" ||
        email === "system@railway.com" ||
        email === "operations@railway.com") &&
      (password === "system123" || password === "ops123")
    ) {
      return res.json({
        token: "mock-jwt-token-ops",
        id: "operations",
        passengerId: "operations",
        name: "Operations Manager",
        email: email,
        role: "system",
      });
    }

    const connection = await getConnection();
    // Support both plaintext hashes from mock script and SHA2 hashes if generated.
    const [rows] = await connection.execute(
      `SELECT * FROM passenger 
       WHERE Email = ? AND (PasswordHash = ? OR PasswordHash = SHA2(?, 256))`,
      [email, password, password],
    );

    await connection.end();

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const passenger = sanitizeRows(rows[0]);
    res.json({
      token: "mock-jwt-token-for-session",
      id: passenger.PassengerID,
      passengerId: passenger.PassengerID,
      name: passenger.Name,
      email: passenger.Email,
      loyaltyMiles: passenger.LoyaltyMiles,
      loyaltyClass: passenger.LoyaltyClass,
      role: "passenger",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------
// POST /api/passenger/register
// ------------------------------------------------------------
app.post("/api/passenger/register", async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    if (!email || !password || !firstName || !lastName) {
      return res
        .status(400)
        .json({ error: "Email, password, first and last name are required." });
    }

    const fullName = `${firstName} ${lastName}`;
    const connection = await getConnection();

    const [result] = await connection.execute(
      `INSERT INTO passenger (Name, Email, PasswordHash, LoyaltyMiles, LoyaltyClass)
       VALUES (?, ?, SHA2(?, 256), 0, 'Green')`,
      [fullName, email, password],
    );

    await connection.end();

    res.status(201).json({
      message: "Passenger registered successfully.",
      id: result.insertId,
    });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ error: "Email address is already in use." });
    }
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------
// GET /api/trains/search
// ------------------------------------------------------------
app.get("/api/trains/search", async (req, res) => {
  try {
    const { fromStation, toStation, travelDate } = req.query;
    if (!fromStation || !toStation || !travelDate) {
      return res.status(400).json({
        error: "fromStation, toStation, and travelDate are required.",
      });
    }

    const connection = await getConnection();

    const [origRows] = await connection.execute(
      "SELECT StationID FROM station WHERE Name = ?",
      [fromStation],
    );
    const [destRows] = await connection.execute(
      "SELECT StationID FROM station WHERE Name = ?",
      [toStation],
    );

    if (origRows.length === 0 || destRows.length === 0) {
      await connection.end();
      return res.json([]);
    }

    const fromId = origRows[0].StationID;
    const toId = destRows[0].StationID;

    // DÜZELTME: t.Name yerine t.TrainName yazıldı ve 'active' küçük harfe çevrildi!
    const [rows] = await connection.execute(
      `SELECT ts.ScheduleID AS id, 
              t.TrainID AS trainId, 
              t.TrainName AS trainName, 
              'Passenger' AS trainType,
              ss1.DepartureTime AS departureTime, 
              ss2.ArrivalTime AS arrivalTime,
              ? AS fromStationId, 
              ? AS toStationId, 
              ts.DepartureDate AS departureDate
       FROM trainschedule ts
       JOIN train t ON ts.TrainID = t.TrainID
       JOIN route r ON ts.RouteID = r.RouteID
       JOIN schedulestop ss1 ON ts.ScheduleID = ss1.ScheduleID AND ss1.StopSequence = 1
       JOIN schedulestop ss2 ON ts.ScheduleID = ss2.ScheduleID AND ss2.StopSequence = 2
       WHERE r.OriginStationID = ? 
         AND r.DestinationStationID = ? 
         AND ts.DepartureDate = ? 
         AND ts.Status = 'scheduled' 
         AND t.TrainStatus = 'active'`,
      [fromId, toId, fromId, toId, travelDate],
    );

    await connection.end();
    res.json(sanitizeRows(rows));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------
// GET /api/trains/route-search
// ------------------------------------------------------------
app.get("/api/trains/route-search", async (req, res) => {
  try {
    const { fromStation, toStation } = req.query;
    if (!fromStation || !toStation) {
      return res
        .status(400)
        .json({ error: "fromStation and toStation are required." });
    }

    const connection = await getConnection();

    // Resolve Station IDs
    const [origRows] = await connection.execute(
      "SELECT StationID FROM station WHERE Name = ?",
      [fromStation],
    );
    const [destRows] = await connection.execute(
      "SELECT StationID FROM station WHERE Name = ?",
      [toStation],
    );

    if (origRows.length === 0 || destRows.length === 0) {
      await connection.end();
      return res.json([]);
    }

    const fromId = origRows[0].StationID;
    const toId = destRows[0].StationID;

    // Find active trains operating on this route using schedulestop sequence
    const [trains] = await connection.execute(
      `SELECT DISTINCT t.TrainID AS trainId, t.Name AS trainName
       FROM train t
       JOIN trainschedule ts ON t.TrainID = ts.TrainID
       JOIN schedulestop ss1 ON ts.ScheduleID = ss1.ScheduleID
       JOIN schedulestop ss2 ON ts.ScheduleID = ss2.ScheduleID
       WHERE ss1.StationID = ?
         AND ss2.StationID = ?
         AND ss1.StopSequence < ss2.StopSequence
         AND t.TrainStatus = 'Active'
         AND ts.Status = 'scheduled'`,
      [fromId, toId],
    );

    await connection.end();
    res.json(sanitizeRows(trains));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------
// GET /api/trains/route-dates
// ------------------------------------------------------------
app.get("/api/trains/route-dates", async (req, res) => {
  try {
    // DÜZELTME: trainId zorunluluğu tamamen kaldırıldı!
    const { fromStation, toStation } = req.query;
    if (!fromStation || !toStation) {
      return res
        .status(400)
        .json({ error: "fromStation and toStation are required." });
    }

    const connection = await getConnection();

    const [origRows] = await connection.execute(
      "SELECT StationID FROM station WHERE Name = ?",
      [fromStation],
    );
    const [destRows] = await connection.execute(
      "SELECT StationID FROM station WHERE Name = ?",
      [toStation],
    );

    if (origRows.length === 0 || destRows.length === 0) {
      await connection.end();
      return res.json([]);
    }

    const fromId = origRows[0].StationID;
    const toId = destRows[0].StationID;

    // Sadece Nereden ve Nereye istasyonlarına uyan aktif sefer tarihleri
    const [dates] = await connection.execute(
      `SELECT DISTINCT ts.ScheduleID AS scheduleId, ts.DepartureDate AS departureDate
       FROM trainschedule ts
       JOIN route r ON ts.RouteID = r.RouteID
       JOIN train t ON ts.TrainID = t.TrainID
       WHERE r.OriginStationID = ?
         AND r.DestinationStationID = ?
         AND ts.Status = 'scheduled'
         AND t.TrainStatus = 'active'
         AND ts.DepartureDate >= CURDATE()`,
      [fromId, toId],
    );

    await connection.end();
    res.json(sanitizeRows(dates));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------
// POST /api/passenger/book
// ------------------------------------------------------------
app.post("/api/passenger/book", async (req, res) => {
  try {
    const {
      passengerId,
      scheduleId,
      fromStationId,
      toStationId,
      seatId,
      coachType,
      travelDate,
      ticketPrice,
    } = req.body;

    const connection = await getConnection();

    // Resolve actual TrainID if scheduleId references a row in trainschedule
    let trainId = scheduleId;
    const [scheduleRows] = await connection.execute(
      `SELECT TrainID FROM trainschedule WHERE ScheduleID = ?`,
      [scheduleId],
    );
    if (scheduleRows.length > 0) {
      trainId = scheduleRows[0].TrainID;
    }

    // Rule: check how many active reservations the passenger has (Max 5)
    const [activeRes] = await connection.execute(
      `SELECT COUNT(*) AS active_count
       FROM reservation
       WHERE PassengerID = ? AND PaymentStatus = 'Pending'`,
      [passengerId],
    );

    if (activeRes[0].active_count >= 5) {
      await connection.end();
      return res.status(409).json({
        message:
          "Reservation Limit Exceeded: A passenger can have a maximum of 5 active unpaid reservations.",
      });
    }

    // --- COAT CAPACITY CHECK & WAITLIST ENQUEUE RULE ---
    let seatLimit = 5; // Economy capacity
    if (coachType === "Business") seatLimit = 3;
    if (coachType === "First Class") seatLimit = 2;

    const [activeTickets] = await connection.execute(
      `SELECT COUNT(*) AS booked
       FROM ticket t
       JOIN reservation r ON t.ReservationNumber = r.ReservationNumber
       WHERE r.TrainID = ? AND r.TravelDate = ? AND t.CoachType = ? AND r.PaymentStatus != 'Canceled'`,
      [trainId, travelDate, coachType],
    );

    if (activeTickets[0].booked >= seatLimit) {
      // Coach is fully booked. Place passenger on the waiting list.
      const [maxQueue] = await connection.execute(
        `SELECT COALESCE(MAX(QueuePosition), 0) AS max_pos
         FROM waitinglist
         WHERE ScheduleID = ? AND TravelDate = ? AND CoachType = ?`,
        [scheduleId, travelDate, coachType],
      );
      const nextQueue = maxQueue[0].max_pos + 1;

      await connection.execute(
        `INSERT INTO waitinglist (PassengerID, ScheduleID, TravelDate, CoachType, WLStatus, QueuePosition)
         VALUES (?, ?, ?, ?, 'Waiting', ?)`,
        [passengerId, scheduleId, travelDate, coachType, nextQueue],
      );

      await connection.end();
      return res.status(202).json({
        status: "Waitlisted",
        message: `The selected coach class (${coachType}) is fully booked. You have been added to the Waiting List.`,
        queuePosition: nextQueue,
        waitlisted: true,
      });
    }

    // Rule: check that the seat is not already taken
    const [seatCheck] = await connection.execute(
      `SELECT COUNT(*) AS taken
       FROM ticket t
       JOIN reservation r ON t.ReservationNumber = r.ReservationNumber
       WHERE r.TrainID = ? AND r.TravelDate = ? AND t.SeatNumber = ? AND r.PaymentStatus != 'Canceled'`,
      [trainId, travelDate, seatId],
    );

    if (seatCheck[0].taken > 0) {
      await connection.end();
      return res.status(409).json({
        message:
          "This seat has already been booked for the selected train and travel date.",
      });
    }

    const reservationNumber = "RES-" + Date.now();

    // 1. Create Reservation Record
    await connection.execute(
      `INSERT INTO reservation (ReservationNumber, PassengerID, TrainID, TravelDate, FromStationID, ToStationID, TotalAmount, PaymentStatus)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [
        reservationNumber,
        passengerId,
        trainId,
        travelDate,
        fromStationId,
        toStationId,
        ticketPrice,
      ],
    );

    // 2. Create Ticket Record
    await connection.execute(
      `INSERT INTO ticket (ReservationNumber, SeatNumber, CoachType, TicketPrice, TicketStatus)
       VALUES (?, ?, ?, ?, 'Valid')`,
      [reservationNumber, seatId, coachType, ticketPrice],
    );

    await connection.end();

    res.status(201).json({
      message: "Ticket reserved successfully.",
      id: reservationNumber,
      reservationId: reservationNumber,
      reservationNumber: reservationNumber,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------
// POST /api/passenger/cancel-reservation
// ------------------------------------------------------------
app.post("/api/passenger/cancel-reservation", async (req, res) => {
  try {
    const { reservationId } = req.body;
    if (!reservationId) {
      return res.status(400).json({ error: "reservationId is required." });
    }

    const connection = await getConnection();

    // 1. Get current reservation details before canceling
    const [resDetails] = await connection.execute(
      `SELECT r.TrainID, r.TravelDate, tk.CoachType, tk.SeatNumber, r.PassengerID, ts.ScheduleID
       FROM reservation r
       LEFT JOIN ticket tk ON r.ReservationNumber = tk.ReservationNumber
       LEFT JOIN trainschedule ts ON r.TrainID = ts.TrainID AND ts.DepartureDate = r.TravelDate
       WHERE r.ReservationNumber = ?`,
      [reservationId],
    );

    if (resDetails.length === 0) {
      await connection.end();
      return res.status(404).json({ error: "Reservation not found." });
    }

    const { TrainID, TravelDate, CoachType, SeatNumber, ScheduleID } =
      resDetails[0];

    // 2. Mark reservation and ticket as Canceled
    await connection.execute(
      `UPDATE reservation SET PaymentStatus = 'Canceled' WHERE ReservationNumber = ?`,
      [reservationId],
    );
    await connection.execute(
      `UPDATE ticket SET TicketStatus = 'Canceled' WHERE ReservationNumber = ?`,
      [reservationId],
    );

    // 3. Check for waitlisted passengers to promote
    if (ScheduleID) {
      // Find the highest priority waiting list passenger
      const [waitingList] = await connection.execute(
        `SELECT wl.WaitingID, wl.PassengerID, p.LoyaltyClass, p.Name AS passengerName, p.Email AS passengerEmail
         FROM waitinglist wl
         JOIN passenger p ON wl.PassengerID = p.PassengerID
         WHERE wl.ScheduleID = ? AND wl.TravelDate = ? AND wl.CoachType = ? AND wl.WLStatus = 'Waiting'
         ORDER BY 
           CASE p.LoyaltyClass
             WHEN 'Gold' THEN 1
             WHEN 'Silver' THEN 2
             WHEN 'Green' THEN 3
             ELSE 4
           END ASC,
           wl.QueuePosition ASC
         LIMIT 1`,
        [ScheduleID, TravelDate, CoachType],
      );

      if (waitingList.length > 0) {
        const promotedPassenger = waitingList[0];
        const newReservationNumber = "RES-PRO-" + Date.now();
        const baseTicketPrice =
          CoachType === "First Class"
            ? 300.0
            : CoachType === "Business"
              ? 200.0
              : 100.0;

        // Apply loyalty discount for promoted passenger
        let discountRate = 0.0;
        if (promotedPassenger.LoyaltyClass === "Gold") discountRate = 0.25;
        else if (promotedPassenger.LoyaltyClass === "Silver")
          discountRate = 0.1;
        else if (promotedPassenger.LoyaltyClass === "Green")
          discountRate = 0.05;

        const ticketPrice = baseTicketPrice * (1.0 - discountRate);

        // Update waitlist record to Promoted
        await connection.execute(
          `UPDATE waitinglist SET WLStatus = 'Promoted' WHERE WaitingID = ?`,
          [promotedPassenger.WaitingID],
        );

        // Create promoted passenger reservation
        await connection.execute(
          `INSERT INTO reservation (ReservationNumber, PassengerID, TrainID, TravelDate, FromStationID, ToStationID, TotalAmount, PaymentStatus)
           VALUES (?, ?, ?, ?, 1, 3, ?, 'Pending')`,
          [
            newReservationNumber,
            promotedPassenger.PassengerID,
            TrainID,
            TravelDate,
            ticketPrice,
          ],
        );

        // Create promoted passenger ticket
        await connection.execute(
          `INSERT INTO ticket (ReservationNumber, SeatNumber, CoachType, TicketPrice, TicketStatus)
           VALUES (?, ?, ?, ?, 'Valid')`,
          [newReservationNumber, SeatNumber || "15", CoachType, ticketPrice],
        );
      }
    }

    await connection.end();
    res.json({
      message: "Reservation canceled successfully. Waitlist check complete.",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------
// POST /api/passenger/payment
// ------------------------------------------------------------
app.post("/api/passenger/payment", async (req, res) => {
  try {
    const { reservationId } = req.body;
    const connection = await getConnection();

    await connection.execute(
      `UPDATE reservation 
       SET PaymentStatus = 'Completed' 
       WHERE ReservationNumber = ?`,
      [reservationId],
    );

    await connection.end();
    res.json({ message: "Payment validated. Ticket status confirmed." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------
// GET /api/passenger/:id/reservations
// ------------------------------------------------------------
app.get("/api/passenger/:id/reservations", async (req, res) => {
  try {
    const passengerId = req.params.id;
    const connection = await getConnection();

    const [rows] = await connection.execute(
      `SELECT r.ReservationNumber AS id, 
              tk.TicketID AS ticketId,
              r.TravelDate AS travelDate, 
              r.TotalAmount AS totalAmount, 
              IF(r.PaymentStatus = 'Completed', 'Paid', 'Pending Payment') AS status,
              t.Name AS trainName,
              s_from.Name AS fromStation,
              s_to.Name AS toStation,
              tk.SeatNumber AS seatNumber, 
              tk.CoachType AS seatClass, 
              tk.TicketPrice AS ticketPrice, 
              tk.TicketStatus AS ticketStatus
       FROM reservation r
       JOIN train t ON r.TrainID = t.TrainID
       JOIN station s_from ON r.FromStationID = s_from.StationID
       JOIN station s_to ON r.ToStationID = s_to.StationID
       LEFT JOIN ticket tk ON r.ReservationNumber = tk.ReservationNumber
       WHERE r.PassengerID = ?
       ORDER BY r.TravelDate DESC`,
      [passengerId],
    );

    await connection.end();
    res.json(sanitizeRows(rows));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------
// POST /api/passenger/dependent
// ------------------------------------------------------------
app.post("/api/passenger/dependent", async (req, res) => {
  try {
    const { passengerId, name, age } = req.body;
    const connection = await getConnection();

    await connection.execute(
      `INSERT INTO dependent (PassengerID, Name, Age) VALUES (?, ?, ?)`,
      [passengerId, name, age],
    );

    await connection.end();
    res
      .status(201)
      .json({ message: "Dependent declaration created successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------
// POST /api/passenger/luggage
// ------------------------------------------------------------
app.post("/api/passenger/luggage", async (req, res) => {
  try {
    const { reservationNumber, weight, itemCount } = req.body;
    const connection = await getConnection();

    await connection.execute(
      `INSERT INTO luggage (ReservationNumber, Weight, ItemCount) VALUES (?, ?, ?)`,
      [reservationNumber, weight, itemCount],
    );

    await connection.end();
    res
      .status(201)
      .json({ message: "Luggage manifest linked to reservation." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
//  SECTION 2 — ADMIN PANEL ENDPOINTS & RULES
// ============================================================

// Trains List
app.get("/api/admin/trains", async (req, res) => {
  try {
    const connection = await getConnection();
    const [rows] = await connection.execute(
      `SELECT t.TrainID AS id, t.Name AS trainName, t.TrainStatus AS trainStatus,
              t.RouteID AS routeId,
              IF(pt.TrainID IS NOT NULL, 'Passenger', 'Freight') AS trainType,
              COALESCE(pt.SeatCapacity, ft.MaxWeightCapacity, 250) AS capacity
       FROM train t
       LEFT JOIN passengertrain pt ON t.TrainID = pt.TrainID
       LEFT JOIN freighttrain ft ON t.TrainID = ft.TrainID`,
    );
    await connection.end();
    res.json(sanitizeRows(rows));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add Train
app.post("/api/admin/trains", async (req, res) => {
  try {
    const { trainName, trainType, capacity, routeId } = req.body;
    const connection = await getConnection();

    const [result] = await connection.execute(
      `INSERT INTO train (Name, TrainStatus, RouteID) VALUES (?, 'Active', ?)`,
      [trainName, routeId || null],
    );
    const newTrainId = result.insertId;

    if (trainType === "Passenger") {
      await connection.execute(
        `INSERT INTO passengertrain (TrainID, SeatCapacity) VALUES (?, ?)`,
        [newTrainId, capacity || 250],
      );
    } else {
      await connection.execute(
        `INSERT INTO freighttrain (TrainID, MaxWeightCapacity) VALUES (?, ?)`,
        [newTrainId, capacity || 5000.0],
      );
    }

    await connection.end();
    res
      .status(201)
      .json({ message: "Train fleet unit added.", trainId: newTrainId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Edit Train status (Enforces Maintenance rule)
app.put("/api/admin/trains/:id", async (req, res) => {
  try {
    const { trainName, trainStatus } = req.body;
    const trainId = req.params.id;
    const connection = await getConnection();

    // Rule: "Bir treni veya ray hattını 'kullanılamaz/servis dışı' olarak işaretlemeden önce, sisteme mutlaka bir bakım kaydı girmeyi zorunlu kılmalı."
    if (trainStatus === "Out of Service") {
      const [records] = await connection.execute(
        `SELECT * FROM maintenancerecord 
         WHERE TrainID = ? AND MaintenanceStatus = 'In Progress'`,
        [trainId],
      );

      if (records.length === 0) {
        await connection.end();
        return res.status(400).json({
          message:
            "Enforcement Policy: You must log a maintenance ticket and mark it in progress before setting this train to 'Out of Service'.",
        });
      }
    }

    await connection.execute(
      `UPDATE train SET Name = ?, TrainStatus = ? WHERE TrainID = ?`,
      [trainName, trainStatus, trainId],
    );

    await connection.end();
    res.json({ message: "Train status successfully updated." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stations List
app.get("/api/admin/stations", async (req, res) => {
  try {
    const connection = await getConnection();
    const [rows] = await connection.execute(
      `SELECT s.StationID AS id, s.Name AS name, s.StationType AS stationType, s.CountryID AS countryId,
              c.Name AS country
       FROM station s
       LEFT JOIN country c ON s.CountryID = c.CountryID`,
    );
    await connection.end();
    res.json(sanitizeRows(rows));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add Station
app.post("/api/admin/stations", async (req, res) => {
  try {
    const { name, stationType, countryId } = req.body;
    const connection = await getConnection();

    await connection.execute(
      `INSERT INTO station (Name, StationType, CountryID) VALUES (?, ?, ?)`,
      [name, stationType, countryId],
    );

    await connection.end();
    res.status(201).json({ message: "Station successfully added." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Routes (TrackSegment) List
app.get("/api/admin/routes", async (req, res) => {
  try {
    const connection = await getConnection();
    const [rows] = await connection.execute(
      `SELECT ts.TrackID AS id, ts.StartStationID, ts.EndStationID, ts.Distance,
              ts.MaxPassengerSpeed AS maxPassengerSpeed, ts.MaxFreightSpeed AS maxFreightSpeed,
              ts.TrackStatus,
              s_start.Name AS startStationName, s_end.Name AS endStationName
       FROM tracksegment ts
       JOIN station s_start ON ts.StartStationID = s_start.StationID
       JOIN station s_end ON ts.EndStationID = s_end.StationID`,
    );
    await connection.end();
    res.json(sanitizeRows(rows));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add Route (TrackSegment)
app.post("/api/admin/routes", async (req, res) => {
  try {
    const {
      startStationId,
      endStationId,
      distance,
      maxPassengerSpeed,
      maxFreightSpeed,
    } = req.body;
    const connection = await getConnection();

    await connection.execute(
      `INSERT INTO tracksegment (StartStationID, EndStationID, Distance, MaxPassengerSpeed, MaxFreightSpeed, TrackStatus) 
       VALUES (?, ?, ?, ?, ?, 'Open')`,
      [
        startStationId,
        endStationId,
        distance,
        maxPassengerSpeed,
        maxFreightSpeed,
      ],
    );

    await connection.end();
    res.status(201).json({ message: "Track segment added successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Schedules List
app.get("/api/admin/schedules", async (req, res) => {
  try {
    const connection = await getConnection();
    const [rows] = await connection.execute(
      `SELECT ts.ScheduleID AS id, ts.TrainID, ts.RouteID, ts.DepartureDate AS assignmentDate, ts.Status,
              t.Name AS trainName,
              s_start.Name AS startStationName, s_end.Name AS endStationName
       FROM trainschedule ts
       JOIN train t ON ts.TrainID = t.TrainID
       LEFT JOIN tracksegment r ON ts.RouteID = r.TrackID
       LEFT JOIN station s_start ON r.StartStationID = s_start.StationID
       LEFT JOIN station s_end ON r.EndStationID = s_end.StationID`,
    );
    await connection.end();
    res.json(sanitizeRows(rows));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add Schedule (Validates compatibility)
app.post("/api/admin/schedules", async (req, res) => {
  try {
    const { trainId, routeId, departureDate } = req.body;
    const connection = await getConnection();

    // Check if the scheduled route exists
    if (routeId) {
      const [routeRows] = await connection.execute(
        `SELECT * FROM tracksegment WHERE TrackID = ?`,
        [routeId],
      );
      if (routeRows.length === 0) {
        await connection.end();
        return res.status(400).json({
          message: "Invalid schedule definition: Route segment does not exist.",
        });
      }
    }

    await connection.execute(
      `INSERT INTO trainschedule (TrainID, RouteID, DepartureDate, Status) VALUES (?, ?, ?, 'scheduled')`,
      [trainId, routeId || null, departureDate],
    );

    await connection.end();
    res.status(201).json({ message: "Train schedule registered." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Staff Assignments List
app.get("/api/admin/staff-assignments", async (req, res) => {
  try {
    const connection = await getConnection();
    const [rows] = await connection.execute(
      `SELECT sa.AssignmentID AS id, sa.StaffID, sa.TrainID, sa.AssignmentDate,
              s.Name AS staffName, s.Role, t.Name AS trainName
       FROM staffassignment sa
       JOIN staff s ON sa.StaffID = s.StaffID
       JOIN train t ON sa.TrainID = t.TrainID`,
    );
    await connection.end();
    res.json(sanitizeRows(rows));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add Staff Assignment (Validates conflicts)
app.post("/api/admin/staff-assignments", async (req, res) => {
  try {
    const { staffId, staffName, role, trainId, assignmentDate } = req.body;
    const connection = await getConnection();

    // 1. Resolve or dynamically create the staff record
    let dbStaffId = null;

    if (staffId && !isNaN(staffId)) {
      const [rows] = await connection.execute(
        "SELECT StaffID FROM staff WHERE StaffID = ?",
        [staffId],
      );
      if (rows.length > 0) {
        dbStaffId = rows[0].StaffID;
      }
    }

    if (!dbStaffId && staffName) {
      const [rows] = await connection.execute(
        "SELECT StaffID FROM staff WHERE Name = ?",
        [staffName],
      );
      if (rows.length > 0) {
        dbStaffId = rows[0].StaffID;
      } else {
        // Automatically insert staff if not found
        const [result] = await connection.execute(
          "INSERT INTO staff (Name, Role) VALUES (?, ?)",
          [staffName, role || "Driver"],
        );
        dbStaffId = result.insertId;
      }
    }

    if (!dbStaffId) {
      dbStaffId = 1; // Safeguard fallback ID
    }

    // 2. Conflict Rule Check: Staff member cannot be assigned to another train on the same date.
    const [conflict] = await connection.execute(
      `SELECT sa.*, t.Name AS trainName 
       FROM staffassignment sa
       JOIN train t ON sa.TrainID = t.TrainID
       WHERE sa.StaffID = ? AND sa.AssignmentDate = ? AND sa.TrainID != ?`,
      [dbStaffId, assignmentDate, trainId],
    );

    if (conflict.length > 0) {
      await connection.end();
      return res.status(409).json({
        message: `Scheduling Conflict: Staff member is already assigned to Train "${conflict[0].trainName}" on ${assignmentDate}.`,
      });
    }

    // 3. Create the assignment
    await connection.execute(
      `INSERT INTO staffassignment (StaffID, TrainID, AssignmentDate) VALUES (?, ?, ?)`,
      [dbStaffId, trainId, assignmentDate],
    );

    await connection.end();
    res
      .status(201)
      .json({ message: "Staff assignment recorded successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Staff Assignment
app.delete("/api/admin/staff-assignments/:id", async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const connection = await getConnection();
    await connection.execute(
      `DELETE FROM staffassignment WHERE AssignmentID = ?`,
      [assignmentId],
    );
    await connection.end();
    res.json({ message: "Staff assignment successfully deleted." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Freight Shipments List
app.get("/api/admin/freight-shipments", async (req, res) => {
  try {
    const connection = await getConnection();
    const [rows] = await connection.execute(
      `SELECT fs.ShipmentID AS id, fs.Shipper, fs.OriginStationID AS originId, fs.DestinationStationID AS destinationId,
              fs.CargoType, fs.Weight, fs.ContainerCount, fs.CurrentStatus, fs.AssignedTrainID,
              s_orig.Name AS originName, s_dest.Name AS destinationName, t.Name AS assignedTrainName
       FROM freightshipment fs
       JOIN station s_orig ON fs.OriginStationID = s_orig.StationID
       JOIN station s_dest ON fs.DestinationStationID = s_dest.StationID
       LEFT JOIN train t ON fs.AssignedTrainID = t.TrainID`,
    );
    await connection.end();
    res.json(sanitizeRows(rows));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add Freight Shipment
app.post("/api/admin/freight-shipments", async (req, res) => {
  try {
    const {
      shipper,
      originId,
      destinationId,
      cargoType,
      weight,
      containerCount,
      assignedTrainId,
    } = req.body;
    const connection = await getConnection();

    await connection.execute(
      `INSERT INTO freightshipment (Shipper, OriginStationID, DestinationStationID, CargoType, Weight, ContainerCount, CurrentStatus, AssignedTrainID)
       VALUES (?, ?, ?, ?, ?, ?, 'In Transit', ?)`,
      [
        shipper,
        originId,
        destinationId,
        cargoType,
        weight,
        containerCount,
        assignedTrainId,
      ],
    );

    await connection.end();
    res.status(201).json({ message: "Freight shipment manifest logged." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Maintenance List
app.get("/api/admin/maintenance", async (req, res) => {
  try {
    const connection = await getConnection();
    const [rows] = await connection.execute(
      `SELECT mr.RecordID AS id, mr.TrainID, mr.TrackID, mr.MaintenanceDate AS startDate,
              mr.Description, mr.MaintenanceStatus AS status,
              t.Name AS trainName
       FROM maintenancerecord mr
       LEFT JOIN train t ON mr.TrainID = t.TrainID`,
    );
    await connection.end();
    res.json(sanitizeRows(rows));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add Maintenance
app.post("/api/admin/maintenance", async (req, res) => {
  try {
    const { trainId, trackId, description, startDate } = req.body;
    const connection = await getConnection();

    await connection.execute(
      `INSERT INTO maintenancerecord (TrainID, TrackID, MaintenanceDate, Description, MaintenanceStatus)
       VALUES (?, ?, ?, ?, 'In Progress')`,
      [trainId || null, trackId || null, startDate, description],
    );

    await connection.end();
    res.status(201).json({ message: "Maintenance record registered." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------
// GET /api/admin/waitinglist (Report #4)
// ------------------------------------------------------------
app.get("/api/admin/waitinglist", async (req, res) => {
  try {
    const connection = await getConnection();
    const [rows] = await connection.execute(
      `SELECT wl.WaitingID AS id, 
              p.Name AS passengerName, 
              p.LoyaltyClass AS loyaltyClass, 
              t.Name AS trainName, 
              wl.TravelDate AS travelDate, 
              wl.CoachType AS coachType, 
              wl.WLStatus AS status, 
              wl.QueuePosition AS queuePosition
       FROM waitinglist wl
       JOIN passenger p ON wl.PassengerID = p.PassengerID
       LEFT JOIN trainschedule ts ON wl.ScheduleID = ts.ScheduleID
       LEFT JOIN train t ON ts.TrainID = t.TrainID
       ORDER BY t.Name, wl.TravelDate, 
         CASE p.LoyaltyClass
           WHEN 'Gold' THEN 1
           WHEN 'Silver' THEN 2
           WHEN 'Green' THEN 3
           ELSE 4
         END ASC,
         wl.QueuePosition ASC`,
    );
    await connection.end();
    res.json(sanitizeRows(rows));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
//  SECTION 3 — SYSTEM OPS & TASK AUTOMATIONS
// ============================================================

// Clean expired unpaid tickets
app.post("/api/system/cancel-expired", async (req, res) => {
  try {
    const connection = await getConnection();
    const [result] = await connection.execute(
      `UPDATE reservation 
       SET PaymentStatus = 'Canceled' 
       WHERE PaymentStatus = 'Pending' AND TravelDate < CURDATE()`,
    );
    await connection.end();
    res.json({
      message: `${result.affectedRows} expired pending reservations cancelled.`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Recalculate Passenger Loyalty Status
app.post("/api/system/update-loyalty", async (req, res) => {
  try {
    const connection = await getConnection();
    const [result] = await connection.execute(
      `UPDATE passenger
       SET LoyaltyClass = CASE
         WHEN LoyaltyMiles >= 100000 THEN 'Gold'
         WHEN LoyaltyMiles >= 50000  THEN 'Silver'
         WHEN LoyaltyMiles >= 10000  THEN 'Green'
         ELSE 'Regular'
       END`,
    );
    await connection.end();
    res.json({
      message: `Loyalty status classes updated for ${result.affectedRows} passenger profiles.`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Waiting List Promoted Queue Sync
app.post("/api/system/update-waitinglist", async (req, res) => {
  try {
    const { scheduleId, travelDate, coachType } = req.body;
    const connection = await getConnection();

    const [result] = await connection.execute(
      `UPDATE waitinglist
       SET WLStatus = 'Promoted'
       WHERE ScheduleID = ? AND TravelDate = ? AND CoachType = ? AND WLStatus = 'Waiting'
       ORDER BY QueuePosition ASC
       LIMIT 1`,
      [scheduleId, travelDate, coachType],
    );

    await connection.end();
    res.json({
      message:
        result.affectedRows > 0
          ? "First passenger in waitlist queue promoted to active booking status."
          : "No waitlisted passengers found matching the specified parameters.",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------
// GET /api/system/sensor-readings
// ------------------------------------------------------------
app.get("/api/system/sensor-readings", async (req, res) => {
  try {
    const connection = await getConnection();
    const [rows] = await connection.execute(
      `SELECT sr.ReadingID AS id, 
              sr.ReadingType AS readingType, 
              sr.ReadingValue AS readingValue, 
              sr.RecordedAt AS recordedAt,
              s.Name AS stationName,
              sr.TrackID AS trackId,
              s_start.Name AS startStationName, 
              s_end.Name AS endStationName
       FROM sensorreading sr
       LEFT JOIN station s ON sr.StationID = s.StationID
       LEFT JOIN tracksegment ts ON sr.TrackID = ts.TrackID
       LEFT JOIN station s_start ON ts.StartStationID = s_start.StationID
       LEFT JOIN station s_end ON ts.EndStationID = s_end.StationID
       ORDER BY sr.RecordedAt DESC`,
    );
    await connection.end();
    res.json(sanitizeRows(rows));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------
// POST /api/system/sensor-readings
// ------------------------------------------------------------
app.post("/api/system/sensor-readings", async (req, res) => {
  try {
    const { stationId, trackId, readingType, readingValue } = req.body;
    const connection = await getConnection();
    await connection.execute(
      `INSERT INTO sensorreading (StationID, TrackID, ReadingType, ReadingValue) 
       VALUES (?, ?, ?, ?)`,
      [
        stationId || null,
        trackId || null,
        readingType,
        parseFloat(readingValue),
      ],
    );
    await connection.end();
    res.status(201).json({ message: "Sensor reading logged successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// START APP LISTENER & INITIALIZE
// ============================================================
const PORT = 3000;

initializeMissingTables().then(() => {
  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(
      `Saudi-Turkiye Railway Corridor API Server Running on Port ${PORT}`,
    );
    console.log(`Base URL: http://localhost:${PORT}`);
    console.log(`======================================================\n`);
  });
});
