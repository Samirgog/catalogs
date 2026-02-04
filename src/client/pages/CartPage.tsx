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
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <div className="h-14 flex items-center px-4 border-b">
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
            <div className="flex-1 p-4 space-y-4 pb-24">
                {items.length === 0 && (
                    <div className="text-center text-muted-foreground mt-12">
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
