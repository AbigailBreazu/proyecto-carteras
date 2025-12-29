import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

// GET - Obtener pedidos personalizados (proxy al backend)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Llamar al backend
    const url = session.user.role === 'admin' 
      ? `${BACKEND_URL}/api/personalizacion/pedidos`
      : `${BACKEND_URL}/api/personalizacion/pedidos?userEmail=${encodeURIComponent(session.user.email)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(session as any).accessToken}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const pedidos = await response.json();
    return NextResponse.json(pedidos);
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    return NextResponse.json({ error: 'Error al cargar pedidos' }, { status: 500 });
  }
}

// POST - Crear nuevo pedido personalizado (proxy al backend con upload de imagen)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const formData = await request.formData();
    const disenoPropio = formData.get('disenoPropio') as File | null;
    const disenoBaseId = formData.get('disenoBaseId') as string;
    const telasSeleccionadas = JSON.parse(formData.get('telasSeleccionadas') as string);
    const comentarios = formData.get('comentarios') as string;

    let disenoUrl = null;

    // Si subió diseño propio, subirlo al backend usando el nuevo endpoint
    if (disenoPropio) {
      const uploadFormData = new FormData();
      uploadFormData.append('image', disenoPropio);

      const uploadResponse = await fetch(`${BACKEND_URL}/upload/disenos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(session as any).accessToken || ''}`
        },
        body: uploadFormData
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        return NextResponse.json({ 
          error: 'Error al subir diseño: ' + errorData.error 
        }, { status: uploadResponse.status });
      }

      const uploadResult = await uploadResponse.json();
      disenoUrl = uploadResult.url; // URL completa del backend
    }

    // Crear pedido en el BACKEND
    const pedidoData = {
      userEmail: session.user.email,
      userName: session.user.name || session.user.email,
      disenoBase: disenoBaseId || null,
      disenoPropio: disenoUrl,
      telasSeleccionadas,
      comentarios,
      estado: 'PENDIENTE'
    };

    const response = await fetch(`${BACKEND_URL}/api/personalizacion/pedidos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(session as any).accessToken}`
      },
      body: JSON.stringify(pedidoData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const nuevoPedido = await response.json();
    return NextResponse.json({ success: true, pedido: nuevoPedido });
  } catch (error) {
    console.error('Error al crear pedido:', error);
    return NextResponse.json({ error: 'Error al crear pedido' }, { status: 500 });
  }
}
