import axios from 'axios'

// When served via the frontend container + nginx, use a relative `/api` path
// nginx will proxy `/api` to the backend service. For local dev override with VITE_API_URL.
const baseURL = import.meta.env.VITE_API_URL || '/api'

export default axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
})
