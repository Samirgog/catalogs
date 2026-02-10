import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";
import { useCartStore } from "../stores/cart";
import type { CatalogType, Item } from "../../types";
import { useNavigate } from "react-router-dom";
import { useBookingStore } from "../stores";

type Props = {
  item: Item;
  businessType?: CatalogType;
};

export function ItemActions({ item, businessType = 'goods' }: Props) {
  const navigate = useNavigate();
  const { items, addItem, removeItem, updateQuantity } = useCartStore();
  const { setSelectedItem } = useBookingStore();

  // Check if the current item is in the cart
  const cartItem = items.find(cartItem => cartItem.item.id === item.id);
  const isInCart = !!cartItem;

  const handleAddToCart = () => {
    addItem(item, 1);
  };

  const handleRemoveFromCart = () => {
    if (cartItem && cartItem.quantity > 1) {
      // Decrease quantity by 1
      updateQuantity(item.id, cartItem.quantity - 1);
    } else {
      // Remove item if quantity is 1
      removeItem(item.id);
    }
  };

  const handleIncreaseQuantity = () => {
    if (cartItem) {
      updateQuantity(item.id, cartItem.quantity + 1);
    }
  };

  const handleSignUp = () => {
    setSelectedItem(item);
    navigate('/booking');
  };

  // Render different actions based on business type
  switch (businessType) {
    case 'goods':
      return (
        <>
          {isInCart ? (
            <div className="mt-3 w-fit flex items-center border rounded-md overflow-hidden">
              <Button
                size="sm"
                variant="outline"
                className="rounded-none border-0 h-full px-2 py-1 text-xs"
                onClick={handleRemoveFromCart}
              >
                <Minus size={12} />
              </Button>
              <span className="px-2 py-1 font-medium min-w-[20px] text-center text-sm">
                {cartItem.quantity}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="rounded-none border-0 h-full px-2 py-1 text-xs"
                onClick={handleIncreaseQuantity}
              >
                <Plus size={12} />
              </Button>
              <span className="px-2 py-1 font-semibold bg-gray-100 text-sm">
                {item.price} ₽
              </span>
            </div>
          ) : (
            <Button
              size="sm"
              className="mt-3 w-fit gap-1"
              onClick={handleAddToCart}
            >
              <Plus size={16} />
              <span className="font-semibold">{item.price} ₽</span>
            </Button>
          )}
        </>
      );
    case 'services':
      return (
        <Button
          size="sm"
          className="mt-3 w-fit"
          onClick={handleSignUp}
        >
          <span className="py-1 font-semibold text-sm">Выбрать</span> • <span className="py-1 font-semibold text-sm">
                {item.price} ₽
              </span>
        </Button>
      );
    default:
      return null;
  }
}