import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

// PUT - Actualizar dirección
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    console.log('✏️ Actualizando dirección:', id);

    const response = await fetch(`${BACKEND_URL}/api/users/direcciones/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(session as any).accessToken}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error del backend:', errorData);
      return NextResponse.json(errorData, { status: response.status });
    }

    const result = await response.json();
    console.log('✅ Dirección actualizada');
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Error al actualizar dirección:', error);
    return NextResponse.json({ 
      error: 'Error al actualizar dirección: ' + (error instanceof Error ? error.message : 'Error desconocido')
    }, { status: 500 });
  }
}

// DELETE - Eliminar dirección
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { id } = await params;

    console.log('🗑️ Eliminando dirección:', id);

    const response = await fetch(`${BACKEND_URL}/api/users/direcciones/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(session as any).accessToken}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error del backend:', errorData);
      return NextResponse.json(errorData, { status: response.status });
    }

    const result = await response.json();
    console.log('✅ Dirección eliminada');
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Error al eliminar dirección:', error);
    return NextResponse.json({ 
      error: 'Error al eliminar dirección: ' + (error instanceof Error ? error.message : 'Error desconocido')
    }, { status: 500 });
  }
}
