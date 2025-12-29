// Helper para hacer peticiones autenticadas al backend
import { getSession } from 'next-auth/react'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'

interface FetchOptions extends RequestInit {
  requireAuth?: boolean
}

export async function fetchBackend(endpoint: string, options: FetchOptions = {}) {
  const { requireAuth = false, ...fetchOptions } = options

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  }

  // Si requiere autenticación, agregar el token
  if (requireAuth) {
    const session = await getSession()
    if (session?.accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${session.accessToken}`
    }
  }

  const url = endpoint.startsWith('http') ? endpoint : `${BACKEND_URL}${endpoint}`

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  })

  return response
}

// Métodos auxiliares
export const api = {
  get: (endpoint: string, requireAuth = false) =>
    fetchBackend(endpoint, { method: 'GET', requireAuth }),

  post: (endpoint: string, data: any, requireAuth = false) =>
    fetchBackend(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth,
    }),

  put: (endpoint: string, data: any, requireAuth = false) =>
    fetchBackend(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      requireAuth,
    }),

  delete: (endpoint: string, requireAuth = false) =>
    fetchBackend(endpoint, { method: 'DELETE', requireAuth }),

  upload: async (endpoint: string, formData: FormData, requireAuth = false) => {
    const session = requireAuth ? await getSession() : null
    const headers: HeadersInit = {}

    if (session?.accessToken) {
      headers['Authorization'] = `Bearer ${session.accessToken}`
    }

    const url = endpoint.startsWith('http') ? endpoint : `${BACKEND_URL}${endpoint}`

    return fetch(url, {
      method: 'POST',
      body: formData,
      headers,
    })
  },
}

// Funciones específicas para cada recurso
export const productos = {
  getAll: () => api.get('/api/productos'),
  getById: (id: string) => api.get(`/api/productos/${id}`),
  create: (data: any) => api.post('/api/admin/productos', data, true),
  update: (id: string, data: any) => api.put(`/productos/${id}`, data, true),
  delete: (id: string) => api.delete(`/productos/${id}`, true),
}

export const ordenes = {
  getMisPedidos: () => api.get('/ordenes/mis-pedidos', true),
  getAll: () => api.get('/ordenes', true),
  create: (data: any) => api.post('/ordenes', data, true),
  updateEstado: (id: string, estado: string) => 
    api.put(`/ordenes/${id}/estado`, { estado }, true),
}

export const upload = {
  images: (formData: FormData) => api.upload('/upload/images', formData, true),
}

export const envio = {
  calcular: (data: { codigoPostal: string; peso: number; items?: any[] }) =>
    api.post('/envio/calcular', data),
}

export default api
