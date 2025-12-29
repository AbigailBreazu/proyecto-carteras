import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

// POST - Marcar mensajes como leídos
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { id: pedidoId } = await params;
    const body = await request.json();

    // Llamar al backend real
    const response = await fetch(`${BACKEND_URL}/api/personalizacion/pedidos/${pedidoId}/mensajes/marcar-leidos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${(session as any).accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error al marcar mensajes como leídos:', error);
    return NextResponse.json({ error: 'Error al actualizar mensajes' }, { status: 500 });
  }
}
