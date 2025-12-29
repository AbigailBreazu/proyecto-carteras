import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

// GET - Obtener lista de pedidos con info de mensajería (solo para admin)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Llamar al backend real
    const response = await fetch(`${BACKEND_URL}/api/admin/mensajeria/pedidos`, {
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

    const pedidos = await response.json();
    
    // CORRECCIÓN: Filtrar correctamente mensajes no leídos (solo del cliente, no del admin)
    const pedidosCorregidos = pedidos.map((pedido: any) => {
      // Si el último mensaje es del admin, no debería contar como "no leído" para el admin
      if (pedido.ultimoMensaje?.esAdmin === true) {
        return {
          ...pedido,
          mensajesNoLeidos: 0 // El admin no tiene mensajes del cliente sin leer
        };
      }
      return pedido;
    });
    
    return NextResponse.json(pedidosCorregidos);
  } catch (error) {
    console.error('Error al obtener pedidos con mensajes:', error);
    return NextResponse.json({ error: 'Error al cargar conversaciones' }, { status: 500 });
  }
}
