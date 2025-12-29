import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar que sea admin
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No tienes permisos de administrador' },
        { status: 403 }
      );
    }

    console.log('📋 Obteniendo solicitudes de modificación');

    // Hacer request al backend
    const backendResponse = await fetch(
      `${BACKEND_URL}/api/admin/solicitudes-modificacion`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${(session as any).accessToken}`
        }
      }
    );

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json();
      console.error('Error del backend:', errorData);
      return NextResponse.json(
        { error: errorData.message || 'Error al obtener solicitudes' },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    console.log('✅ Solicitudes obtenidas:', data.length);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error en solicitudes-modificacion:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
