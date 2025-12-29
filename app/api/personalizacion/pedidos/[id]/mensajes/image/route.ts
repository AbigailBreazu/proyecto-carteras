import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

// POST - Enviar mensaje con imagen
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
    const formData = await request.formData();

    // Reenviar el formData al backend
    const response = await fetch(`${BACKEND_URL}/api/mensajes/pedidos/${pedidoId}/image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${(session as any).accessToken}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const mensaje = await response.json();
    return NextResponse.json(mensaje, { status: 201 });
  } catch (error) {
    console.error('Error al enviar mensaje con imagen:', error);
    return NextResponse.json({ error: 'Error al enviar mensaje con imagen' }, { status: 500 });
  }
}
