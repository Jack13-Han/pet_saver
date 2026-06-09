const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/pet_saver/api'

class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

async function api(endpoint, options = {}) {
  const token = localStorage.getItem('token')
  const url = `${API_URL}/${endpoint}`

  const config = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    }
  }

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body)
  }

  try {
    const response = await fetch(url, config)
    const text = await response.text()
    const data = text ? JSON.parse(text) : {}

    if (!response.ok) {
      throw new ApiError(data?.error || `HTTP ${response.status}`, response.status)
    }
    return data
  } catch (err) {
    if (err instanceof ApiError) throw err
    throw new ApiError(`Network error: ${err.message}. Is PHP server running at ${API_URL}?`, 0)
  }
}

export const auth = {
  login: (username, password) => api('auth/login', { method: 'POST', body: { username, password } }),
  register: (username, email, password) => api('auth/register', { method: 'POST', body: { username, email, password } }),
}

export const user = {
  get: () => api('user'),
  update: (data) => api('user', { method: 'PUT', body: data }),
}

export const dashboard = {
  get: () => api('dashboard'),
}

export const targets = {
  list: (status = 'active') => api(`targets?status=${status}`),
  create: (data) => api('targets', { method: 'POST', body: data }),
  delete: (id) => api(`targets/${id}`, { method: 'DELETE' }),
}

export const transactions = {
  list: () => api('transactions'),
  create: (data) => api('transactions', { method: 'POST', body: data }),
}

export const avatars = {
  care: (data) => api('avatars/care', { method: 'POST', body: data }),
}

export const shop = {
  list: (category) => api(`shop${category ? `?category=${category}` : ''}`),
  buy: (accessoryId, targetId) => api('shop/buy', { method: 'POST', body: { accessory_id: accessoryId, target_id: targetId } }),
}

export const inventory = {
  list: () => api('inventory'),
}

export const achievements = {
  list: () => api('achievements'),
}

export const receipts = {
  list: () => api('receipts'),
  create: (data) => api('receipts', { method: 'POST', body: data }),
}

export const rankings = {
  list: () => api('rankings'),
}

export default api
