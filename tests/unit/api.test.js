const request = require('supertest');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Mock database setup
let db;

// Test Express app (minimal setup)
function createTestApp() {
  const app = express();
  app.use(express.json());

  const dbPath = ':memory:'; // Use in-memory database for tests
  db = new sqlite3.Database(dbPath);

  // Initialize test database
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bus TEXT NOT NULL,
        seat INTEGER NOT NULL,
        price REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  });

  // Home route
  app.get('/', (req, res) => {
    res.send('Ticket Booking Backend API is running...');
  });

  // Get all tickets
  app.get('/tickets', (req, res) => {
    db.all('SELECT * FROM tickets ORDER BY id DESC', (err, rows) => {
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
  app.post('/tickets', (req, res) => {
    const { bus, seat, price } = req.body;

    if (!bus || !seat || !price) {
      return res.status(400).json({ success: false, message: 'Missing fields' });
    }

    db.run(
      'INSERT INTO tickets (bus, seat, price) VALUES (?, ?, ?)',
      [bus, seat, price],
      function(err) {
        if (err) {
          return res.status(500).json({ success: false, message: err.message });
        }

        db.get('SELECT * FROM tickets WHERE id = ?', [this.lastID], (err, row) => {
          if (err) {
            return res.status(500).json({ success: false, message: err.message });
          }
          res.json({ success: true, data: row });
        });
      }
    );
  });

  // Get single ticket
  app.get('/tickets/:id', (req, res) => {
    db.get('SELECT * FROM tickets WHERE id = ?', [req.params.id], (err, row) => {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }
      if (!row) {
        return res.status(404).json({ success: false, message: 'Ticket not found' });
      }
      res.json({ success: true, data: row });
    });
  });

  // Delete a ticket
  app.delete('/tickets/:id', (req, res) => {
    db.run('DELETE FROM tickets WHERE id = ?', [req.params.id], function(err) {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ success: false, message: 'Ticket not found' });
      }
      res.json({ success: true, message: 'Ticket deleted' });
    });
  });

  return app;
}

describe('Ticket Booking API - Unit Tests', () => {
  let app;

  beforeAll((done) => {
    app = createTestApp();
    done();
  });

  afterAll((done) => {
    if (db) {
      db.close(done);
    } else {
      done();
    }
  });

  describe('GET /', () => {
    it('should return API status message', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Ticket Booking Backend API is running');
    });
  });

  describe('GET /tickets', () => {
    it('should return empty tickets array on first call', async () => {
      const res = await request(app).get('/tickets');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /tickets', () => {
    it('should create a new ticket with valid data', async () => {
      const res = await request(app)
        .post('/tickets')
        .send({
          bus: 'RITCO',
          seat: 12,
          price: 5000
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bus).toBe('RITCO');
      expect(res.body.data.seat).toBe(12);
      expect(res.body.data.price).toBe(5000);
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/tickets')
        .send({
          bus: 'RITCO'
        });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Missing fields');
    });

    it('should handle price as number', async () => {
      const res = await request(app)
        .post('/tickets')
        .send({
          bus: 'KBS',
          seat: 15,
          price: 4800.50
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.price).toBe(4800.50);
    });
  });

  describe('GET /tickets/:id', () => {
    let ticketId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/tickets')
        .send({ bus: 'TestBus', seat: 5, price: 3000 });
      ticketId = res.body.data.id;
    });

    it('should retrieve a ticket by ID', async () => {
      const res = await request(app).get(`/tickets/${ticketId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(ticketId);
      expect(res.body.data.bus).toBe('TestBus');
    });

    it('should return 404 for non-existent ticket', async () => {
      const res = await request(app).get('/tickets/9999');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('not found');
    });
  });

  describe('DELETE /tickets/:id', () => {
    let ticketId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/tickets')
        .send({ bus: 'DeleteTestBus', seat: 10, price: 2000 });
      ticketId = res.body.data.id;
    });

    it('should delete a ticket by ID', async () => {
      const res = await request(app).delete(`/tickets/${ticketId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('deleted');
    });

    it('should return 404 when deleting non-existent ticket', async () => {
      const res = await request(app).delete('/tickets/9999');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
