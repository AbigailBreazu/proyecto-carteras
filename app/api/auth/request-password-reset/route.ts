import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

// POST - Solicitar reset de contraseña (envía email)
export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    }

    console.log('📧 Solicitando reset de contraseña para:', email);

    const response = await fetch(`${BACKEND_URL}/api/auth/request-password-reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error del backend:', errorData);
      return NextResponse.json(errorData, { status: response.status });
    }

    const result = await response.json();
    console.log('✅ Email de reset enviado');
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Error al solicitar reset de contraseña:', error);
    return NextResponse.json({ 
      error: 'Error al enviar email: ' + (error instanceof Error ? error.message : 'Error desconocido')
    }, { status: 500 });
  }
}
