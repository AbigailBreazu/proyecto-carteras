import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import jwt from 'jsonwebtoken';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';

export async function GET(request: Request) {
  try {
    // Obtener token de autenticación
    const token = await getToken({ 
      req: request as any,
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (!token?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener todas las órdenes desde el backend
    console.log('🔍 Obteniendo órdenes del backend... v2');
    console.log('📧 Email del usuario:', token.email);
    
    // Generar token JWT para el backend con el mismo formato que usa el sistema
    console.log('🔑 Generando token JWT para backend...');
    const backendToken = jwt.sign(
      { 
        id: token.sub || token.email, // Usar sub (subject) o email como id
        email: token.email, 
        name: token.name || 'Usuario',
        role: token.role || 'user' 
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    console.log('✅ Token generado');
    
    const response = await fetch(`${BACKEND_URL}/ordenes`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${backendToken}`,
      },
    });

    if (!response.ok) {
      console.error('❌ Error del backend:', response.status, response.statusText);
      return NextResponse.json([], { status: 200 }); // Devolver array vacío si falla
    }

    const ordenes = await response.json();
    console.log('📦 Órdenes del backend:', ordenes);
    
    // El backend devuelve { ordenes: [...], total, pagina }
    const listaOrdenes = ordenes.ordenes || ordenes;
    console.log('📊 Total de órdenes:', Array.isArray(listaOrdenes) ? listaOrdenes.length : 'No es array');
    
    if (Array.isArray(listaOrdenes) && listaOrdenes.length > 0) {
      console.log('🔍 Primera orden de ejemplo:', listaOrdenes[0]);
    }
    
    // Filtrar solo las órdenes del usuario actual
    // Las órdenes pueden tener usuario_email o usuario.email
    // Temporalmente: mostrar todas las órdenes sin email asignado (para ver compras antiguas)
    const comprasUsuario = Array.isArray(listaOrdenes) 
      ? listaOrdenes.filter((orden: any) => {
          const ordenEmail = orden.usuario_email || orden.usuario?.email || orden.email;
          console.log(`🔍 Comparando: orden.usuario_email="${ordenEmail}" vs token.email="${token.email}"`);
          // Mostrar si coincide el email o si la orden no tiene email (compras viejas)
          return ordenEmail === token.email || !ordenEmail;
        })
      : [];

    console.log('✅ Órdenes filtradas del usuario:', comprasUsuario.length);

    return NextResponse.json(comprasUsuario);

  } catch (error: any) {
    console.error('Error en /api/compras:', error);
    return NextResponse.json([], { status: 200 }); // Devolver array vacío en caso de error
  }
}
