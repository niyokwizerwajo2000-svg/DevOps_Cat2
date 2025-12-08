import React, { useEffect, useState } from 'react'
import api from './api'

export default function App() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ bus: '', seat: '', price: '' })
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchTickets()
  }, [])

  async function fetchTickets() {
    setLoading(true)
    try {
      const res = await api.get('/tickets')
      setTickets(res.data.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (!form.bus || !form.seat || !form.price) {
      setError('Please fill all fields')
      return
    }

    try {
      const res = await api.post('/tickets', {
        bus: form.bus,
        seat: Number(form.seat),
        price: Number(form.price)
      })
      setTickets(prev => [res.data.data, ...prev])
      setForm({ bus: '', seat: '', price: '' })
    } catch (err) {
      setError(err.response?.data?.message || err.message)
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/tickets/${id}`)
      setTickets(prev => prev.filter(t => t.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="container">
      <h1>Ticket Booking</h1>

      <section className="form-section">
        <h2>Book Ticket</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Bus
            <input value={form.bus} onChange={e => setForm({ ...form, bus: e.target.value })} />
          </label>
          <label>
            Seat
            <input type="number" value={form.seat} onChange={e => setForm({ ...form, seat: e.target.value })} />
          </label>
          <label>
            Price
            <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
          </label>
          <button type="submit">Book</button>
        </form>
        {error && <div className="error">{error}</div>}
      </section>

      <section className="list-section">
        <h2>Available Tickets</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <ul className="tickets-list">
            {tickets.map(t => (
              <li key={t.id} className="ticket">
                <div>
                  <strong>{t.bus}</strong>
                  <div>Seat: {t.seat}</div>
                  <div>Price: {t.price}</div>
                </div>
                <div>
                  <button onClick={() => handleDelete(t.id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
