import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

// GET - Obtener un pedido específico por ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { id } = await params;

    // Llamar al backend real
    const response = await fetch(`${BACKEND_URL}/api/personalizacion/pedidos/${id}`, {
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

    const pedido = await response.json();
    return NextResponse.json(pedido);
  } catch (error) {
    console.error('Error al obtener pedido:', error);
    return NextResponse.json({ error: 'Error al cargar pedido' }, { status: 500 });
  }
}

// PATCH - Actualizar pedido (admin cambio de estado, cliente con autorización)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      console.error('❌ PATCH pedido - No autenticado');
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { id } = await params;
    
    // Determinar si es FormData o JSON
    const contentType = request.headers.get('content-type');
    const isFormData = contentType?.includes('multipart/form-data');
    
    console.log('🔄 PATCH pedido proxy');
    console.log('📋 ID:', id);
    console.log('👤 User role:', session.user.role);
    console.log('📦 Content-Type:', contentType);
    console.log('🔑 Token presente:', !!(session as any).accessToken);
    
    // Llamar al backend real
    const backendUrl = `${BACKEND_URL}/api/personalizacion/pedidos/${id}`;
    console.log('📤 Llamando al backend:', backendUrl);
    
    let body;
    let headers: any = {
      'Authorization': `Bearer ${(session as any).accessToken}`
    };

    if (isFormData) {
      // Si es FormData (modificación de pedido), procesarlo
      const formData = await request.formData();
      
      const disenoBaseId = formData.get('disenoBaseId') as string;
      const telasSeleccionadas = formData.get('telasSeleccionadas') as string;
      const comentarios = formData.get('comentarios') as string;
      const disenoPropio = formData.get('disenoPropio') as File | null;

      console.log('🔧 FormData recibido:');
      console.log('  - disenoBaseId:', disenoBaseId);
      console.log('  - telasSeleccionadas:', telasSeleccionadas);
      console.log('  - comentarios:', comentarios);
      console.log('  - disenoPropio:', disenoPropio ? 'Archivo presente' : 'No hay archivo');

      let disenoUrl = null;

      // Si subió nuevo diseño propio, subirlo primero
      if (disenoPropio && disenoPropio.size > 0) {
        const uploadFormData = new FormData();
        uploadFormData.append('image', disenoPropio);

        console.log('📤 Subiendo nuevo diseño propio...');

        const uploadResponse = await fetch(`${BACKEND_URL}/upload/disenos`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${(session as any).accessToken || ''}`
          },
          body: uploadFormData
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          console.error('❌ Error al subir diseño:', errorData);
          return NextResponse.json({ 
            error: 'Error al subir diseño: ' + errorData.error 
          }, { status: uploadResponse.status });
        }

        const uploadResult = await uploadResponse.json();
        disenoUrl = uploadResult.url;
        console.log('✅ Diseño subido:', disenoUrl);
      }

      // Preparar datos JSON para el backend
      const updateData: any = {};

      // Solo agregar los campos que están presentes
      if (telasSeleccionadas) {
        updateData.telasSeleccionadas = JSON.parse(telasSeleccionadas);
      }

      if (comentarios !== null && comentarios !== undefined) {
        updateData.comentarios = comentarios;
      }

      // Solo agregar disenoBaseId si tiene valor válido
      if (disenoBaseId && disenoBaseId !== '' && disenoBaseId !== 'null' && disenoBaseId !== 'undefined') {
        updateData.disenoBaseId = disenoBaseId;
      }

      // Solo agregar disenoPropio si se subió uno nuevo
      if (disenoUrl) {
        updateData.disenoPropio = disenoUrl;
      }

      console.log('📦 Datos procesados para backend:', JSON.stringify(updateData, null, 2));

      body = JSON.stringify(updateData);
      headers['Content-Type'] = 'application/json';
    } else {
      // Si es JSON (cambio de estado admin), procesar como antes
      body = JSON.stringify(await request.json());
      headers['Content-Type'] = 'application/json';
    }
    
    const response = await fetch(backendUrl, {
      method: 'PATCH',
      headers,
      body
    });

    console.log('📥 Response del backend:', response.status, response.statusText);

    if (!response.ok) {
      const contentTypeRes = response.headers.get('content-type');
      let error;
      
      if (contentTypeRes && contentTypeRes.includes('application/json')) {
        error = await response.json();
      } else {
        const text = await response.text();
        error = { error: text || `Error ${response.status}` };
      }
      
      console.error('❌ Error del backend:', error);
      return NextResponse.json(error, { status: response.status });
    }

    const result = await response.json();
    console.log('✅ Pedido actualizado:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('💥 Error en PATCH proxy:', error);
    return NextResponse.json({ error: 'Error al actualizar pedido' }, { status: 500 });
  }
}

// DELETE - Eliminar pedido (admin o cliente dueño)
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

    console.log('🗑️ DELETE pedido proxy');
    console.log('📋 ID:', id);
    console.log('👤 User:', session.user.email, 'Role:', session.user.role);

    // Llamar al backend real
    const response = await fetch(`${BACKEND_URL}/api/personalizacion/pedidos/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${(session as any).accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📥 Response del backend:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Error del backend:', error);
      return NextResponse.json(error, { status: response.status });
    }

    const result = await response.json();
    console.log('✅ Pedido eliminado:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error al eliminar pedido:', error);
    return NextResponse.json({ error: 'Error al eliminar pedido' }, { status: 500 });
  }
}
