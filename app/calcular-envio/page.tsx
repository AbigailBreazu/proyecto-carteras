// Página para calcular envíos
// Por ahora es una página básica, después se puede integrar con APIs de correo
'use client'
import { useState } from 'react'
import styles from './calcular-envio.module.css'

export default function CalcularEnvioPage() {
  // Estados para almacenar los datos del formulario
  const [codigoPostal, setCodigoPostal] = useState('')
  const [resultado, setResultado] = useState<{
    costoEnvio: number
    tiempoEstimado: string
    courier: string
    zona: string
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Función para calcular el envío conectada al backend
  const calcularEnvio = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResultado(null)
    
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
      
      const res = await fetch(`${backendUrl}/envio/calcular`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigoPostal: codigoPostal.trim(),
          peso: 0.5, // Peso estimado en kg
          items: [] // Agregar items del carrito si es necesario
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Error al calcular el envío')
        setLoading(false)
        return
      }

      setResultado({
        costoEnvio: data.costoEnvio,
        tiempoEstimado: data.tiempoEstimado,
        courier: data.courier,
        zona: data.zona
      })
      setLoading(false)

    } catch (err) {
      console.error('Error:', err)
      setError('Error de conexión. Intenta nuevamente.')
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Calcular Costo de Envío</h1>
      
      <div className={styles.card}>
        <p className={styles.description}>
          Ingresá tu código postal para conocer el costo estimado de envío.
        </p>

        {/* Formulario para calcular envío */}
        <form onSubmit={calcularEnvio} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="cp" className={styles.label}>
              Código Postal
            </label>
            <input
              type="text"
              id="cp"
              value={codigoPostal}
              onChange={(e) => setCodigoPostal(e.target.value)}
              placeholder="Ej: 1000"
              className={styles.input}
              required
            />
          </div>

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? 'Calculando...' : 'Calcular Envío'}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        {/* Resultado del cálculo */}
        {resultado && (
          <div className={styles.result}>
            <h3>📦 Resultado del Envío</h3>
            <div className={styles.resultDetails}>
              <p className={styles.resultText}>
                💰 <strong>Costo:</strong> ${resultado.costoEnvio.toLocaleString('es-AR')}
              </p>
              <p className={styles.resultText}>
                ⏰ <strong>Tiempo estimado:</strong> {resultado.tiempoEstimado}
              </p>
              <p className={styles.resultText}>
                🚚 <strong>Courier:</strong> {resultado.courier}
              </p>
              <p className={styles.resultText}>
                📍 <strong>Zona:</strong> {resultado.zona}
              </p>
            </div>
            <p className={styles.note}>
              * El costo final puede variar según el peso y volumen del pedido
            </p>
          </div>
        )}

        {/* Información adicional sobre envíos */}
        <div className={styles.info}>
          <h3>Información sobre envíos</h3>
          <ul>
            <li>📦 Enviamos a todo el país</li>
            <li>🚚 Tiempo estimado: 3-7 días hábiles</li>
            <li>📍 Podés hacer seguimiento de tu pedido</li>
            <li>✅ Embalaje seguro para tus productos</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
