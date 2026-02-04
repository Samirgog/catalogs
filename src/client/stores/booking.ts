import { create } from 'zustand';
import type { Item } from '../../types';

type BookingStore = {
  selectedItem: Item | null;
  setSelectedItem: (item: Item | null) => void;
  clearSelectedItem: () => void;
};

export const useBookingStore = create<BookingStore>((set) => ({
  selectedItem: null,
  setSelectedItem: (item) => set({ selectedItem: item }),
  clearSelectedItem: () => set({ selectedItem: null }),
}));