import { useCartStore } from "@/client/stores/cart";
import { useNavigate } from "react-router-dom";

export const CartSummary = () => {
    const { getTotalPrice, clearCart, items } = useCartStore();
    const navigate = useNavigate();
    
    const total = getTotalPrice();
    
    if (items.length === 0) return null;
    
    const handleGoToCheckout = () => {
        navigate('/checkout');
    };

    return (
        <div className="sticky bottom-0 border-t bg-background p-4">
            <div className="flex items-center justify-between mb-3">
                <span className="text-muted-foreground">Итого</span>
                <span className="text-lg font-semibold">{total.toFixed(0)} ₽</span>
            </div>

            <div className="flex gap-2">
                <button 
                    className="flex-1 h-12 rounded-xl bg-muted text-foreground"
                    onClick={clearCart}
                >
                    Очистить
                </button>
                <button 
                    className="flex-1 h-12 rounded-xl bg-black text-white"
                    onClick={handleGoToCheckout}
                >
                    Оформить заказ
                </button>
            </div>
        </div>
    );
}