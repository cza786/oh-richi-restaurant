'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export interface CartOption {
  optionId: string;
  optionItemId: string;
  optionName: string;
  name: string;
  priceDelta: number;
}

export interface CartItem {
  id: string;
  restaurantId?: string;
  itemId: string;
  name: string;
  imageUrl: string | null;
  basePrice: number;
  unitPrice: number;
  quantity: number;
  selectedOptions: CartOption[];
}

interface CartContextValue {
  cart: CartItem[];
  restaurantId: string | null;
  setRestaurantId: (id: string | null) => void;
  addToCart: (item: Omit<CartItem, 'id' | 'unitPrice'> & { selectedOptions?: CartOption[] }) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  deliveryFee: number;
  deliveryAddress: string;
  setDeliveryAddress: (address: string) => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [restaurantId, setRestaurantIdState] = useState<string | null>(null);
  const [deliveryAddress, setDeliveryAddressState] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(0);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('door2door_cart') || '[]');
      if (Array.isArray(stored)) {
        setCart(stored.map((item: any) => ({
          ...item,
          selectedOptions: Array.isArray(item.selectedOptions) ? item.selectedOptions : [],
          unitPrice: Number(item.unitPrice ?? item.basePrice ?? 0),
        })));
      }
      setRestaurantIdState(localStorage.getItem('door2door_restaurant_id'));
      setDeliveryAddressState(localStorage.getItem('door2door_delivery_address') || '');
    } catch {
      localStorage.removeItem('door2door_cart');
    }
  }, []);

  useEffect(() => {
    if (!restaurantId) {
      setDeliveryFee(0);
      return;
    }
    fetch(`/api/settings?restaurantId=${encodeURIComponent(restaurantId)}`)
      .then(async (response) => response.ok ? response.json() : null)
      .then((restaurant) => setDeliveryFee(Number(restaurant?.deliveryFee || 0)))
      .catch(() => setDeliveryFee(0));
  }, [restaurantId]);

  const setRestaurantId = (id: string | null) => {
    setRestaurantIdState(id);
    if (id) localStorage.setItem('door2door_restaurant_id', id);
    else localStorage.removeItem('door2door_restaurant_id');
  };

  const saveCart = (items: CartItem[]) => {
    setCart(items);
    localStorage.setItem('door2door_cart', JSON.stringify(items));
    if (items.length === 0) setRestaurantId(null);
  };

  const addToCart: CartContextValue['addToCart'] = (item) => {
    const selectedOptions = item.selectedOptions || [];
    const optionKey = selectedOptions.map((option) => option.optionItemId).sort().join(',');
    const id = `${item.itemId}:${optionKey}`;
    const unitPrice = Number(item.basePrice) + selectedOptions.reduce((sum, option) => sum + Number(option.priceDelta), 0);
    const nextItem: CartItem = { ...item, id, selectedOptions, unitPrice };

    if (item.restaurantId && restaurantId && item.restaurantId !== restaurantId && cart.length > 0) {
      if (!window.confirm('Your cart contains products from another restaurant. Clear it and continue?')) return;
      setRestaurantId(item.restaurantId);
      saveCart([nextItem]);
      return;
    }
    if (item.restaurantId && !restaurantId) setRestaurantId(item.restaurantId);
    const existing = cart.find((current) => current.id === id);
    saveCart(existing
      ? cart.map((current) => current.id === id ? { ...current, quantity: current.quantity + item.quantity } : current)
      : [...cart, nextItem]);
  };

  const removeFromCart = (id: string) => saveCart(cart.filter((item) => item.id !== id));
  const updateQuantity = (id: string, delta: number) => saveCart(cart.map((item) => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  const clearCart = () => saveCart([]);
  const setDeliveryAddress = (address: string) => {
    setDeliveryAddressState(address);
    localStorage.setItem('door2door_delivery_address', address);
  };
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  return <CartContext.Provider value={{ cart, restaurantId, setRestaurantId, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartSubtotal, deliveryFee, deliveryAddress, setDeliveryAddress }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
