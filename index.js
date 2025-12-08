const express = require("express");
const mysql = require("mysql2/promise");
const app = express();

app.use(express.json());

// MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "mysql",
  user: process.env.DB_USER || "ticketuser",
  password: process.env.DB_PASSWORD || "ticketpass123",
  database: process.env.DB_NAME || "ticket_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Home route
app.get("/", (req, res) => {
  res.send("Ticket Booking Backend API is running...");
});

// Get all tickets
app.get("/tickets", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [tickets] = await connection.query("SELECT * FROM tickets");
    connection.release();
    res.json({
      success: true,
      data: tickets
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Book a ticket
app.post("/tickets", async (req, res) => {
  const { bus, seat, price } = req.body;

  if (!bus || !seat || !price) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }

  try {
    const connection = await pool.getConnection();
    await connection.query("INSERT INTO tickets (bus, seat, price) VALUES (?, ?, ?)", [bus, seat, price]);
    const [newTicket] = await connection.query("SELECT * FROM tickets ORDER BY id DESC LIMIT 1");
    connection.release();
    res.json({ success: true, data: newTicket[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single ticket
app.get("/tickets/:id", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [ticket] = await connection.query("SELECT * FROM tickets WHERE id = ?", [req.params.id]);
    connection.release();

    if (!ticket || ticket.length === 0) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    res.json({ success: true, data: ticket[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete a ticket
app.delete("/tickets/:id", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [result] = await connection.query("DELETE FROM tickets WHERE id = ?", [req.params.id]);
    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    res.json({ success: true, message: "Ticket deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Ticket Booking Backend running on port ${PORT}`);
});

