import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

// GET - Obtener mensajes de un pedido
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { id: pedidoId } = await params;

    // Llamar al backend real
    const response = await fetch(`${BACKEND_URL}/api/personalizacion/pedidos/${pedidoId}/mensajes`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${(session as any).accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const mensajes = await response.json();
    return NextResponse.json(mensajes);
  } catch (error) {
    console.error('Error al obtener mensajes:', error);
    return NextResponse.json({ error: 'Error al cargar mensajes' }, { status: 500 });
  }
}

// POST - Crear nuevo mensaje
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

    console.log('📤 POST mensaje proxy');
    console.log('📋 Pedido ID:', pedidoId);
    console.log('📋 Body:', body);
    console.log('👤 User role:', session.user.role);
    console.log('🔑 Token presente:', !!(session as any).accessToken);

    // Llamar al backend real
    const backendUrl = `${BACKEND_URL}/api/personalizacion/pedidos/${pedidoId}/mensajes`;
    console.log('📤 Llamando al backend:', backendUrl);

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${(session as any).accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    console.log('📥 Response del backend:', response.status, response.statusText);

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let error;
      
      if (contentType && contentType.includes('application/json')) {
        error = await response.json();
      } else {
        const text = await response.text();
        error = { error: text || `Error ${response.status}` };
      }
      
      console.error('❌ Error del backend:', error);
      return NextResponse.json(error, { status: response.status });
    }

    const nuevoMensaje = await response.json();
    console.log('✅ Mensaje creado:', nuevoMensaje);
    return NextResponse.json(nuevoMensaje, { status: 201 });
  } catch (error) {
    console.error('💥 Error en POST proxy:', error);
    return NextResponse.json({ error: 'Error al enviar mensaje' }, { status: 500 });
  }
}
