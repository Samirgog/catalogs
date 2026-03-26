import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import {
  corsHeaders,
  createYooKassaHeaders,
  getOrderWithGateway,
  updateOrderFromPayment,
  type YooKassaPayment,
} from '../_shared/yookassa.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const { orderId } = await req.json();
    if (!orderId || typeof orderId !== 'string') {
      return new Response('orderId is required', {
        status: 400,
        headers: corsHeaders,
      });
    }

    const { order, gateway } = await getOrderWithGateway(orderId);
    if (!order.payment_external_id) {
      return new Response('Для заказа еще не создан платеж', {
        status: 400,
        headers: corsHeaders,
      });
    }

    const response = await fetch(
      `https://api.yookassa.ru/v3/payments/${order.payment_external_id}`,
      {
        headers: createYooKassaHeaders(gateway.shop_id, gateway.secret_key),
      }
    );

    const payment = (await response.json()) as YooKassaPayment | { description?: string };
    if (!response.ok || !('id' in payment)) {
      return new Response(
        payment && typeof payment === 'object' && 'description' in payment
          ? String(payment.description)
          : 'Не удалось получить статус платежа',
        {
          status: response.status || 500,
          headers: corsHeaders,
        }
      );
    }

    const updatedOrder = await updateOrderFromPayment(order, payment);
    return Response.json(updatedOrder, { headers: corsHeaders });
  } catch (error) {
    console.error('yookassa-sync-payment error', error);
    return new Response(
      error instanceof Error ? error.message : 'Не удалось обновить статус платежа',
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});

