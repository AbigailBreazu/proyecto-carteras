'use client'
import { useState } from 'react'
import Link from 'next/link'
import styles from './contacto.module.css'

export default function ContactoPage() {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    mensaje: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleWhatsAppClick = () => {
    const mensaje = formData.mensaje 
      ? `Hola! Me llamo ${formData.nombre}. ${formData.mensaje}`
      : `Hola! Me gustaría consultar sobre los productos`
    
    const whatsappUrl = `https://wa.me/5492983520959?text=${encodeURIComponent(mensaje)}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Contactanos</h1>
        <p className={styles.subtitle}>
          Estamos aquí para ayudarte. Cada consulta es importante para nosotros.
        </p>
      </div>

      <div className={styles.contentGrid}>
        {/* Sección de información */}
        <div className={styles.infoSection}>
          <div className={styles.infoCard}>
            <div className={styles.iconWrapper}>
              <span className={styles.icon}>📍</span>
            </div>
            <h3>Ubicación</h3>
            <p>Felipe Solá, Provincia de Buenos Aires</p>
            <p className={styles.subtext}>Argentina</p>
          </div>

          <div className={styles.infoCard}>
            <div className={styles.iconWrapper}>
              <span className={styles.icon}>📱</span>
            </div>
            <h3>WhatsApp</h3>
            <a 
              href="https://wa.me/5492983520959" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.contactLink}
            >
              +54 9 2983 52-0959
            </a>
            <p className={styles.subtext}>Respuesta rápida y personalizada</p>
          </div>

          <div className={styles.infoCard}>
            <div className={styles.iconWrapper}>
              <span className={styles.icon}>⏰</span>
            </div>
            <h3>Horario de Atención</h3>
            <p>Lunes a Viernes: 9:00 - 18:00</p>
            <p>Sábados: 9:00 - 13:00</p>
            <p className={styles.subtext}>Respondemos consultas todos los días</p>
          </div>

          <div className={styles.aboutCard}>
            <h3>💝 Sobre Nuestro Trabajo</h3>
            <p>
              Cada pieza es creada a mano con dedicación y amor. Nos especializamos en 
              productos artesanales únicos, donde cada detalle cuenta una historia.
            </p>
            <p>
              Siempre estamos dispuestos a crear diseños personalizados y atender cada 
              consulta con la atención que merecés. Tu satisfacción es nuestra prioridad.
            </p>
            <div className={styles.features}>
              <div className={styles.feature}>
                <span>✓</span> Productos hechos a mano
              </div>
              <div className={styles.feature}>
                <span>✓</span> Diseños personalizados
              </div>
              <div className={styles.feature}>
                <span>✓</span> Atención personalizada
              </div>
              <div className={styles.feature}>
                <span>✓</span> Calidad artesanal garantizada
              </div>
            </div>
          </div>
        </div>

        {/* Formulario de contacto rápido */}
        <div className={styles.formSection}>
          <div className={styles.formCard}>
            <h2 className={styles.formTitle}>Envíanos un mensaje por WhatsApp</h2>
            <p className={styles.formSubtitle}>
              Completá el formulario y te contactaremos directamente por WhatsApp
            </p>

            <div className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="nombre">Tu Nombre *</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="¿Cómo te llamás?"
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="tu@email.com"
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="telefono">Teléfono</label>
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  placeholder="Tu número de contacto"
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="mensaje">Mensaje *</label>
                <textarea
                  id="mensaje"
                  name="mensaje"
                  value={formData.mensaje}
                  onChange={handleChange}
                  placeholder="¿En qué podemos ayudarte? Contanos qué estás buscando..."
                  rows={5}
                  required
                  className={styles.textarea}
                />
              </div>

              <button 
                onClick={handleWhatsAppClick}
                className={styles.submitButton}
                disabled={!formData.nombre || !formData.mensaje}
              >
                <span className={styles.whatsappIcon}>💬</span>
                Enviar por WhatsApp
              </button>

              <p className={styles.privacyNote}>
                Al enviar, aceptás que te contactemos por WhatsApp
              </p>
            </div>
          </div>

          {/* Mapa */}
          <div className={styles.mapCard}>
            <h3 className={styles.mapTitle}>📍 Nuestra Ubicación</h3>
            <div className={styles.mapContainer}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d102377.82195867443!2d-62.87!3d-38.73!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95eda356d7e43c57%3A0x4c8f6b7f5c8a9b4a!2sFelipe%20Sol%C3%A1%2C%20Buenos%20Aires!5e0!3m2!1ses-419!2sar!4v1703289123456!5m2!1ses-419!2sar"
                width="100%"
                height="300"
                style={{ border: 0, borderRadius: '12px' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <p className={styles.mapDescription}>
              Nos encontramos en Felipe Solá, Buenos Aires. ¡Estamos cerca tuyo!
            </p>
          </div>
        </div>
      </div>

      {/* Llamado a la acción */}
      <div className={styles.ctaSection}>
        <h2>¿Querés ver nuestros productos?</h2>
        <p>Explorá nuestro catálogo completo de carteras, riñoneras y más</p>
        <Link href="/productos" className={styles.ctaButton}>
          Ver Todos los Productos
        </Link>
      </div>
    </div>
  )
}
