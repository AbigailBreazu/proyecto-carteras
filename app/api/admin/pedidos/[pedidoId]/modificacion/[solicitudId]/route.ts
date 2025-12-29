import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ pedidoId: string; solicitudId: string }> }
) {
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

    const { pedidoId, solicitudId } = await params;
    const body = await request.json();

    console.log('✏️ Responder solicitud de modificación:', { 
      pedidoId, 
      solicitudId, 
      accion: body.accion,
      adminId: session.user.id 
    });

    // Hacer request al backend
    const backendResponse = await fetch(
      `${BACKEND_URL}/api/admin/pedidos/${pedidoId}/modificacion/${solicitudId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(session as any).accessToken}`
        },
        body: JSON.stringify({
          accion: body.accion, // 'aprobar' o 'rechazar'
          mensaje: body.mensaje,
          adminId: session.user.id
        })
      }
    );

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json();
      console.error('Error del backend:', errorData);
      return NextResponse.json(
        { error: errorData.message || 'Error al procesar solicitud' },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    console.log('✅ Solicitud procesada:', data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error en modificacion:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
