// API endpoint para crear preferencia de pago en Mercado Pago
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { items, payer, external_reference } = body

    console.log('📦 Mercado Pago: Items recibidos:', items);
    console.log('👤 Mercado Pago: Payer recibido:', payer);
    console.log('🔗 Mercado Pago: External reference:', external_reference);

    // Validar que haya items
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'No hay items en el carrito' },
        { status: 400 }
      )
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3002';
    
    const preferenceData = {
      items: items.map((item: any) => ({
        id: item.id,
        title: item.nombre,
        quantity: Number(item.quantity),
        currency_id: 'ARS',
        unit_price: Number(item.precio),
      })),
      back_urls: {
        success: baseUrl + '/checkout/success',
        failure: baseUrl + '/checkout/failure',
        pending: baseUrl + '/checkout/pending',
      },
      notification_url: baseUrl + '/api/mercadopago/webhook',
      auto_return: 'approved',
      external_reference: external_reference || `ORDER-${Date.now()}`,
    }

    console.log('📤 Mercado Pago: Enviando preferencia:', JSON.stringify(preferenceData, null, 2));

    // Usar API REST directamente en lugar del SDK
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preferenceData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error de Mercado Pago API:', errorData);
      throw new Error(errorData.message || 'Error al crear preferencia');
    }

    const data = await response.json();

    console.log('✅ Mercado Pago: Preferencia creada:', data.id);

    return NextResponse.json({
      id: data.id,
      init_point: data.init_point,
      sandbox_init_point: data.sandbox_init_point,
    })

  } catch (error: any) {
    console.error('Error al crear preferencia de Mercado Pago:', error)
    return NextResponse.json(
      { 
        error: 'Error al crear preferencia de pago',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
