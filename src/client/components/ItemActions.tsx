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
            <div className="mt-2 w-fit flex items-center rounded-xl overflow-hidden glass-card border-0">
              <Button
                size="sm"
                variant="ghost"
                className="rounded-none h-8 px-3"
                onClick={handleRemoveFromCart}
              >
                <Minus size={14} />
              </Button>
              <span className="px-3 font-medium min-w-[24px] text-center text-sm">
                {cartItem.quantity}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="rounded-none h-8 px-3"
                onClick={handleIncreaseQuantity}
              >
                <Plus size={14} />
              </Button>
              <span className="px-3 py-1 font-semibold bg-secondary text-sm rounded-r-xl">
                {item.price} ₽
              </span>
            </div>
          ) : (
            <Button
              size="sm"
              className="mt-2 w-fit gap-1 h-9"
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
          className="mt-2 w-fit h-9"
          onClick={handleSignUp}
        >
          <span className="py-1 font-semibold text-sm">Выбрать</span> 
          <span className="mx-1">•</span>
          <span className="py-1 font-semibold text-sm">
                {item.price} ₽
              </span>
        </Button>
      );
    default:
      return null;
  }
}