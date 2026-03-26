import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import {
  corsHeaders,
  supabase,
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
    const payload = await req.json();
    const payment = (payload?.object || null) as YooKassaPayment | null;

    if (!payment?.id) {
      return new Response('Invalid webhook payload', {
        status: 400,
        headers: corsHeaders,
      });
    }

    const metadataOrderId =
      payment.metadata && typeof payment.metadata.order_id === 'string'
        ? payment.metadata.order_id
        : '';

    let orderQuery = supabase.from('orders').select('*');
    if (metadataOrderId) {
      orderQuery = orderQuery.eq('id', metadataOrderId);
    } else {
      orderQuery = orderQuery.eq('payment_external_id', payment.id);
    }

    const { data: order, error } = await orderQuery.maybeSingle();
    if (error || !order) {
      return new Response('Order not found', {
        status: 404,
        headers: corsHeaders,
      });
    }

    await updateOrderFromPayment(order, payment);
    return new Response('OK', { headers: corsHeaders });
  } catch (error) {
    console.error('yookassa-webhook error', error);
    return new Response(
      error instanceof Error ? error.message : 'Webhook processing failed',
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});
