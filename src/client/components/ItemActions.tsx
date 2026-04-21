import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';
import { useCartStore } from '../stores/cart';
import type { CatalogSubtype, CatalogType, Item } from '../../types';
import { useNavigate } from 'react-router-dom';
import { useBookingStore } from '../stores';
import { useCurrentUser } from '@/useTelegramAuth';
import { customerIntelligenceService } from '../services/customerIntelligence';

type Props = {
  catalogId?: string;
  item: Item;
  businessType?: CatalogType;
  businessSubtype?: CatalogSubtype;
};

export function ItemActions({
  catalogId,
  item,
  businessType = 'goods',
  businessSubtype,
}: Props) {
  const navigate = useNavigate();
  const { userId } = useCurrentUser();
  const { items, addItem, removeItem, updateQuantity } = useCartStore();
  const { setSelectedItem } = useBookingStore();

  // Check if the current item is in the cart
  const cartItem = items.find(cartItem => cartItem.item.id === item.id);
  const isInCart = !!cartItem;

  const handleAddToCart = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    addItem(item, 1);
    if (catalogId) {
      void customerIntelligenceService.trackEvent({
        catalogId,
        customerId: userId,
        eventType: 'cart_add',
        metadata: {
          item_id: item.id,
          item_title: item.title,
          quantity: 1,
        },
      });
    }
  };

  const handleRemoveFromCart = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (cartItem && cartItem.quantity > 1) {
      updateQuantity(item.id, cartItem.quantity - 1);
      if (catalogId) {
        void customerIntelligenceService.trackEvent({
          catalogId,
          customerId: userId,
          eventType: 'cart_quantity_change',
          metadata: {
            item_id: item.id,
            item_title: item.title,
            quantity: cartItem.quantity - 1,
          },
        });
      }
    } else {
      removeItem(item.id);
      if (catalogId) {
        void customerIntelligenceService.trackEvent({
          catalogId,
          customerId: userId,
          eventType: 'cart_remove',
          metadata: {
            item_id: item.id,
            item_title: item.title,
          },
        });
      }
    }
  };

  const handleIncreaseQuantity = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (cartItem) {
      updateQuantity(item.id, cartItem.quantity + 1);
      if (catalogId) {
        void customerIntelligenceService.trackEvent({
          catalogId,
          customerId: userId,
          eventType: 'cart_quantity_change',
          metadata: {
            item_id: item.id,
            item_title: item.title,
            quantity: cartItem.quantity + 1,
          },
        });
      }
    }
  };

  const handleSignUp = (e?: React.MouseEvent) => {
    e?.stopPropagation();
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
              <span className="font-medium">В корзину</span>
              <span>•</span>
              <span className="font-semibold">{item.price} ₽</span>
            </Button>
          )}
        </>
      );
    case 'services':
      {
        const label =
          businessSubtype === 'private_master'
            ? 'Заказать услугу'
            : businessSubtype === 'studio_club'
              ? 'В корзину'
              : 'Выбрать';
      return (
        <Button size="sm" className="mt-2 w-fit h-9" onClick={handleSignUp}>
          <span className="py-1 font-semibold text-sm">{label}</span>
          {typeof item.price === 'number' && (
            <>
              <span className="mx-1">•</span>
              <span className="py-1 font-semibold text-sm">{item.price} ₽</span>
            </>
          )}
        </Button>
      );
      }
    default:
      return null;
  }
}
