// API Configuration
// Use environment variable or fallback to local proxy
export const API_URL = import.meta.env.VITE_API_URL || '/api'

// Backend base URL (without /api)
export const BACKEND_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000'

