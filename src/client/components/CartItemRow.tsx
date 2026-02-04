import { type CartItem } from "@/client/stores/cart";
import React from "react";
import { useCartStore } from "@/client/stores/cart";
import { Trash } from "lucide-react";

type Props = {
    item: CartItem;
};

export const CartItemRow: React.FunctionComponent<Props> = ({ item }) => {
    const { removeItem, updateQuantity } = useCartStore();
    
    const handleDecreaseQuantity = () => {
        if (item.quantity > 1) {
            updateQuantity(item.item.id, item.quantity - 1);
        } else {
            removeItem(item.item.id);
        }
    };
    
    const handleIncreaseQuantity = () => {
        updateQuantity(item.item.id, item.quantity + 1);
    };
    
    const handleRemoveItem = () => {
        removeItem(item.item.id);
    };
    
    return (
        <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
            <div className="flex items-start gap-3">
                {item.item.image_url && (
                    <img 
                        src={item.item.image_url} 
                        alt={item.item.title}
                        className="w-12 h-12 rounded-md object-cover"
                    />
                )}
                <div>
                    <div className="font-medium">{item.item.title}</div>
                    <div className="text-sm text-muted-foreground">
                        {item.item.price} ₽ × {item.quantity}
                    </div>
                    <div className="text-sm font-semibold mt-1">
                        {item.item.price ? (item.item.price * item.quantity).toFixed(0) : 0} ₽
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-1">
                <button
                    className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-accent text-xs"
                    onClick={handleDecreaseQuantity}
                >
                    −
                </button>

                <span className="w-6 text-center text-sm">{item.quantity}</span>

                <button
                    className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-accent text-xs"
                    onClick={handleIncreaseQuantity}
                >
                    +
                </button>
                
                <button 
                    className="ml-2 text-red-500 hover:text-red-700 p-1"
                    onClick={handleRemoveItem}
                >
                    <Trash size={16} />
                </button>
            </div>
        </div>
    );
}
