// Almacenamiento temporal de usuarios (por ahora en memoria)
// Después esto se migrará a una base de datos real

export interface User {
  id: string
  name: string
  email: string
  phone: string
  password: string // Hasheada
  role: 'user' | 'admin' // Rol del usuario
  createdAt: Date
  updatedAt: Date
}

// Array temporal para almacenar usuarios (se pierde al reiniciar el servidor)
// En producción, esto debe estar en una base de datos
let users: User[] = []

// Función para inicializar usuarios de prueba
const initializeTestUsers = async () => {
  if (users.length === 0) {
    const bcrypt = require('bcryptjs')
    
    // Usuario admin de prueba
    const adminPassword = await bcrypt.hash('admin123', 10)
    users.push({
      id: 'admin-001',
      name: 'Administrador',
      email: 'abiiibreazuuu@gmail.com',
      phone: '1234567890',
      password: adminPassword,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    })

    // Usuario regular de prueba
    const userPassword = await bcrypt.hash('user123', 10)
    users.push({
      id: 'user-001',
      name: 'Usuario Demo',
      email: 'user@example.com',
      phone: '0987654321',
      password: userPassword,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    })

    console.log('✅ Usuarios de prueba inicializados:')
    console.log('   Admin: abiiibreazuuu@gmail.com / admin123')
    console.log('   User:  user@example.com / user123')
  }
}

// Inicializar usuarios al cargar el módulo
initializeTestUsers()

export const usersDb = {
  // Obtener todos los usuarios
  getAll: () => users,
  
  // Buscar usuario por email
  findByEmail: async (email: string) => {
    // Asegurar que los usuarios de prueba estén inicializados
    await initializeTestUsers()
    return users.find(user => user.email.toLowerCase() === email.toLowerCase())
  },
  
  // Buscar usuario por ID
  findById: (id: string) => {
    return users.find(user => user.id === id)
  },
  
  // Crear nuevo usuario
  create: async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'role'>) => {
    // Asegurar que los usuarios de prueba estén inicializados
    await initializeTestUsers()
    
    const now = new Date()
    const newUser: User = {
      ...userData,
      id: Date.now().toString(), // ID simple (en BD real usarías UUID)
      role: 'user', // Por defecto todos son usuarios normales
      createdAt: now,
      updatedAt: now,
    }
    users.push(newUser)
    return newUser
  },

  // Actualizar rol de usuario (solo para admins)
  updateRole: (userId: string, role: 'user' | 'admin') => {
    const user = users.find(u => u.id === userId)
    if (user) {
      user.role = role
      user.updatedAt = new Date()
      return user
    }
    return null
  },

  // Actualizar rol por email
  updateRoleByEmail: (email: string, role: 'user' | 'admin') => {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase())
    if (user) {
      user.role = role
      user.updatedAt = new Date()
      return user
    }
    return null
  },
  
  // Eliminar todos los usuarios (para testing)
  clear: () => {
    users = []
  }
}
