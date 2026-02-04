import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCartStore } from '../stores/cart';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';

export function CheckoutPage() {
  const { items, getTotalPrice, clearCart } = useCartStore();
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [paymentMethod, setPaymentMethod] = useState<'sbp' | 'card'>('sbp'); // SBP = Система Быстрых Платежей
  
  const total = getTotalPrice();
  
  const handleBack = () => {
    if (paymentStatus === 'processing' || paymentStatus === 'success') {
      return; // Предотвращение навигации во время обработки платежа или после успешного завершения
    }
    navigate(-1);
  };
  
  const handlePayment = async () => {
    if (paymentStatus === 'processing') return;
    
    setPaymentStatus('processing');
    
    // Имитация задержки обработки платежа
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Имитация результата платежа (90% успешных транзакций)
    const isSuccess = Math.random() > 0.1;
    
    if (isSuccess) {
      setPaymentStatus('success');
      // Очистка корзины после успешного платежа
      setTimeout(() => {
        clearCart();
      }, 1500);
    } else {
      setPaymentStatus('failed');
    }
  };
  
  const handleRetry = () => {
    setPaymentStatus('idle');
  };
  
  const handleFinish = () => {
    navigate('/'); // Переход на главную страницу после успешного платежа
  };
  
  // Автоматический переход после успеха если пользователь не перешел вручную
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (paymentStatus === 'success') {
      timer = setTimeout(() => {
        navigate('/');
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [paymentStatus, navigate]);
  
  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen flex flex-col bg-background p-4">
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Оплата прошла успешно!</h1>
          <p className="text-gray-600 mb-8">Ваш заказ подтвержден и будет обработан в ближайшее время.</p>
          <Button className="w-full max-w-sm" onClick={handleFinish}>
            Продолжить покупки
          </Button>
        </div>
      </div>
    );
  }
  
  if (paymentStatus === 'failed') {
    return (
      <div className="min-h-screen flex flex-col bg-background p-4">
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Ошибка оплаты</h1>
          <p className="text-gray-600 mb-8">Не удалось обработать ваш платеж. Пожалуйста, попробуйте еще раз.</p>
          <div className="flex gap-3 w-full max-w-sm">
            <Button variant="outline" className="flex-1" onClick={handleBack}>
              Назад
            </Button>
            <Button className="flex-1" onClick={handleRetry}>
              Повторить
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="p-4 border-b bg-background">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={handleBack} disabled={paymentStatus === 'processing'}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold ml-2 flex-1">Оформление заказа</h1>
        </div>
      </div>
      
      <div className="flex-1 p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Состав заказа</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {items.map((cartItem) => (
                <div key={cartItem.item.id} className="flex justify-between">
                  <div>
                    <span>{cartItem.item.title}</span>
                    <span className="text-gray-500 text-sm ml-2">× {cartItem.quantity}</span>
                  </div>
                  <span>{(cartItem.item.price || 0) * cartItem.quantity} ₽</span>
                </div>
              ))}
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between font-bold">
                  <span>Итого:</span>
                  <span>{total.toFixed(0)} ₽</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Способ оплаты</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className={`border rounded-lg p-4 ${paymentMethod === 'sbp' ? 'border-blue-500 bg-blue-50' : ''}`} onClick={() => setPaymentMethod('sbp')}>
                <div className="flex items-center cursor-pointer">
                  <div className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center ${paymentMethod === 'sbp' ? 'border-blue-500' : 'border-gray-300'}`}>
                    {paymentMethod === 'sbp' && <div className="w-3 h-3 rounded-full bg-blue-500" />}
                  </div>
                  <div>
                    <h3 className="font-medium">Система Быстрых Платежей (СБП)</h3>
                    <p className="text-sm text-gray-500">Оплатите мгновенно из любого российского банка</p>
                  </div>
                </div>
              </div>
              
              <div className={`border rounded-lg p-4 ${paymentMethod === 'card' ? 'border-blue-500 bg-blue-50' : ''}`} onClick={() => setPaymentMethod('card')}>
                <div className="flex items-center cursor-pointer">
                  <div className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center ${paymentMethod === 'card' ? 'border-blue-500' : 'border-gray-300'}`}>
                    {paymentMethod === 'card' && <div className="w-3 h-3 rounded-full bg-blue-500" />}
                  </div>
                  <div>
                    <h3 className="font-medium flex items-center">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Банковская карта
                    </h3>
                    <p className="text-sm text-gray-500">Visa, Mastercard, Мир</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="p-4 border-t bg-background">
        <Button 
          className="w-full h-14 text-lg" 
          onClick={handlePayment} 
          disabled={paymentStatus === 'processing'}
        >
          {paymentStatus === 'processing' ? (
            <>
              Обработка платежа...
            </>
          ) : (
            <>
              Оплатить {total.toFixed(0)} ₽ по {paymentMethod === 'sbp' ? 'СБП' : 'Карте'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
