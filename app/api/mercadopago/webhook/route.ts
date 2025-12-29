// Webhook de Mercado Pago para recibir notificaciones de pago
import { NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
})

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    console.log('📩 Webhook recibido:', body)

    // Mercado Pago envía el tipo de notificación
    const { type, data } = body

    if (type === 'payment') {
      const paymentId = data.id
      
      // Obtener información completa del pago
      const payment = new Payment(client)
      const paymentInfo = await payment.get({ id: paymentId })

      console.log('💳 Información del pago:', {
        id: paymentInfo.id,
        status: paymentInfo.status,
        status_detail: paymentInfo.status_detail,
        transaction_amount: paymentInfo.transaction_amount,
        currency_id: paymentInfo.currency_id,
        payment_method_id: paymentInfo.payment_method_id,
        payment_type_id: paymentInfo.payment_type_id,
        external_reference: paymentInfo.external_reference,
        date_approved: paymentInfo.date_approved,
        payer: paymentInfo.payer
      })

      // Preparar datos del comprobante para guardar en backend
      const comprobanteData = {
        orden_id: paymentInfo.external_reference, // ID de la orden que creamos
        mercadopago_payment_id: paymentInfo.id,
        estado: paymentInfo.status,
        estado_detalle: paymentInfo.status_detail,
        monto: paymentInfo.transaction_amount,
        moneda: paymentInfo.currency_id,
        metodo_pago: paymentInfo.payment_method_id,
        tipo_pago: paymentInfo.payment_type_id,
        fecha_aprobacion: paymentInfo.date_approved,
        fecha_creacion: paymentInfo.date_created,
        comprador_email: paymentInfo.payer?.email,
        comprador_nombre: `${paymentInfo.payer?.first_name || ''} ${paymentInfo.payer?.last_name || ''}`.trim(),
        comprador_identificacion: paymentInfo.payer?.identification,
        cuotas: paymentInfo.installments,
        datos_completos: paymentInfo // Guardar todo el objeto para referencia
      }

      // Guardar comprobante en el backend
      try {
        const saveResponse = await fetch(`${BACKEND_URL}/ordenes/${paymentInfo.external_reference}/comprobante`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(comprobanteData),
        })

        if (saveResponse.ok) {
          console.log('✅ Comprobante guardado en base de datos')
        } else {
          console.error('❌ Error guardando comprobante:', await saveResponse.text())
        }
      } catch (saveError) {
        console.error('❌ Error al guardar comprobante:', saveError)
      }

      // Actualizar estado de la orden según el pago
      switch (paymentInfo.status) {
        case 'approved':
          console.log('✅ Pago aprobado:', paymentId)
          try {
            await fetch(`${BACKEND_URL}/ordenes/${paymentInfo.external_reference}/estado`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                estado: 'PAGADO',
                mercadopago_payment_id: paymentInfo.id,
                mercadopago_status: paymentInfo.status
              }),
            })
            console.log('✅ Orden actualizada a PAGADO')
          } catch (error) {
            console.error('❌ Error actualizando orden:', error)
          }
          break
          
        case 'pending':
          console.log('⏳ Pago pendiente:', paymentId)
          try {
            await fetch(`${BACKEND_URL}/ordenes/${paymentInfo.external_reference}/estado`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                estado: 'PENDIENTE',
                mercadopago_payment_id: paymentInfo.id,
                mercadopago_status: paymentInfo.status
              }),
            })
          } catch (error) {
            console.error('❌ Error actualizando orden:', error)
          }
          break
          
        case 'rejected':
          console.log('❌ Pago rechazado:', paymentId)
          try {
            await fetch(`${BACKEND_URL}/ordenes/${paymentInfo.external_reference}/estado`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                estado: 'CANCELADO',
                mercadopago_payment_id: paymentInfo.id,
                mercadopago_status: paymentInfo.status
              }),
            })
          } catch (error) {
            console.error('❌ Error actualizando orden:', error)
          }
          break
      }
    }

    return NextResponse.json({ received: true })

  } catch (error: any) {
    console.error('❌ Error en webhook:', error)
    return NextResponse.json(
      { error: 'Error procesando webhook', details: error.message },
      { status: 500 }
    )
  }
}

// GET para verificar que el webhook está activo
export async function GET() {
  return NextResponse.json({ status: 'Webhook activo' })
}
