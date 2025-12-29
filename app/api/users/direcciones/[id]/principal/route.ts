import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

// PATCH - Marcar dirección como principal
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { id } = await params;

    console.log('⭐ Marcando dirección como principal:', id);

    const response = await fetch(`${BACKEND_URL}/api/users/direcciones/${id}/principal`, {
      method: 'PATCH',
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
    console.log('✅ Dirección marcada como principal');
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Error al marcar como principal:', error);
    return NextResponse.json({ 
      error: 'Error al marcar como principal: ' + (error instanceof Error ? error.message : 'Error desconocido')
    }, { status: 500 });
  }
}
