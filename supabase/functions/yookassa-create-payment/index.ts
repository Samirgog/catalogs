import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import {
  buildPaymentDescription,
  buildReturnUrl,
  corsHeaders,
  createYooKassaHeaders,
  formatAmount,
  getOrderWithGateway,
  supabase,
  updateOrderFromPayment,
  type YooKassaPayment,
} from '../_shared/yookassa.ts';

const YOOKASSA_API_URL = 'https://api.yookassa.ru/v3/payments';

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
    if (order.total_price <= 0) {
      return new Response('Нельзя создать онлайн-оплату для заказа без суммы', {
        status: 400,
        headers: corsHeaders,
      });
    }

    if (
      order.payment_provider === 'yookassa' &&
      order.payment_external_id &&
      ['pending', 'waiting_for_capture'].includes(order.payment_status || '') &&
      order.payment_confirmation_url
    ) {
      return Response.json(
        {
          confirmationUrl: order.payment_confirmation_url,
          paymentId: order.payment_external_id,
          status: order.payment_status,
        },
        { headers: corsHeaders }
      );
    }

    const returnUrl = await buildReturnUrl(order);
    const idempotenceKey = crypto.randomUUID();
    const response = await fetch(YOOKASSA_API_URL, {
      method: 'POST',
      headers: createYooKassaHeaders(
        gateway.shop_id,
        gateway.secret_key,
        idempotenceKey
      ),
      body: JSON.stringify({
        amount: {
          value: formatAmount(order.total_price),
          currency: 'RUB',
        },
        capture: true,
        confirmation: {
          type: 'redirect',
          return_url: returnUrl,
        },
        description: buildPaymentDescription(order),
        metadata: {
          order_id: order.id,
          catalog_id: order.catalog_id,
          customer_id: order.customer_id,
        },
      }),
    });

    const payment = (await response.json()) as YooKassaPayment | { description?: string };
    if (!response.ok || !('id' in payment)) {
      return new Response(
        payment && typeof payment === 'object' && 'description' in payment
          ? String(payment.description)
          : 'Не удалось создать платеж в ЮKassa',
        {
          status: response.status || 500,
          headers: corsHeaders,
        }
      );
    }

    await updateOrderFromPayment(order, payment);

    const { data: refreshedOrder } = await supabase
      .from('orders')
      .select('payment_confirmation_url, payment_external_id, payment_status')
      .eq('id', order.id)
      .single();

    return Response.json(
      {
        confirmationUrl:
          refreshedOrder?.payment_confirmation_url ||
          payment.confirmation?.confirmation_url ||
          '',
        paymentId: refreshedOrder?.payment_external_id || payment.id,
        status: refreshedOrder?.payment_status || payment.status,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('yookassa-create-payment error', error);
    return new Response(
      error instanceof Error ? error.message : 'Не удалось создать платеж',
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});

