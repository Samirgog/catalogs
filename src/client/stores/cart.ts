import { create } from 'zustand';
import type { Item } from '../../types';

export type CartItem = {
  item: Item;
  quantity: number;
};

interface CartStore {
  items: CartItem[];
  addItem: (item: Item, quantity?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  
  addItem: (item, quantity = 1) => {
    set((state) => {
      const existingItemIndex = state.items.findIndex(cartItem => cartItem.item.id === item.id);
      
      if (existingItemIndex >= 0) {
        // Update quantity if item already exists
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity
        };
        return { items: updatedItems };
      } else {
        // Add new item to cart
        return {
          items: [...state.items, { item, quantity }]
        };
      }
    });
  },
  
  removeItem: (itemId) => {
    set((state) => ({
      items: state.items.filter(item => item.item.id !== itemId)
    }));
  },
  
  updateQuantity: (itemId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(itemId);
      return;
    }
    
    set((state) => ({
      items: state.items.map(item =>
        item.item.id === itemId ? { ...item, quantity } : item
      )
    }));
  },
  
  clearCart: () => {
    set({ items: [] });
  },
  
  getTotalItems: () => {
    const state = get();
    return state.items.reduce((total, item) => total + item.quantity, 0);
  },
  
  getTotalPrice: () => {
    const state = get();
    return state.items.reduce((total, item) => {
      const itemPrice = item.item.price || 0;
      return total + (itemPrice * item.quantity);
    }, 0);
  }
}));