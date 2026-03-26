export type CreateOnlinePaymentResult = {
  confirmationUrl: string;
  paymentId: string;
  status: string;
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const getFunctionUrl = (name: string) => {
  if (!SUPABASE_URL) {
    throw new Error('Не настроен VITE_SUPABASE_URL');
  }

  return `${SUPABASE_URL}/functions/v1/${name}`;
};

export const clientPaymentService = {
  async createYookassaPayment(orderId: string): Promise<CreateOnlinePaymentResult> {
    const response = await fetch(getFunctionUrl('yookassa-create-payment'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return response.json();
  },

  async syncYookassaPayment(orderId: string) {
    const response = await fetch(getFunctionUrl('yookassa-sync-payment'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return response.json();
  },
};
