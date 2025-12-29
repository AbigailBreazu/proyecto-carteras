import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { id: pedidoId } = await params;

    console.log('🔍 Verificando permisos de edición:', { pedidoId, userId: session.user.id });

    // Hacer request al backend
    const backendResponse = await fetch(
      `${BACKEND_URL}/api/personalizacion/pedidos/${pedidoId}/puede-editar`,
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
        { error: errorData.message || 'Error al verificar permisos' },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    console.log('✅ Permisos verificados:', data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error en puede-editar:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
