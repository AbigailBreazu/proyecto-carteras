import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

// GET - Obtener todos los diseños base (proxy al backend)
export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/personalizacion/disenos-base`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const disenos = await response.json();
    return NextResponse.json(disenos);
  } catch (error) {
    console.error('Error al obtener diseños base:', error);
    return NextResponse.json({ error: 'Error al cargar diseños' }, { status: 500 });
  }
}

// POST - Crear nuevo diseño base con múltiples imágenes (proxy al backend)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    console.log('🔑 Session en POST diseño:', {
      hasSession: !!session,
      email: session?.user?.email,
      role: session?.user?.role,
      hasAccessToken: !!(session as any)?.accessToken
    });
    
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const formData = await request.formData();
    const nombre = formData.get('nombre') as string;
    const tamaño = formData.get('tamaño') as string;
    const diasEstimadosConfeccion = formData.get('diasEstimadosConfeccion') as string;
    const files = formData.getAll('imagenes') as File[];
    
    if (!nombre || files.length === 0) {
      return NextResponse.json({ 
        error: 'Debes proporcionar un nombre y al menos 1 imagen' 
      }, { status: 400 });
    }

    console.log('📤 Subiendo imágenes al backend...', { cantidad: files.length });

    // Subir imágenes al backend usando el nuevo endpoint
    const uploadFormData = new FormData();
    files.forEach(file => {
      uploadFormData.append('images', file);
    });

    const accessToken = (session as any).accessToken;
    
    const uploadResponse = await fetch(`${BACKEND_URL}/upload/disenos-base`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: uploadFormData
    });

    console.log('📡 Upload response status:', uploadResponse.status);

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      console.error('❌ Error al subir imágenes:', errorData);
      return NextResponse.json({ 
        error: 'Error al subir imágenes: ' + errorData.error 
      }, { status: uploadResponse.status });
    }

    const uploadResult = await uploadResponse.json();
    const imagenes = uploadResult.urls; // URLs completas del backend

    // Crear diseño en el BACKEND
    const disenoData = {
      nombre,
      tamaño,
      diasEstimadosConfeccion: diasEstimadosConfeccion ? parseInt(diasEstimadosConfeccion) : undefined,
      imagenes,
      imagenPrincipal: imagenes[0]
    };

    console.log('🔐 Access token:', accessToken ? `${accessToken.substring(0, 20)}...` : 'NO TOKEN');
    console.log('📤 Enviando al backend:', `${BACKEND_URL}/api/personalizacion/disenos-base`);

    const response = await fetch(`${BACKEND_URL}/api/personalizacion/disenos-base`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(disenoData)
    });
    
    console.log('📡 Response del backend:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error del backend al crear diseño:', errorData);
      return NextResponse.json(errorData, { status: response.status });
    }

    const nuevoDiseno = await response.json();
    return NextResponse.json({ 
      success: true, 
      diseno: nuevoDiseno
    });
  } catch (error) {
    console.error('Error al subir diseño:', error);
    return NextResponse.json({ error: 'Error al subir diseño' }, { status: 500 });
  }
}

// DELETE - Eliminar diseño base (proxy al backend)
// NOTA: Este endpoint mantiene hard delete para casos donde realmente se necesite eliminar
// Para soft delete (archivar), usar PATCH /api/personalizacion/disenos-base/[id]
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const disenoId = searchParams.get('id');

    if (!disenoId) {
      return NextResponse.json({ error: 'No se proporcionó ID' }, { status: 400 });
    }

    console.log('🗑️ Intentando eliminar diseño:', disenoId);

    // Primero obtener el diseño para saber qué imágenes eliminar
    const getResponse = await fetch(`${BACKEND_URL}/api/personalizacion/disenos-base/${disenoId}`, {
      headers: {
        'Authorization': `Bearer ${(session as any).accessToken}`
      }
    });

    console.log('📥 GET diseño response status:', getResponse.status);

    // Los archivos están en el backend, no hay que eliminarlos localmente
    // El backend se encarga de eliminar los archivos cuando se borra el diseño

    // Eliminar del backend
    console.log('🔥 Llamando DELETE al backend:', `${BACKEND_URL}/api/personalizacion/disenos-base/${disenoId}`);
    const response = await fetch(`${BACKEND_URL}/api/personalizacion/disenos-base/${disenoId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${(session as any).accessToken}`
      }
    });

    console.log('📤 DELETE response status:', response.status);

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorData;
      
      if (contentType?.includes('application/json')) {
        errorData = await response.json();
      } else {
        errorData = { error: await response.text() };
      }
      
      console.error('❌ Error del backend:', errorData);
      return NextResponse.json(errorData, { status: response.status });
    }

    console.log('✅ Diseño eliminado exitosamente');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('💥 Error al eliminar diseño:', error);
    return NextResponse.json({ error: 'Error al eliminar diseño' }, { status: 500 });
  }
}
