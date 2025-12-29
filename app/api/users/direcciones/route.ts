import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

// GET - Obtener direcciones del usuario
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const response = await fetch(`${BACKEND_URL}/api/users/direcciones`, {
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

    const direcciones = await response.json();
    return NextResponse.json(direcciones);
  } catch (error) {
    console.error('Error al obtener direcciones:', error);
    return NextResponse.json({ error: 'Error al cargar direcciones' }, { status: 500 });
  }
}

// POST - Crear nueva dirección
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();

    console.log('📍 Creando nueva dirección...');

    const response = await fetch(`${BACKEND_URL}/api/users/direcciones`, {
      method: 'POST',
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
    console.log('✅ Dirección creada:', result);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Error al crear dirección:', error);
    return NextResponse.json({ 
      error: 'Error al crear dirección: ' + (error instanceof Error ? error.message : 'Error desconocido')
    }, { status: 500 });
  }
}
