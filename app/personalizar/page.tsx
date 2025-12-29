'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './personalizar.module.css';

// Helper para normalizar URLs de imágenes
function normalizeImageUrl(url: string): string {
  if (!url) return url;
  
  // Si es URL completa del backend
  if (url.startsWith('http://localhost:3000/') || url.startsWith('https://localhost:3000/')) {
    // Si falta /uploads/, agregarlo
    if (url.match(/https?:\/\/localhost:3000\/(disenos-base|telas|disenos)\//)) {
      return url.replace(/^(https?:\/\/localhost:3000)\/(disenos-base|telas|disenos)\//, '$1/uploads/$2/');
    }
    return url;
  }
  
  // Si es ruta relativa sin /uploads/, agregarlo
  if (url.match(/^\/(disenos-base|telas|disenos)\//)) {
    return `/uploads${url}`;
  }
  
  return url;
}

type DisenoBase = {
  id: string;
  nombre: string;
  imagenes: string[];
  imagenPrincipal: string;
  fechaCreacion: string;
};

type Tela = {
  id: string;
  nombre: string;
  imagenes: string[];
  imagenPrincipal: string;
  categoria: 'lona' | 'film-transparente' | 'cuero';
  especialPara?: string;
  elasticidad: 'si' | 'no' | 'media';
  lavable: 'si' | 'no' | 'media';
  fechaCreacion: string;
};

export default function PersonalizarPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pedidoId = searchParams?.get('pedidoId');
  
  const [disenosBase, setDisenosBase] = useState<DisenoBase[]>([]);
  const [telas, setTelas] = useState<Tela[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Wizard multi-paso
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  
  // Selecciones del usuario
  const [disenoSeleccionado, setDisenoSeleccionado] = useState<string | null>(null);
  const [disenoPropio, setDisenoPropio] = useState<File[]>([]);
  const [disenoPropioPrev, setDisenoPropioPrev] = useState<string[]>([]);
  const [telasSeleccionadas, setTelasSeleccionadas] = useState<string[]>([]);
  const [comentarios, setComentarios] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState<'error' | 'success' | ''>('');
  
  // Resumen flotante
  const [showSummary, setShowSummary] = useState(false);
  
  // Estados para hover y detalles de telas
  const [telaHovered, setTelaHovered] = useState<string | null>(null);
  const [telaDetalles, setTelaDetalles] = useState<string | null>(null);

  // Estados para paginado
  const [paginaDisenosBase, setPaginaDisenosBase] = useState(1);
  const [paginaTelas, setPaginaTelas] = useState(1);
  const itemsPorPagina = 4;

  // Estados para sistema de edición
  const [modoEdicion, setModoEdicion] = useState(false);
  const [puedeEditar, setPuedeEditar] = useState(false);
  const [solicitudPendiente, setSolicitudPendiente] = useState(false);
  const [modificacionesRestantes, setModificacionesRestantes] = useState<number | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [motivoModificacion, setMotivoModificacion] = useState('');

  // Calcular items paginados
  const getDisenosBasePaginados = () => {
    const inicio = (paginaDisenosBase - 1) * itemsPorPagina;
    const fin = inicio + itemsPorPagina;
    return disenosBase.slice(inicio, fin);
  };

  const getTelasPaginadas = () => {
    const inicio = (paginaTelas - 1) * itemsPorPagina;
    const fin = inicio + itemsPorPagina;
    return telas.slice(inicio, fin);
  };

  const totalPaginasDisenosBase = Math.ceil(disenosBase.length / itemsPorPagina);
  const totalPaginasTelas = Math.ceil(telas.length / itemsPorPagina);

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }
    cargarDatos();
    
    if (pedidoId) {
      setModoEdicion(true);
      verificarPermisosEdicion();
      cargarPedidoExistente();
    }
  }, [session, router, pedidoId]);

  const verificarPermisosEdicion = async () => {
    if (!pedidoId) return;
    
    try {
      const response = await fetch(`/api/personalizacion/pedidos/${pedidoId}/puede-editar`);
      const data = await response.json();
      
      setPuedeEditar(data.puedeEditar);
      setSolicitudPendiente(data.solicitudPendiente || false);
      setModificacionesRestantes(data.modificacionesRestantes || null);
    } catch (error) {
      console.error('Error al verificar permisos:', error);
    }
  };

  const cargarPedidoExistente = async () => {
    if (!pedidoId) return;
    
    try {
      const response = await fetch(`/api/personalizacion/pedidos/${pedidoId}`);
      const pedido = await response.json();
      
      console.log('📦 Pedido cargado para edición:', pedido);
      
      // Cargar diseño base seleccionado
      if (pedido.disenoBase) {
        const disenoBaseId = typeof pedido.disenoBase === 'object' 
          ? pedido.disenoBase.id 
          : pedido.disenoBase;
        setDisenoSeleccionado(disenoBaseId);
        console.log('✅ Diseño base cargado:', disenoBaseId);
      }
      
      // Cargar diseño propio si existe
      if (pedido.disenoPropio) {
        // Crear preview del diseño propio existente
        const disenoUrl = typeof pedido.disenoPropio === 'string' ? pedido.disenoPropio : '';
        if (disenoUrl) {
          setDisenoPropioPrev([disenoUrl]);
          console.log('✅ Diseño propio cargado:', disenoUrl);
        }
      }
      
      // Cargar telas seleccionadas (extraer solo los IDs)
      if (pedido.telas && Array.isArray(pedido.telas)) {
        const telasIds = pedido.telas.map((t: any) => 
          typeof t === 'object' ? t.id : t
        );
        setTelasSeleccionadas(telasIds);
        console.log('✅ Telas cargadas:', telasIds);
      } else if (pedido.telasSeleccionadas && Array.isArray(pedido.telasSeleccionadas)) {
        setTelasSeleccionadas(pedido.telasSeleccionadas);
        console.log('✅ Telas cargadas (telasSeleccionadas):', pedido.telasSeleccionadas);
      }
      
      // Cargar comentarios
      if (pedido.comentarios) {
        setComentarios(pedido.comentarios);
        console.log('✅ Comentarios cargados');
      }
    } catch (error) {
      console.error('Error al cargar pedido:', error);
      setMensaje('Error al cargar los datos del pedido');
      setTipoMensaje('error');
      setTimeout(() => setMensaje(''), 3000);
    }
  };

  const solicitarAutorizacion = async () => {
    if (!pedidoId || !motivoModificacion.trim()) {
      setMensaje('Debes explicar el motivo de la modificación');
      setTipoMensaje('error');
      setTimeout(() => setMensaje(''), 3000);
      return;
    }
    
    try {
      const response = await fetch(`/api/personalizacion/pedidos/${pedidoId}/solicitar-modificacion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: motivoModificacion })
      });
      
      if (response.ok) {
        setSolicitudPendiente(true);
        setShowAuthModal(false);
        setMensaje('✅ Solicitud enviada al administrador. Te notificaremos cuando sea aprobada.');
        setTipoMensaje('success');
        setTimeout(() => setMensaje(''), 4000);
      } else {
        const error = await response.json();
        setMensaje('Error: ' + error.error);
        setTipoMensaje('error');
        setTimeout(() => setMensaje(''), 3000);
      }
    } catch (error) {
      console.error('Error:', error);
      setMensaje('Error al enviar solicitud');
      setTipoMensaje('error');
      setTimeout(() => setMensaje(''), 3000);
    }
  };

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [disenosRes, telasRes] = await Promise.all([
        fetch('/api/personalizacion/disenos-base'),
        fetch('/api/personalizacion/telas')
      ]);

      const disenosData = await disenosRes.json();
      const telasData = await telasRes.json();

      const disenosNormalizados = disenosData.map((d: any) => ({
        ...d,
        imagenPrincipal: typeof d.imagenPrincipal === 'string' 
          ? d.imagenPrincipal.replace(/^\/+/, '') 
          : '',
        imagenes: Array.isArray(d.imagenes) 
          ? d.imagenes.map((img: string) => img.replace(/^\/+/, '')) 
          : []
      }));

      const telasNormalizadas = telasData.map((t: any) => ({
        ...t,
        imagenPrincipal: typeof t.imagenPrincipal === 'string' 
          ? t.imagenPrincipal.replace(/^\/+/, '') 
          : (typeof t.url === 'string' ? t.url.replace(/^\/+/, '') : ''),
        imagenes: Array.isArray(t.imagenes) 
          ? t.imagenes.map((img: string) => img.replace(/^\/+/, '')) 
          : []
      }));

      setDisenosBase(disenosNormalizados);
      setTelas(telasNormalizadas);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar diseños y telas');
    } finally {
      setLoading(false);
    }
  };

  const handleDisenoPropio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    
    // Combinar archivos existentes con los nuevos
    const allFiles = [...disenoPropio, ...newFiles];
    
    if (allFiles.length > 5) {
      setMensaje('Puedes subir máximo 5 imágenes');
      setTipoMensaje('error');
      setTimeout(() => setMensaje(''), 3000);
      return;
    }

    if (newFiles.length > 0) {
      setDisenoPropio(allFiles);
      setDisenoSeleccionado(null);
      
      // Crear previews para los nuevos archivos
      const newPreviews: string[] = [];
      let loadedCount = 0;
      
      newFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result as string);
          loadedCount++;
          
          if (loadedCount === newFiles.length) {
            setDisenoPropioPrev([...disenoPropioPrev, ...newPreviews]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
    
    // Resetear el input para permitir subir el mismo archivo otra vez
    e.target.value = '';
  };

  const removeDisenoPropio = (index: number) => {
    const newFiles = disenoPropio.filter((_, i) => i !== index);
    const newPrevs = disenoPropioPrev.filter((_, i) => i !== index);
    setDisenoPropio(newFiles);
    setDisenoPropioPrev(newPrevs);
  };

  const handleDisenoBaseClick = (disenoId: string) => {
    setDisenoSeleccionado(disenoId);
    setDisenoPropio([]);
    setDisenoPropioPrev([]);
  };

  const toggleTela = (telaId: string) => {
    if (telasSeleccionadas.includes(telaId)) {
      setTelasSeleccionadas(telasSeleccionadas.filter(t => t !== telaId));
    } else {
      setTelasSeleccionadas([...telasSeleccionadas, telaId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // En modo edición, al menos uno debe estar presente (puede ser el que ya tenía)
    // En modo creación, debe seleccionar uno
    if (!modoEdicion && !disenoSeleccionado && disenoPropio.length === 0) {
      setMensaje('Debes seleccionar un modelo del catálogo o subir tus propias imágenes');
      setTipoMensaje('error');
      setTimeout(() => setMensaje(''), 3000);
      return;
    }

    // En modo edición: si tiene disenoPropioPrev (ya tenía diseño propio) o disenoSeleccionado (diseño base)
    // está bien aunque no cambie nada
    if (modoEdicion && !disenoSeleccionado && disenoPropio.length === 0 && disenoPropioPrev.length === 0) {
      setMensaje('El pedido debe tener un diseño');
      setTipoMensaje('error');
      setTimeout(() => setMensaje(''), 3000);
      return;
    }

    if (telasSeleccionadas.length === 0) {
      setMensaje('Debes seleccionar al menos una tela');
      setTipoMensaje('error');
      setTimeout(() => setMensaje(''), 3000);
      return;
    }

    setEnviando(true);

    try {
      const formData = new FormData();
      
      // Solo agregar diseño propio si el usuario subió nuevos archivos
      if (disenoPropio.length > 0) {
        disenoPropio.forEach((file) => {
          formData.append('disenoPropio', file);
        });
      }
      
      // Solo agregar disenoBaseId si tiene un valor válido
      // En modo edición, si no cambió el diseño, no enviar este campo
      if (disenoSeleccionado) {
        formData.append('disenoBaseId', disenoSeleccionado);
      }
      
      formData.append('telasSeleccionadas', JSON.stringify(telasSeleccionadas));
      formData.append('comentarios', comentarios);

      const url = modoEdicion && pedidoId 
        ? `/api/personalizacion/pedidos/${pedidoId}`
        : '/api/personalizacion/pedidos';
      
      const method = modoEdicion && pedidoId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        body: formData
      });

      console.log('📤 Response status:', response.status);
      console.log('📤 Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Respuesta exitosa:', data);
        
        const textoExito = modoEdicion 
          ? '✅ Pedido actualizado exitosamente!' 
          : '✅ Pedido enviado con éxito! Te contactaremos pronto para confirmar los detalles.';
        
        setShowSummary(false); // Cerrar modal de resumen
        setMensaje(textoExito);
        setTipoMensaje('success');
        
        if (data.modificacionesRestantes !== undefined) {
          setModificacionesRestantes(data.modificacionesRestantes);
        }
        
        setTimeout(() => {
          router.push('/mis-pedidos');
        }, 3000);
      } else {
        const errorText = await response.text();
        console.error('❌ Error response status:', response.status);
        console.error('❌ Error response text:', errorText);
        
        let errorMessage = 'Error al procesar el pedido';
        try {
          const errorJson = JSON.parse(errorText);
          console.error('❌ Error JSON:', errorJson);
          errorMessage = errorJson.error || errorJson.message || JSON.stringify(errorJson);
        } catch (e) {
          console.error('❌ No se pudo parsear el error como JSON');
          errorMessage = errorText || `Error ${response.status}`;
        }
        
        setShowSummary(false); // Cerrar modal
        setMensaje('Error: ' + errorMessage);
        setTipoMensaje('error');
      }
    } catch (error: any) {
      console.error('💥 Error completo:', error);
      setMensaje('Error: ' + (error.message || 'Error al enviar el pedido'));
      setTipoMensaje('error');
    } finally {
      setEnviando(false);
      setTimeout(() => setMensaje(''), 5000);
    }
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!disenoSeleccionado && disenoPropio.length === 0) {
        setMensaje('Debes seleccionar un diseño para continuar');
        setTipoMensaje('error');
        setTimeout(() => setMensaje(''), 3000);
        return;
      }
    }
    
    if (currentStep === 2) {
      if (telasSeleccionadas.length === 0) {
        setMensaje('Debes seleccionar al menos una tela para continuar');
        setTipoMensaje('error');
        setTimeout(() => setMensaje(''), 3000);
        return;
      }
    }
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowSummary(true);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getStepTitle = () => {
    switch(currentStep) {
      case 1: return '1. Elige tu Diseño';
      case 2: return '2. Selecciona las Telas';
      case 3: return '3. Especificaciones Adicionales';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Cargando opciones de personalización...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          {modoEdicion ? '✏️ Editar Pedido Personalizado' : '🎨 Personaliza Tu Cartera'}
        </h1>
        <p className={styles.subtitle}>
          {modoEdicion 
            ? 'Realiza cambios a tu pedido personalizado'
            : 'Elige un modelo del catálogo o sube el tuyo, selecciona las telas y déjanos tus especificaciones'
          }
        </p>
        
        {modoEdicion && !puedeEditar && !solicitudPendiente && (
          <div className={styles.warningBanner}>
            <p>⚠️ Para editar este pedido necesitas autorización del administrador</p>
            <button 
              onClick={() => setShowAuthModal(true)}
              className={styles.requestAuthBtn}
            >
              📝 Solicitar Autorización
            </button>
          </div>
        )}
        
        {solicitudPendiente && (
          <div className={styles.infoBanner}>
            <p>⏳ Solicitud de modificación pendiente de aprobación</p>
          </div>
        )}
        
        {puedeEditar && modificacionesRestantes !== null && (
          <div className={styles.successBanner}>
            <p>✅ Autorizado para editar (Modificaciones restantes: {modificacionesRestantes})</p>
          </div>
        )}
      </header>

      <div className={styles.wizardSteps}>
        {[1, 2, 3].map(step => (
          <div key={step} className={styles.wizardStepContainer}>
            <div 
              className={`${styles.wizardStep} ${currentStep === step ? styles.active : ''} ${currentStep > step ? styles.completed : ''}`}
              onClick={() => {
                if (currentStep > step || (modoEdicion && puedeEditar)) {
                  setCurrentStep(step);
                }
              }}
            >
              <div className={styles.stepNumber}>
                {currentStep > step ? '✓' : step}
              </div>
              <span className={styles.stepLabel}>
                {step === 1 && 'Diseño'}
                {step === 2 && 'Telas'}
                {step === 3 && 'Detalles'}
              </span>
            </div>
            {step < 3 && <div className={styles.stepConnector}></div>}
          </div>
        ))}
      </div>

      {mensaje && (
        <div className={`${styles.mensaje} ${tipoMensaje === 'error' ? styles.mensajeError : styles.mensajeSuccess}`}>
          {mensaje}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        
        {/* Mostrar selección actual en modo edición */}
        {modoEdicion && (
          <div className={styles.infoEdicion}>
            <h3>📝 Editando pedido existente</h3>
            
            {/* Mostrar diseño seleccionado */}
            {disenoSeleccionado ? (
              <div className={styles.seleccionActual}>
                <p>✓ Diseño base seleccionado:</p>
                {(() => {
                  const diseno = disenosBase.find(d => d.id === disenoSeleccionado);
                  return diseno ? (
                    <div className={styles.miniPreview}>
                      <img 
                        src={normalizeImageUrl(diseno.imagenPrincipal)} 
                        alt={diseno.nombre}
                        className={styles.miniImg}
                      />
                      <strong>{diseno.nombre}</strong>
                    </div>
                  ) : (
                    <strong>Cargando...</strong>
                  );
                })()}
              </div>
            ) : disenoPropioPrev.length > 0 ? (
              <div className={styles.seleccionActual}>
                <p>✓ Diseño propio subido:</p>
                <div className={styles.miniPreview}>
                  <img 
                    src={disenoPropioPrev[0]} 
                    alt="Diseño propio"
                    className={styles.miniImg}
                  />
                  <strong>Diseño personalizado</strong>
                </div>
              </div>
            ) : null}
            
            {/* Mostrar telas seleccionadas */}
            {telasSeleccionadas.length > 0 && (
              <div className={styles.seleccionActual}>
                <p>✓ Telas seleccionadas: <strong>{telasSeleccionadas.length} tela(s)</strong></p>
                <div className={styles.telasGrid}>
                  {telasSeleccionadas.slice(0, 4).map(telaId => {
                    const tela = telas.find(t => t.id === telaId);
                    return tela ? (
                      <div key={telaId} className={styles.miniTela}>
                        <img 
                          src={normalizeImageUrl(tela.imagenPrincipal)} 
                          alt={tela.nombre}
                          className={styles.miniImgTela}
                        />
                        <span>{tela.nombre}</span>
                      </div>
                    ) : null;
                  })}
                  {telasSeleccionadas.length > 4 && (
                    <span className={styles.masItems}>+{telasSeleccionadas.length - 4} más</span>
                  )}
                </div>
              </div>
            )}
            
            <p className={styles.infoTexto}>Podés cambiar tus selecciones o agregar más items</p>
          </div>
        )}
        
        {currentStep === 1 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{getStepTitle()}</h2>
            
            <div className={styles.disenoOptions}>
              <div className={styles.option}>
                <h3>Diseños Base Disponibles</h3>
                {disenosBase.length === 0 ? (
                  <p className={styles.empty}>No hay diseños base disponibles aún</p>
                ) : (
                  <>
                    <div className={styles.grid}>
                      {getDisenosBasePaginados().map(diseno => (
                        <div
                          key={diseno.id}
                          className={`${styles.card} ${disenoSeleccionado === diseno.id ? styles.selected : ''}`}
                          onClick={() => handleDisenoBaseClick(diseno.id)}
                        >
                          <img 
                            src={normalizeImageUrl(diseno.imagenPrincipal)} 
                            alt={diseno.nombre} 
                            className={styles.image}
                            onError={(e) => {
                            console.error('Error cargando imagen:', diseno.imagenPrincipal);
                            e.currentTarget.src = '/placeholder.png';
                          }}
                        />
                        <p className={styles.cardTitle}>{diseno.nombre}</p>
                        {disenoSeleccionado === diseno.id && (
                          <div className={styles.checkmark}>✓</div>
                        )}
                      </div>
                    ))}
                    </div>
                    
                    {/* Paginación diseños base */}
                    {totalPaginasDisenosBase > 1 && (
                      <div className={styles.pagination}>
                        <button
                          type="button"
                          onClick={() => setPaginaDisenosBase(p => Math.max(1, p - 1))}
                          disabled={paginaDisenosBase === 1}
                          className={styles.paginationBtn}
                        >
                          ← Anterior
                        </button>
                        <span className={styles.paginationInfo}>
                          Página {paginaDisenosBase} de {totalPaginasDisenosBase}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPaginaDisenosBase(p => Math.min(totalPaginasDisenosBase, p + 1))}
                          disabled={paginaDisenosBase === totalPaginasDisenosBase}
                          className={styles.paginationBtn}
                        >
                          Siguiente →
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className={styles.divider}>
                <span>O</span>
              </div>

              <div className={styles.option}>
                <h3>Sube Tu Propio Diseño</h3>
                <p className={styles.hint}>Puedes subir hasta 5 imágenes de tu diseño personalizado</p>
                
                <div className={styles.uploadArea}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleDisenoPropio}
                    className={styles.fileInput}
                    id="disenoPropio"
                  />
                  <label htmlFor="disenoPropio" className={styles.uploadButton}>
                    <span className={styles.uploadIcon}>📤</span>
                    <span className={styles.uploadText}>
                      <strong>
                        {disenoPropioPrev.length === 0 
                          ? 'Haz clic aquí para subir imágenes' 
                          : `Subir más imágenes (${disenoPropioPrev.length}/5)`}
                      </strong>
                      <small>
                        {disenoPropioPrev.length === 0
                          ? 'Puedes seleccionar varias a la vez'
                          : `Puedes agregar ${5 - disenoPropioPrev.length} más`}
                      </small>
                    </span>
                  </label>
                </div>

                {disenoPropioPrev.length > 0 && (
                  <div className={styles.previewGrid}>
                    {disenoPropioPrev.map((preview, index) => (
                      <div key={index} className={styles.previewCard}>
                        <img src={preview} alt={`Preview ${index + 1}`} className={styles.previewImage} />
                        <button
                          type="button"
                          onClick={() => removeDisenoPropio(index)}
                          className={styles.removeBtn}
                          title="Eliminar esta imagen"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {currentStep === 2 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{getStepTitle()}</h2>
            <p className={styles.hint}>Selecciona una o más telas (puedes elegir varias)</p>
            
            {telas.length === 0 ? (
              <p className={styles.empty}>No hay telas disponibles aún</p>
            ) : (
              <>
                <div className={styles.grid}>
                  {getTelasPaginadas().map(tela => (
                    <div
                      key={tela.id}
                      className={`${styles.card} ${styles.telaCard} ${telasSeleccionadas.includes(tela.id) ? styles.selected : ''}`}
                      onClick={() => toggleTela(tela.id)}
                    >
                      <img src={normalizeImageUrl(tela.imagenPrincipal)} alt={tela.nombre} className={styles.image} 
                        onError={(e) => {
                          console.error('Error cargando imagen de tela:', tela.imagenPrincipal);
                          e.currentTarget.src = '/placeholder.png';
                        }}
                      />
                      <div className={styles.telaInfo}>
                        <p className={styles.cardTitle}>{tela.nombre}</p>
                      </div>
                      
                      {telasSeleccionadas.includes(tela.id) && (
                        <div className={styles.checkmark}>✓</div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Paginación telas */}
                {totalPaginasTelas > 1 && (
                  <div className={styles.pagination}>
                    <button
                      type="button"
                      onClick={() => setPaginaTelas(p => Math.max(1, p - 1))}
                      disabled={paginaTelas === 1}
                      className={styles.paginationBtn}
                    >
                      ← Anterior
                    </button>
                    <span className={styles.paginationInfo}>
                      Página {paginaTelas} de {totalPaginasTelas}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPaginaTelas(p => Math.min(totalPaginasTelas, p + 1))}
                      disabled={paginaTelas === totalPaginasTelas}
                      className={styles.paginationBtn}
                    >
                      Siguiente →
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {currentStep === 3 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{getStepTitle()}</h2>
            <textarea
              className={styles.textarea}
              placeholder="Déjanos cualquier especificación adicional: tamaño, colores, detalles especiales, etc."
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              rows={5}
              disabled={modoEdicion && !puedeEditar}
            />
          </section>
        )}

        <div className={styles.navigationButtons}>
          {currentStep > 1 && (
            <button
              type="button"
              onClick={prevStep}
              className={styles.prevBtn}
            >
              ← Anterior
            </button>
          )}
          
          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={nextStep}
              className={styles.nextBtn}
              disabled={modoEdicion && !puedeEditar}
            >
              Siguiente →
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowSummary(true)}
              className={styles.reviewBtn}
              disabled={modoEdicion && !puedeEditar}
            >
              📋 Revisar Pedido
            </button>
          )}
        </div>
      </form>

      {showSummary && (
        <div className={styles.modalOverlay}>
          <div className={styles.summaryModal}>
            <h2 className={styles.summaryTitle}>📋 Resumen de tu Pedido</h2>
            
            <div className={styles.summarySection}>
              <h3>🎨 Diseño Seleccionado:</h3>
              {disenoSeleccionado ? (
                <p>Modelo del Catálogo: {disenosBase.find(d => d.id === disenoSeleccionado)?.nombre}</p>
              ) : disenoPropio.length > 0 ? (
                <p>Diseño Propio: {disenoPropio.length} imagen(es) subida(s)</p>
              ) : (
                <p className={styles.error}>No se seleccionó diseño</p>
              )}
            </div>

            <div className={styles.summarySection}>
              <h3>🧵 Telas Seleccionadas:</h3>
              {telasSeleccionadas.length > 0 ? (
                <ul className={styles.summaryList}>
                  {telasSeleccionadas.map(telaId => {
                    const tela = telas.find(t => t.id === telaId);
                    return <li key={telaId}>{tela?.nombre} ({tela?.categoria})</li>;
                  })}
                </ul>
              ) : (
                <p className={styles.error}>No se seleccionaron telas</p>
              )}
            </div>

            <div className={styles.summarySection}>
              <h3>📝 Especificaciones:</h3>
              <p>{comentarios || 'Sin especificaciones adicionales'}</p>
            </div>

            <div className={styles.summaryButtons}>
              <button
                onClick={() => setShowSummary(false)}
                className={styles.editBtn}
              >
                ✏️ Editar
              </button>
              <button
                onClick={handleSubmit}
                className={styles.confirmBtn}
                disabled={enviando}
              >
                {enviando ? 'Enviando...' : (modoEdicion ? '✅ Actualizar Pedido' : '🚀 Enviar Pedido')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAuthModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.authModal}>
            <h3>📝 Solicitar Autorización para Modificar</h3>
            <p>Explica por qué necesitas modificar tu pedido:</p>
            <textarea
              className={styles.textarea}
              value={motivoModificacion}
              onChange={(e) => setMotivoModificacion(e.target.value)}
              placeholder="Ejemplo: Necesito cambiar el color de la tela por otro que combine mejor con mi outfit..."
              rows={4}
            />
            <div className={styles.modalButtons}>
              <button onClick={() => setShowAuthModal(false)} className={styles.cancelModalBtn}>
                Cancelar
              </button>
              <button onClick={solicitarAutorizacion} className={styles.confirmBtn}>
                Enviar Solicitud
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
