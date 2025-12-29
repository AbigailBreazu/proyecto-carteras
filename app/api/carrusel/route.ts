import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// GET - Obtener todas las imágenes del carrusel
export async function GET() {
  try {
    const res = await fetch(`${API_URL}/api/carrusel`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error('Error al obtener imágenes del carrusel');
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error en GET /api/carrusel:', error);
    return NextResponse.json(
      { error: 'Error al obtener imágenes del carrusel' },
      { status: 500 }
    );
  }
}

// POST - Agregar una nueva imagen al carrusel
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    const res = await fetch(`${API_URL}/api/admin/carrusel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.json();
      return NextResponse.json(error, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error en POST /api/carrusel:', error);
    return NextResponse.json(
      { error: 'Error al crear imagen del carrusel' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar una imagen del carrusel
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    const res = await fetch(`${API_URL}/api/admin/carrusel/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });

    if (!res.ok) {
      const error = await res.json();
      return NextResponse.json(error, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error en PUT /api/carrusel:', error);
    return NextResponse.json(
      { error: 'Error al actualizar imagen del carrusel' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar una imagen del carrusel
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    const res = await fetch(`${API_URL}/api/admin/carrusel/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const error = await res.json();
      return NextResponse.json(error, { status: res.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en DELETE /api/carrusel:', error);
    return NextResponse.json(
      { error: 'Error al eliminar imagen del carrusel' },
      { status: 500 }
    );
  }
}
