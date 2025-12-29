import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

// PUT - Actualizar imagen de perfil
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const formData = await request.formData();
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json({ error: 'No se proporcionó imagen' }, { status: 400 });
    }

    // Validar tipo de archivo
    if (!image.type.startsWith('image/')) {
      return NextResponse.json({ error: 'El archivo debe ser una imagen' }, { status: 400 });
    }

    // Crear FormData para enviar al backend
    const uploadFormData = new FormData();
    uploadFormData.append('image', image);

    console.log('📸 Subiendo imagen de perfil al backend...');

    const response = await fetch(`${BACKEND_URL}/api/users/profile/image`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${(session as any).accessToken}`
      },
      body: uploadFormData
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error del backend:', errorData);
      return NextResponse.json(errorData, { status: response.status });
    }

    const result = await response.json();
    console.log('✅ Imagen de perfil actualizada:', result);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Error al subir imagen de perfil:', error);
    return NextResponse.json({ 
      error: 'Error al subir imagen: ' + (error instanceof Error ? error.message : 'Error desconocido')
    }, { status: 500 });
  }
}
