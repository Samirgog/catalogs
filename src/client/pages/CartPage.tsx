import { useCartStore } from "@/client/stores/cart";
import { CartItemRow } from "@/client/components";
import { CartSummary } from "@/client/components";
import {useNavigate} from "react-router-dom";

export const CartPage = ()=>  {
    const navigate = useNavigate();
    const { items, getTotalItems } = useCartStore();

    const handleGoBack = () => {
        navigate(-1);
    }

    return (
        <div className="min-h-screen flex flex-col bg-background">
            {/* Header */}
            <div className="sticky top-0 z-20 p-4 glass-card rounded-none border-x-0 border-t-0 flex items-center">
                <button
                    onClick={handleGoBack}
                    className="text-sm text-muted-foreground"
                >
                    ← Назад
                </button>
                <h1 className="ml-4 text-lg font-semibold">Корзина</h1>
                <span className="ml-2 text-sm text-muted-foreground">({getTotalItems()} шт.)</span>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 space-y-3 pb-32">
                {items.length === 0 && (
                    <div className="text-center text-muted-foreground mt-12 glass-card p-6 rounded-xl">
                        Корзина пуста
                    </div>
                )}

                {items.map((item) => (
                    <CartItemRow key={item.item.id} item={item} />
                ))}
            </div>

            {/* Summary */}
            <CartSummary />
        </div>
    );
}
