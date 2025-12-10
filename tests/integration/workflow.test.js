const request = require('supertest');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();

/**
 * Integration tests for the full ticket booking workflow.
 * Tests complete user journeys and interactions between components.
 */

let db;

function createIntegrationApp() {
  const app = express();
  app.use(express.json());

  const dbPath = ':memory:';
  db = new sqlite3.Database(dbPath);

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

    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed sample data
    db.run(
      "INSERT INTO tickets (bus, seat, price) VALUES (?, ?, ?)",
      ['RITCO', 12, 5000]
    );
  });

  app.get('/tickets', (req, res) => {
    db.all('SELECT * FROM tickets ORDER BY id DESC', (err, rows) => {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }
      res.json({ success: true, data: rows || [] });
    });
  });

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

  return app;
}

describe('Ticket Booking API - Integration Tests', () => {
  let app;

  beforeAll((done) => {
    app = createIntegrationApp();
    done();
  });

  afterAll((done) => {
    if (db) {
      db.close(done);
    } else {
      done();
    }
  });

  describe('Complete Booking Workflow', () => {
    it('should complete full booking lifecycle: create, read, delete', async () => {
      // Step 1: Create ticket
      const createRes = await request(app)
        .post('/tickets')
        .send({
          bus: 'Easy Coach',
          seat: 22,
          price: 5200
        });
      expect(createRes.status).toBe(200);
      expect(createRes.body.success).toBe(true);
      const ticketId = createRes.body.data.id;

      // Step 2: Read the created ticket
      const getRes = await request(app).get(`/tickets/${ticketId}`);
      expect(getRes.status).toBe(200);
      expect(getRes.body.data.bus).toBe('Easy Coach');

      // Step 3: Delete the ticket
      const deleteRes = await request(app).delete(`/tickets/${ticketId}`);
      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);

      // Step 4: Verify deletion
      const verifyRes = await request(app).get(`/tickets/${ticketId}`);
      expect(verifyRes.status).toBe(404);
    });
  });

  describe('Multiple Concurrent Bookings', () => {
    it('should handle multiple ticket bookings sequentially', async () => {
      const buses = [
        { bus: 'Volcano', seat: 7, price: 4500 },
        { bus: 'KBS', seat: 15, price: 4800 },
        { bus: 'Nairobi Express', seat: 8, price: 4700 }
      ];

      const createdIds = [];

      for (const busData of buses) {
        const res = await request(app)
          .post('/tickets')
          .send(busData);
        expect(res.status).toBe(200);
        createdIds.push(res.body.data.id);
      }

      // Verify all were created
      const listRes = await request(app).get('/tickets');
      expect(listRes.body.data.length).toBeGreaterThanOrEqual(buses.length);

      // Clean up
      for (const id of createdIds) {
        await request(app).delete(`/tickets/${id}`);
      }
    });
  });

  describe('Data Persistence', () => {
    it('should persist tickets across multiple API calls', async () => {
      // Create two tickets
      const ticket1 = await request(app)
        .post('/tickets')
        .send({ bus: 'BusA', seat: 1, price: 1000 });
      const id1 = ticket1.body.data.id;

      const ticket2 = await request(app)
        .post('/tickets')
        .send({ bus: 'BusB', seat: 2, price: 2000 });
      const id2 = ticket2.body.data.id;

      // Retrieve list and verify both exist
      const listRes = await request(app).get('/tickets');
      const ticketIds = listRes.body.data.map(t => t.id);
      expect(ticketIds).toContain(id1);
      expect(ticketIds).toContain(id2);

      // Clean up
      await request(app).delete(`/tickets/${id1}`);
      await request(app).delete(`/tickets/${id2}`);
    });
  });

  describe('Error Handling & Edge Cases', () => {
    it('should prevent duplicate operations on same ticket', async () => {
      // Create a ticket
      const createRes = await request(app)
        .post('/tickets')
        .send({ bus: 'TestBus', seat: 5, price: 3000 });
      const ticketId = createRes.body.data.id;

      // Delete it
      await request(app).delete(`/tickets/${ticketId}`);

      // Try to delete again
      const secondDeleteRes = await request(app).delete(`/tickets/${ticketId}`);
      expect(secondDeleteRes.status).toBe(404);
    });

    it('should validate input data types', async () => {
      const invalidRequests = [
        { bus: null, seat: 5, price: 3000 },
        { bus: 'Bus', seat: null, price: 3000 },
        { bus: 'Bus', seat: 5, price: null }
      ];

      for (const req of invalidRequests) {
        const res = await request(app)
          .post('/tickets')
          .send(req);
        expect(res.status).toBe(400);
      }
    });

    it('should handle string price conversion', async () => {
      const res = await request(app)
        .post('/tickets')
        .send({
          bus: 'TestBus',
          seat: 10,
          price: '5000.50'
        });
      expect(res.status).toBe(200);
      expect(typeof res.body.data.price).toBe('number');
    });
  });

  describe('List Operations', () => {
    it('should return tickets in correct order (newest first)', async () => {
      // Create multiple tickets with delays
      const res1 = await request(app)
        .post('/tickets')
        .send({ bus: 'First', seat: 1, price: 1000 });
      const id1 = res1.body.data.id;

      const res2 = await request(app)
        .post('/tickets')
        .send({ bus: 'Second', seat: 2, price: 2000 });
      const id2 = res2.body.data.id;

      // List should have newest first
      const listRes = await request(app).get('/tickets');
      const ids = listRes.body.data.map(t => t.id);
      const index1 = ids.indexOf(id1);
      const index2 = ids.indexOf(id2);
      expect(index2).toBeLessThan(index1); // id2 should come before id1

      // Clean up
      await request(app).delete(`/tickets/${id1}`);
      await request(app).delete(`/tickets/${id2}`);
    });
  });
});
