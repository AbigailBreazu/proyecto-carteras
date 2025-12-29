import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

// PATCH - Actualizar tela (soft delete: activo=false)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id: telaId } = await params;
    const body = await request.json();

    console.log('🔄 Actualizando tela:', telaId, body);

    // Actualizar en el backend (soft delete)
    const response = await fetch(`${BACKEND_URL}/api/personalizacion/telas/${telaId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(session as any).accessToken}`
      },
      body: JSON.stringify(body)
    });

    console.log('📤 PATCH response status:', response.status);

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorData;
      
      if (contentType?.includes('application/json')) {
        errorData = await response.json();
      } else {
        errorData = { error: await response.text() };
      }
      
      console.error('❌ Error del backend:', errorData);
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    console.log('✅ Tela actualizada exitosamente');
    return NextResponse.json(data);
  } catch (error) {
    console.error('💥 Error al actualizar tela:', error);
    return NextResponse.json({ error: 'Error al actualizar tela' }, { status: 500 });
  }
}
