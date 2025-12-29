// Página de registro de nuevos usuarios
'use client'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './registro.module.css'

export default function RegistroPage() {
  const router = useRouter()
  
  // Estados para los campos del formulario
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })

  // Validar nombre (solo letras y espacios)
  const validateName = (name: string): string => {
    if (name.length < 2) {
      return 'El nombre debe tener al menos 2 caracteres'
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(name)) {
      return 'El nombre solo puede contener letras'
    }
    return ''
  }

  // Validar email
  const validateEmail = (email: string): string => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return 'Email inválido'
    }
    return ''
  }

  // Validar teléfono argentino
  const validatePhone = (phone: string): string => {
    // Eliminar espacios y guiones para validar
    const cleanPhone = phone.replace(/[\s\-]/g, '')
    if (cleanPhone.length < 8) {
      return 'El teléfono debe tener al menos 8 dígitos'
    }
    if (!/^\d+$/.test(cleanPhone)) {
      return 'El teléfono solo puede contener números'
    }
    return ''
  }

  // Validar fuerza de contraseña
  const validatePassword = (password: string): string => {
    if (password.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres'
    }
    if (!/[A-Za-z]/.test(password)) {
      return 'La contraseña debe contener al menos una letra'
    }
    if (!/\d/.test(password)) {
      return 'La contraseña debe contener al menos un número'
    }
    return ''
  }

  // Manejar cambios en los inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    setFormData({
      ...formData,
      [name]: value
    })

    // Validar en tiempo real
    let error = ''
    switch (name) {
      case 'name':
        error = validateName(value)
        break
      case 'email':
        error = validateEmail(value)
        break
      case 'phone':
        error = validatePhone(value)
        break
      case 'password':
        error = validatePassword(value)
        break
      case 'confirmPassword':
        error = value !== formData.password ? 'Las contraseñas no coinciden' : ''
        break
    }

    setFieldErrors({
      ...fieldErrors,
      [name]: error
    })
  }

  // Manejar envío del formulario
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validar todos los campos
    const nameError = validateName(formData.name)
    const emailError = validateEmail(formData.email)
    const phoneError = validatePhone(formData.phone)
    const passwordError = validatePassword(formData.password)
    
    // Validar que las contraseñas coincidan
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      setLoading(false)
      return
    }

    // Si hay errores, mostrarlos y no enviar
    if (nameError || emailError || phoneError || passwordError) {
      setFieldErrors({
        name: nameError,
        email: emailError,
        phone: phoneError,
        password: passwordError,
        confirmPassword: ''
      })
      setError('Por favor corrige los errores en el formulario')
      setLoading(false)
      return
    }

    try {
      // Llamar al endpoint de registro del backend NestJS
      const res = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          confirmPassword: formData.confirmPassword
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || data.error || 'Error al registrarse')
        setLoading(false)
        return
      }

      // Registro exitoso, redirigir al login
      router.push('/login?registered=true')

    } catch (err) {
      setError('Error de conexión con el servidor. Asegurate que el backend esté corriendo en el puerto 3000.')
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Crear Cuenta</h1>
        <p className={styles.subtitle}>
          Registrate para comenzar a comprar
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          
          {/* Campo de Nombre */}
          <div className={styles.inputGroup}>
            <label htmlFor="name">Nombre Completo</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Tu nombre"
              className={`${styles.input} ${fieldErrors.name ? styles.inputError : ''}`}
            />
            {fieldErrors.name && (
              <span className={styles.fieldError}>{fieldErrors.name}</span>
            )}
          </div>

          {/* Campo de Email */}
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="tu@email.com"
              className={`${styles.input} ${fieldErrors.email ? styles.inputError : ''}`}
            />
            {fieldErrors.email && (
              <span className={styles.fieldError}>{fieldErrors.email}</span>
            )}
          </div>

          {/* Campo de Teléfono */}
          <div className={styles.inputGroup}>
            <label htmlFor="phone">Teléfono</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="Ej: 11 1234-5678"
              className={`${styles.input} ${fieldErrors.phone ? styles.inputError : ''}`}
            />
            {fieldErrors.phone && (
              <span className={styles.fieldError}>{fieldErrors.phone}</span>
            )}
          </div>

          {/* Campo de Contraseña */}
          <div className={styles.inputGroup}>
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Mínimo 6 caracteres, letras y números"
              className={`${styles.input} ${fieldErrors.password ? styles.inputError : ''}`}
              minLength={6}
            />
            {fieldErrors.password && (
              <span className={styles.fieldError}>{fieldErrors.password}</span>
            )}
          </div>

          {/* Confirmar Contraseña */}
          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword">Confirmar Contraseña</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Repite tu contraseña"
              className={`${styles.input} ${fieldErrors.confirmPassword ? styles.inputError : ''}`}
              minLength={6}
            />
            {fieldErrors.confirmPassword && (
              <span className={styles.fieldError}>{fieldErrors.confirmPassword}</span>
            )}
          </div>

          {/* Mostrar error si existe */}
          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          {/* Botón de registro */}
          <button 
            type="submit" 
            className={styles.button}
            disabled={loading}
          >
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>

        {/* Link para ir al login */}
        <p className={styles.footer}>
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" className={styles.link}>
            Iniciar Sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
