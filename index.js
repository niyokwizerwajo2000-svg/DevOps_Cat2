const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");
require('dotenv').config();
const app = express();

app.use(express.json());
app.use(cors());

// Serve static files (index.html, CSS, JS, etc.)
app.use(express.static(path.join(__dirname, '.')));

// SQLite database setup
const dbPath = path.join(__dirname, 'tickets.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
    initializeDatabase();
  }
});

// Initialize database schema and seed data
function initializeDatabase() {
  db.serialize(() => {
    // Create tickets table
    db.run(`
      CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bus TEXT NOT NULL,
        seat INTEGER NOT NULL,
        price REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Error creating tickets table:', err);
      else console.log('Tickets table ready');
      
      // Seed sample data if table is empty
      db.get('SELECT COUNT(*) as count FROM tickets', (err, row) => {
        if (row && row.count === 0) {
          const sampleData = [
            { bus: 'RITCO', seat: 12, price: 5000 },
            { bus: 'Volcano', seat: 7, price: 4500 },
            { bus: 'KBS', seat: 15, price: 4800 },
            { bus: 'Easy Coach', seat: 22, price: 5200 },
            { bus: 'Nairobi Express', seat: 8, price: 4700 }
          ];
          
          sampleData.forEach(ticket => {
            db.run(
              'INSERT INTO tickets (bus, seat, price) VALUES (?, ?, ?)',
              [ticket.bus, ticket.seat, ticket.price],
              (err) => {
                if (err) console.error('Error inserting sample data:', err);
              }
            );
          });
          console.log('Sample data inserted');
        }
      });
    });

    // Create users table (optional)
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Error creating users table:', err);
      else console.log('Users table ready');
    });
  });
}

// Home route
app.get("/", (req, res) => {
  res.send("Ticket Booking Backend API is running...");
});

// Get all tickets
app.get("/tickets", (req, res) => {
  db.all("SELECT * FROM tickets ORDER BY id DESC", (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    res.json({
      success: true,
      data: rows || []
    });
  });
});

// Book a ticket
app.post("/tickets", (req, res) => {
  const { bus, seat, price } = req.body;

  if (!bus || !seat || !price) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }

  db.run(
    "INSERT INTO tickets (bus, seat, price) VALUES (?, ?, ?)",
    [bus, seat, price],
    function(err) {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }
      
      db.get("SELECT * FROM tickets WHERE id = ?", [this.lastID], (err, row) => {
        if (err) {
          return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, data: row });
      });
    }
  );
});

// Get single ticket
app.get("/tickets/:id", (req, res) => {
  db.get("SELECT * FROM tickets WHERE id = ?", [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    if (!row) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }
    res.json({ success: true, data: row });
  });
});

// Delete a ticket
app.delete("/tickets/:id", (req, res) => {
  db.run("DELETE FROM tickets WHERE id = ?", [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }
    res.json({ success: true, message: "Ticket deleted" });
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Ticket Booking Backend running on port ${PORT}`);
});

