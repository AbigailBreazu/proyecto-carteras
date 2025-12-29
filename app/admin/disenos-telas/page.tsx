'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from './disenos-telas.module.css';
import Toast from '@/components/Toast';

type Diseno = {
  id: string;
  nombre: string;
  tamaño?: string;
  diasEstimadosConfeccion?: number;
  imagenes: string[];
  imagenPrincipal: string;
  activo?: boolean;
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
  activo?: boolean;
  fechaCreacion: string;
};

export default function DisenosYTelasPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'disenos' | 'telas'>('disenos');
  const [disenos, setDisenos] = useState<Diseno[]>([]);
  const [telas, setTelas] = useState<Tela[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };
  
  // Estados para modal de diseño
  const [showDisenoModal, setShowDisenoModal] = useState(false);
  const [nombreDiseno, setNombreDiseno] = useState('');
  const [tamañoDiseno, setTamañoDiseno] = useState('');
  const [diasEstimados, setDiasEstimados] = useState(7);
  const [imagenesDiseno, setImagenesDiseno] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  
  // Modal flotante para ver todas las imágenes
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedDiseno, setSelectedDiseno] = useState<Diseno | null>(null);
  
  // Modal flotante para ver detalles de tela
  const [showTelaDetailModal, setShowTelaDetailModal] = useState(false);
  const [selectedTela, setSelectedTela] = useState<Tela | null>(null);
  
  // Modal de confirmación de archivado
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, type: 'diseno' | 'tela'} | null>(null);
  
  // Estados para modal de tela
  const [showTelaModal, setShowTelaModal] = useState(false);
  const [nombreTela, setNombreTela] = useState('');
  const [imagenesTela, setImagenesTela] = useState<File[]>([]);
  const [previewsTela, setPreviewsTela] = useState<string[]>([]);
  const [categoriaTela, setCategoriaTela] = useState<'lona' | 'film-transparente' | 'cuero'>('lona');
  const [especialPara, setEspecialPara] = useState('');
  const [elasticidad, setElasticidad] = useState<'si' | 'no' | 'media'>('no');
  const [lavable, setLavable] = useState<'si' | 'no' | 'media'>('no');

  useEffect(() => {
    if (session?.user?.role !== 'admin') {
      router.push('/');
      return;
    }
    cargarDatos();
  }, [session, router]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [disenosRes, telasRes] = await Promise.all([
        fetch('/api/personalizacion/disenos-base'),
        fetch('/api/personalizacion/telas')
      ]);

      const disenosData = await disenosRes.json();
      const telasData = await telasRes.json();

      setDisenos(disenosData);
      setTelas(telasData);
    } catch (error) {
      console.error('Error:', error);
      showToast('Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleImagenesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) {
      return;
    }

    // ACUMULAR las imágenes en lugar de reemplazar
    const allFiles = [...imagenesDiseno, ...files];
    setImagenesDiseno(allFiles);
    
    // Crear previews para las NUEVAS imágenes
    const newPreviews: string[] = [];
    let loadedCount = 0;
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        loadedCount++;
        
        if (loadedCount === files.length) {
          // Agregar los nuevos previews a los existentes
          setPreviews(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
    
    // Resetear el input para permitir seleccionar los mismos archivos de nuevo
    e.target.value = '';
  };

  const limpiarImagenesDiseno = () => {
    setImagenesDiseno([]);
    setPreviews([]);
  };

  const removeImagenDiseno = (index: number) => {
    const newFiles = imagenesDiseno.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    
    setImagenesDiseno(newFiles);
    setPreviews(newPreviews);
  };

  const handleUploadDiseno = async () => {
    if (!nombreDiseno || imagenesDiseno.length === 0) {
      showToast('Debes proporcionar un nombre y al menos 1 imagen', 'error');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('nombre', nombreDiseno);
      formData.append('tamaño', tamañoDiseno);
      formData.append('diasEstimadosConfeccion', diasEstimados.toString());
      imagenesDiseno.forEach(file => {
        formData.append('imagenes', file);
      });

      const response = await fetch('/api/personalizacion/disenos-base', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        showToast('Diseño creado exitosamente', 'success');
        setShowDisenoModal(false);
        setNombreDiseno('');
        setTamañoDiseno('');
        setDiasEstimados(7);
        setImagenesDiseno([]);
        setPreviews([]);
        cargarDatos();
      } else {
        const error = await response.json();
        showToast('Error: ' + error.error, 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('Error al subir diseño', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleUploadTela = async () => {
    if (!nombreTela || imagenesTela.length === 0) {
      showToast('Debes proporcionar un nombre y al menos 1 imagen', 'error');
      return;
    }

    if (imagenesTela.length > 10) {
      showToast('Máximo 10 imágenes permitidas', 'error');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('nombre', nombreTela);
      formData.append('categoria', categoriaTela);
      formData.append('especialPara', especialPara);
      formData.append('elasticidad', elasticidad);
      formData.append('lavable', lavable);
      imagenesTela.forEach(file => {
        formData.append('imagenes', file);
      });

      const response = await fetch('/api/personalizacion/telas', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        showToast('Tela creada exitosamente', 'success');
        setShowTelaModal(false);
        setNombreTela('');
        setImagenesTela([]);
        setPreviewsTela([]);
        setCategoriaTela('lona');
        setEspecialPara('');
        setElasticidad('no');
        setLavable('no');
        cargarDatos();
      } else {
        const error = await response.json();
        showToast('Error: ' + error.error, 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('Error al subir tela', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleImagenesTelaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) {
      return;
    }

    if (imagenesTela.length + files.length > 10) {
      showToast('Máximo 10 imágenes permitidas', 'error');
      return;
    }

    // ACUMULAR las imágenes
    const allFiles = [...imagenesTela, ...files];
    setImagenesTela(allFiles);
    
    // Crear previews para las NUEVAS imágenes
    const newPreviews: string[] = [];
    let loadedCount = 0;
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        loadedCount++;
        
        if (loadedCount === files.length) {
          setPreviewsTela(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
    
    // Resetear input
    e.target.value = '';
  };

  const removeImagenTela = (index: number) => {
    const newFiles = imagenesTela.filter((_, i) => i !== index);
    const newPreviews = previewsTela.filter((_, i) => i !== index);
    
    setImagenesTela(newFiles);
    setPreviewsTela(newPreviews);
  };

  const limpiarImagenesTela = () => {
    setImagenesTela([]);
    setPreviewsTela([]);
  };

  const handleDeleteDiseno = async (disenoId: string) => {
    setItemToDelete({ id: disenoId, type: 'diseno' });
    setShowConfirmModal(true);
  };

  const handleDeleteTela = async (telaId: string) => {
    setItemToDelete({ id: telaId, type: 'tela' });
    setShowConfirmModal(true);
  };

  const confirmarArchivado = async () => {
    if (!itemToDelete) return;

    const endpoint = itemToDelete.type === 'diseno' 
      ? `/api/personalizacion/disenos-base/${itemToDelete.id}`
      : `/api/personalizacion/telas/${itemToDelete.id}`;

    try {
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: false })
      });

      if (response.ok) {
        showToast(`${itemToDelete.type === 'diseno' ? 'Diseño' : 'Tela'} archivado exitosamente`, 'success');
        cargarDatos();
      } else {
        showToast('Error al archivar', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('Error al archivar', 'error');
    } finally {
      setShowConfirmModal(false);
      setItemToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Cargando...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Gestión de Diseños y Telas</h1>
        <p className={styles.subtitle}>Administra los diseños base y telas disponibles para personalización</p>
      </header>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'disenos' ? styles.active : ''}`}
          onClick={() => setActiveTab('disenos')}
        >
          🎨 Diseños Base ({disenos.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'telas' ? styles.active : ''}`}
          onClick={() => setActiveTab('telas')}
        >
          🧵 Telas Disponibles ({telas.length})
        </button>
      </div>

      {activeTab === 'disenos' ? (
        <>
          <div className={styles.uploadSection}>
            <button 
              className={styles.uploadBtn}
              onClick={() => setShowDisenoModal(true)}
            >
              📤 Crear Nuevo Diseño
            </button>
          </div>

          <div className={styles.grid}>
            {disenos.length === 0 ? (
              <div className={styles.empty}>No hay diseños disponibles</div>
            ) : (
              disenos.map(diseno => (
                <div 
                  key={diseno.id} 
                  className={styles.card}
                  onClick={() => {
                    setSelectedDiseno(diseno);
                    setShowImageModal(true);
                  }}
                  style={{cursor: 'pointer'}}
                >
                  <img src={diseno.imagenPrincipal} alt={diseno.nombre} className={styles.image} />
                  <div className={styles.cardContent}>
                    <p className={styles.cardTitle}>{diseno.nombre}</p>
                    {diseno.tamaño && <p className={styles.cardDetail}>📏 Tamaño: {diseno.tamaño}</p>}
                    {diseno.diasEstimadosConfeccion && <p className={styles.cardDetail}>⏱️ {diseno.diasEstimadosConfeccion} días</p>}
                    <p className={styles.imageCount}>{diseno.imagenes.length} imágenes</p>
                    
                    <div className={styles.cardActions}>
                      <button
                        className={styles.deleteBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDiseno(diseno.id);
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <>
          <div className={styles.uploadSection}>
            <button 
              className={styles.uploadBtn}
              onClick={() => setShowTelaModal(true)}
            >
              📤 Crear Nueva Tela
            </button>
          </div>

          <div className={styles.grid}>
            {telas.length === 0 ? (
              <div className={styles.empty}>No hay telas disponibles</div>
            ) : (
              telas.map(tela => (
                <div 
                  key={tela.id} 
                  className={styles.card}
                  onClick={() => {
                    setSelectedTela(tela);
                    setShowTelaDetailModal(true);
                  }}
                  style={{cursor: 'pointer'}}
                >
                  <img src={tela.imagenPrincipal} alt={tela.nombre} className={styles.image} />
                  <div className={styles.cardContent}>
                    <p className={styles.cardTitle}>{tela.nombre}</p>
                    <p className={styles.cardDetail}>🧵 {tela.categoria.replace('-', ' ')}</p>
                    {tela.especialPara && <p className={styles.cardDetail}>⭐ {tela.especialPara}</p>}

                    <div className={styles.cardActions}>
                      <button
                        className={styles.deleteBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTela(tela.id);
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Modal para crear diseño */}
      {showDisenoModal && (
        <div className={styles.modalOverlay} onClick={() => setShowDisenoModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setShowDisenoModal(false)}>×</button>
            
            <h2 className={styles.modalTitle}>Crear Nuevo Diseño Base</h2>

            <div className={styles.modalContent}>
              <div className={styles.formGroup}>
                <label>Nombre del Diseño:</label>
                <input
                  type="text"
                  value={nombreDiseno}
                  onChange={(e) => setNombreDiseno(e.target.value)}
                  placeholder="Ej: Cartera Clásica"
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Tamaño:</label>
                <input
                  type="text"
                  value={tamañoDiseno}
                  onChange={(e) => setTamañoDiseno(e.target.value)}
                  placeholder="Ej: 25cm x 30cm, Pequeño, Grande, etc."
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Días estimados de confección:</label>
                <input
                  type="number"
                  value={diasEstimados || ''}
                  onChange={(e) => setDiasEstimados(Number(e.target.value) || 0)}
                  placeholder="Ej: 7"
                  min="0"
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Seleccionar Imágenes (1 o más):</label>
                <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImagenesChange}
                    className={styles.fileInputModal}
                  />
                  {previews.length > 0 && (
                    <button
                      type="button"
                      onClick={limpiarImagenesDiseno}
                      className={styles.clearBtn}
                      title="Limpiar todas las imágenes"
                    >
                      🗑️ Limpiar Todo
                    </button>
                  )}
                </div>
                <small>Puedes agregar más imágenes haciendo clic varias veces. La primera imagen será la principal</small>
              </div>

              {previews.length > 0 && (
                <div className={styles.previewGrid}>
                  <p style={{width: '100%', marginBottom: '10px', fontWeight: 'bold'}}>
                    {previews.length} imagen{previews.length !== 1 ? 'es' : ''} seleccionada{previews.length !== 1 ? 's' : ''}
                  </p>
                  {previews.map((preview, idx) => (
                    <div key={idx} className={styles.previewItem}>
                      <img src={preview} alt={`Preview ${idx + 1}`} />
                      <button
                        type="button"
                        onClick={() => removeImagenDiseno(idx)}
                        className={styles.removeBtn}
                        title="Eliminar imagen"
                      >
                        ×
                      </button>
                      {idx === 0 && <span className={styles.principalBadge}>Principal</span>}
                    </div>
                  ))}
                </div>
              )}

              <button
                className={styles.submitBtn}
                onClick={handleUploadDiseno}
                disabled={uploading || !nombreDiseno || imagenesDiseno.length === 0}
              >
                {uploading ? '⏳ Subiendo...' : '✅ Crear Diseño'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para crear tela */}
      {showTelaModal && (
        <div className={styles.modalOverlay} onClick={() => setShowTelaModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setShowTelaModal(false)}>×</button>
            
            <h2 className={styles.modalTitle}>Crear Nueva Tela</h2>

            <div className={styles.modalContent}>
              <div className={styles.formGroup}>
                <label>Nombre de la Tela: *</label>
                <input
                  type="text"
                  value={nombreTela}
                  onChange={(e) => setNombreTela(e.target.value)}
                  placeholder="Ej: Lona Premium Roja"
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Categoría: *</label>
                <select 
                  value={categoriaTela} 
                  onChange={(e) => setCategoriaTela(e.target.value as any)}
                  className={styles.select}
                >
                  <option value="lona">Lona</option>
                  <option value="film-transparente">Film Transparente</option>
                  <option value="cuero">Cuero</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Especial para confección de:</label>
                <input
                  type="text"
                  value={especialPara}
                  onChange={(e) => setEspecialPara(e.target.value)}
                  placeholder="Ej: Carteras, mochilas, neceseres"
                  className={styles.input}
                />
                <small>Opcional - para qué tipo de productos es ideal</small>
              </div>

              <div className={styles.formGroup}>
                <label>Elasticidad: *</label>
                <select 
                  value={elasticidad} 
                  onChange={(e) => setElasticidad(e.target.value as any)}
                  className={styles.select}
                >
                  <option value="no">No</option>
                  <option value="media">Media</option>
                  <option value="si">Sí</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Lavable: *</label>
                <select 
                  value={lavable} 
                  onChange={(e) => setLavable(e.target.value as any)}
                  className={styles.select}
                >
                  <option value="no">No</option>
                  <option value="media">Media (lavado suave)</option>
                  <option value="si">Sí</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Seleccionar Imágenes (1 a 10): *</label>
                <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImagenesTelaChange}
                    className={styles.fileInputModal}
                  />
                  {previewsTela.length > 0 && (
                    <button
                      type="button"
                      onClick={limpiarImagenesTela}
                      className={styles.clearBtn}
                      title="Limpiar todas las imágenes"
                    >
                      🗑️ Limpiar Todo
                    </button>
                  )}
                </div>
                <small>Puedes agregar más imágenes haciendo clic varias veces. Máximo 10 imágenes. La primera será la principal</small>
              </div>

              {previewsTela.length > 0 && (
                <div className={styles.previewGrid}>
                  <p style={{width: '100%', marginBottom: '10px', fontWeight: 'bold'}}>
                    {previewsTela.length} imagen{previewsTela.length !== 1 ? 'es' : ''} seleccionada{previewsTela.length !== 1 ? 's' : ''}
                  </p>
                  {previewsTela.map((preview, idx) => (
                    <div key={idx} className={styles.previewItem}>
                      <img src={preview} alt={`Preview ${idx + 1}`} />
                      <button
                        type="button"
                        onClick={() => removeImagenTela(idx)}
                        className={styles.removeBtn}
                        title="Eliminar imagen"
                      >
                        ×
                      </button>
                      {idx === 0 && <span className={styles.principalBadge}>Principal</span>}
                    </div>
                  ))}
                </div>
              )}

              <button
                className={styles.submitBtn}
                onClick={handleUploadTela}
                disabled={uploading || !nombreTela || imagenesTela.length === 0}
              >
                {uploading ? '⏳ Subiendo...' : '✅ Crear Tela'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal flotante para ver todas las imágenes */}
      {showImageModal && selectedDiseno && (
        <div className={styles.imageModalOverlay} onClick={() => setShowImageModal(false)}>
          <div className={styles.imageModal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setShowImageModal(false)}>×</button>
            
            <h2 className={styles.modalTitle}>{selectedDiseno.nombre}</h2>
            
            <div className={styles.imageModalInfo}>
              {selectedDiseno.tamaño && <p>📏 Tamaño: <strong>{selectedDiseno.tamaño}</strong></p>}
              {selectedDiseno.diasEstimadosConfeccion && <p>⏱️ Tiempo de confección: <strong>{selectedDiseno.diasEstimadosConfeccion} días</strong></p>}
              <p>🖼️ Total de imágenes: <strong>{selectedDiseno.imagenes.length}</strong></p>
            </div>
            
            <div className={styles.imageGallery}>
              {selectedDiseno.imagenes.map((img, idx) => (
                <div key={idx} className={styles.galleryItem}>
                  <img src={img} alt={`${selectedDiseno.nombre} ${idx + 1}`} />
                  {idx === 0 && <span className={styles.principalBadge}>Principal</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Modal flotante para ver detalles de tela */}
      {showTelaDetailModal && selectedTela && (
        <div className={styles.imageModalOverlay} onClick={() => setShowTelaDetailModal(false)}>
          <div className={styles.imageModal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setShowTelaDetailModal(false)}>×</button>
            
            <h2 className={styles.modalTitle}>{selectedTela.nombre}</h2>
            
            <div className={styles.imageModalInfo}>
              <p>🧵 Categoría: <strong>{selectedTela.categoria.replace('-', ' ')}</strong></p>
              {selectedTela.especialPara && <p>⭐ Especial para: <strong>{selectedTela.especialPara}</strong></p>}
              <p>↔️ Elasticidad: <strong>{selectedTela.elasticidad === 'si' ? '✅ Sí' : selectedTela.elasticidad === 'media' ? '⚡ Media' : '❌ No'}</strong></p>
              <p>🧼 Lavable: <strong>{selectedTela.lavable === 'si' ? '✅ Sí' : selectedTela.lavable === 'media' ? '⚡ Media' : '❌ No'}</strong></p>
              <p>🖼️ Total de imágenes: <strong>{selectedTela.imagenes.length}</strong></p>
            </div>
            
            <div className={styles.imageGallery}>
              {selectedTela.imagenes.map((img, idx) => (
                <div key={idx} className={styles.galleryItem}>
                  <img src={img} alt={`${selectedTela.nombre} ${idx + 1}`} />
                  {idx === 0 && <span className={styles.principalBadge}>Principal</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de confirmación de archivado */}
      {showConfirmModal && itemToDelete && (
        <div className={styles.modalOverlay} onClick={() => setShowConfirmModal(false)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <h3>¿Archivar {itemToDelete.type === 'diseno' ? 'diseño' : 'tela'}?</h3>
            <p>No se eliminará permanentemente, solo dejará de aparecer en la lista.</p>
            <p>Los pedidos que lo usan seguirán funcionando.</p>
            <div className={styles.confirmButtons}>
              <button 
                className={styles.cancelBtn}
                onClick={() => {
                  setShowConfirmModal(false);
                  setItemToDelete(null);
                }}
              >
                Cancelar
              </button>
              <button 
                className={styles.confirmBtn}
                onClick={confirmarArchivado}
              >
                Sí, archivar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
