import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

type Tela = {
  id: string;
  nombre: string;
  url: string;
  categoria: 'lona' | 'film-transparente' | 'cuero';
  especialPara?: string;
  elasticidad: 'si' | 'no' | 'media';
  lavable: 'si' | 'no' | 'media';
  fechaCreacion: string;
};

// GET - Obtener todas las telas disponibles (proxy al backend)
export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/personalizacion/telas`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const telas = await response.json();
    return NextResponse.json(telas);
  } catch (error) {
    console.error('Error al obtener telas:', error);
    return NextResponse.json({ error: 'Error al cargar telas' }, { status: 500 });
  }
}

// POST - Subir nueva tela con múltiples imágenes (solo admin, proxy al backend)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const formData = await request.formData();
    const files = formData.getAll('imagenes') as File[];
    const nombre = formData.get('nombre') as string;
    const categoria = formData.get('categoria') as string;
    const especialPara = formData.get('especialPara') as string || '';
    const elasticidad = formData.get('elasticidad') as string;
    const lavable = formData.get('lavable') as string;
    
    if (files.length === 0 || !nombre || !categoria || !elasticidad || !lavable) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    if (files.length > 10) {
      return NextResponse.json({ error: 'Máximo 10 imágenes permitidas' }, { status: 400 });
    }

    const accessToken = (session as any).accessToken;

    // Subir imágenes al backend usando el nuevo endpoint
    const uploadFormData = new FormData();
    files.forEach(file => {
      uploadFormData.append('images', file);
    });

    const uploadResponse = await fetch(`${BACKEND_URL}/upload/telas`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: uploadFormData
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      return NextResponse.json({ 
        error: 'Error al subir imágenes: ' + errorData.error 
      }, { status: uploadResponse.status });
    }

    const uploadResult = await uploadResponse.json();
    const imagenes = uploadResult.urls; // URLs completas del backend

    // Crear tela en el BACKEND
    const telaData = {
      nombre,
      imagenes,
      imagenPrincipal: imagenes[0],
      categoria,
      especialPara: especialPara || undefined,
      elasticidad,
      lavable
    };

    const response = await fetch(`${BACKEND_URL}/api/personalizacion/telas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(telaData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const newTela = await response.json();
    return NextResponse.json({ 
      success: true, 
      tela: newTela
    });
  } catch (error) {
    console.error('Error al subir tela:', error);
    return NextResponse.json({ error: 'Error al subir tela' }, { status: 500 });
  }
}

// DELETE - Eliminar tela (proxy al backend)
// NOTA: Este endpoint mantiene hard delete para casos donde realmente se necesite eliminar
// Para soft delete (archivar), usar PATCH /api/personalizacion/telas/[id]
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const telaId = searchParams.get('id');

    if (!telaId) {
      return NextResponse.json({ error: 'No se proporcionó ID' }, { status: 400 });
    }

    // Los archivos están en el backend, no hay que eliminarlos localmente
    // El backend se encarga de eliminar los archivos cuando se borra la tela

    // Eliminar del backend
    const response = await fetch(`${BACKEND_URL}/api/personalizacion/telas/${telaId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${(session as any).accessToken}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar tela:', error);
    return NextResponse.json({ error: 'Error al eliminar tela' }, { status: 500 });
  }
}
