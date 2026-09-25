'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: string; // unique key: itemId-variationId-spiceId-addonIds
  restaurantId?: string;
  itemId: string;
  name: string;
  imageUrl: string | null;
  basePrice: number;
  quantity: number;
  variation: {
    id: string;
    name: string;
    priceDifference: number;
  } | null;
  spiceLevel: {
    id: string;
    name: string;
    priceDifference: number;
  } | null;
  addons: Array<{
    id: string;
    name: string;
    price: number;
  }>;
  notes: string;
}

interface CartContextType {
  cart: CartItem[];
  restaurantId: string | null;
  setRestaurantId: (id: string | null) => void;
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  deliveryFee: number;
  orderType: 'DELIVERY' | 'TAKEAWAY';
  setOrderType: (type: 'DELIVERY' | 'TAKEAWAY') => void;
  deliveryAddress: string;
  setDeliveryAddress: (address: string) => void;
  selectedBranch: string;
  setSelectedBranch: (branch: string) => void;
  appliedCoupon: {
    code: string;
    discountAmount: number;
    discountType: string;
    discountValue: number;
    freeMenuItemId?: string | null;
  } | null;
  applyCouponCode: (code: string) => Promise<{ success: boolean; error?: string }>;
  removeCoupon: () => void;
  appliedRedemption: {
    redemptionCode: string;
    reward: {
      name: string;
      discountAmount: number;
    };
  } | null;
  applyRedemption: (redemption: any) => void;
  removeRedemption: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [restaurantId, setRestaurantIdState] = useState<string | null>(null);
  const [orderType, setOrderTypeState] = useState<'DELIVERY' | 'TAKEAWAY'>('DELIVERY');
  const [deliveryAddress, setDeliveryAddressState] = useState<string>('221B Baker Street, London');
  const [selectedBranch, setSelectedBranchState] = useState<string>('Oh Richi Central, Via Nazionale 45');
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [appliedRedemption, setAppliedRedemption] = useState<any | null>(null);

  // Load cart & restaurant scope from localStorage on mount
  useEffect(() => {
    const storedCart = localStorage.getItem('oh_richi_cart');
    if (storedCart) {
      try {
        setCart(JSON.parse(storedCart));
      } catch (e) {
        console.error('Error loading cart:', e);
      }
    }
    const storedRestId = localStorage.getItem('oh_richi_restaurant_id');
    if (storedRestId) {
      setRestaurantIdState(storedRestId);
    }
    const storedType = localStorage.getItem('oh_richi_ordertype');
    if (storedType && (storedType === 'DELIVERY' || storedType === 'TAKEAWAY')) {
      setOrderTypeState(storedType as any);
    }
    const storedAddr = localStorage.getItem('oh_richi_delivery_address');
    if (storedAddr) {
      setDeliveryAddressState(storedAddr);
    }
    const storedBranch = localStorage.getItem('oh_richi_branch');
    if (storedBranch) {
      setSelectedBranchState(storedBranch);
    }
  }, []);

  const setRestaurantId = (id: string | null) => {
    setRestaurantIdState(id);
    if (id) {
      localStorage.setItem('oh_richi_restaurant_id', id);
    } else {
      localStorage.removeItem('oh_richi_restaurant_id');
    }
  };

  // Sync cart to localStorage
  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('oh_richi_cart', JSON.stringify(newCart));
    if (newCart.length === 0) {
      setRestaurantId(null);
    }
  };

  const setOrderType = (type: 'DELIVERY' | 'TAKEAWAY') => {
    setOrderTypeState(type);
    localStorage.setItem('oh_richi_ordertype', type);
    setAppliedCoupon(null);
    setAppliedRedemption(null);
  };

  const setDeliveryAddress = (address: string) => {
    setDeliveryAddressState(address);
    localStorage.setItem('oh_richi_delivery_address', address);
  };

  const setSelectedBranch = (branch: string) => {
    setSelectedBranchState(branch);
    localStorage.setItem('oh_richi_branch', branch);
  };

  const addToCart = (newItem: Omit<CartItem, 'id'>) => {
    // Check tenant isolation: If adding item from a different restaurant, clear previous cart
    if (newItem.restaurantId && restaurantId && newItem.restaurantId !== restaurantId && cart.length > 0) {
      const confirmReplace = window.confirm(
        'Your cart contains items from another restaurant. Would you like to clear your cart and add this item?'
      );
      if (!confirmReplace) return;

      const addonIds = newItem.addons.map((a) => a.id).sort().join(',');
      const id = `${newItem.itemId}-${newItem.variation?.id || 'none'}-${newItem.spiceLevel?.id || 'none'}-${addonIds}`;
      setRestaurantId(newItem.restaurantId);
      saveCart([{ ...newItem, id }]);
      return;
    }

    if (newItem.restaurantId && !restaurantId) {
      setRestaurantId(newItem.restaurantId);
    }

    const addonIds = newItem.addons.map((a) => a.id).sort().join(',');
    const id = `${newItem.itemId}-${newItem.variation?.id || 'none'}-${newItem.spiceLevel?.id || 'none'}-${addonIds}`;

    const existingIndex = cart.findIndex((item) => item.id === id);

    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += newItem.quantity;
      saveCart(updated);
    } else {
      saveCart([...cart, { ...newItem, id }]);
    }
  };

  const removeFromCart = (id: string) => {
    const updated = cart.filter((item) => item.id !== id);
    saveCart(updated);
  };

  const updateQuantity = (id: string, delta: number) => {
    const updated = cart.map((item) => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    });
    saveCart(updated);
  };

  const clearCart = () => {
    saveCart([]);
    setRestaurantId(null);
    setAppliedCoupon(null);
    setAppliedRedemption(null);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const cartSubtotal = cart.reduce((sum, item) => {
    const varDiff = item.variation?.priceDifference || 0;
    const spiceDiff = item.spiceLevel?.priceDifference || 0;
    const addonsSum = item.addons.reduce((aSum, a) => aSum + a.price, 0);
    const itemPrice = item.basePrice + varDiff + spiceDiff + addonsSum;
    return sum + itemPrice * item.quantity;
  }, 0);

  const deliveryFee = orderType === 'DELIVERY' ? 3.00 : 0.00;

  const applyCouponCode = async (code: string) => {
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal: cartSubtotal, restaurantId }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to apply coupon.' };
      }
      setAppliedCoupon(data);
      setAppliedRedemption(null);
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Network error.' };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const applyRedemption = (redemption: any) => {
    setAppliedRedemption(redemption);
    setAppliedCoupon(null);
  };

  const removeRedemption = () => {
    setAppliedRedemption(null);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        restaurantId,
        setRestaurantId,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartSubtotal,
        deliveryFee,
        orderType,
        setOrderType,
        deliveryAddress,
        setDeliveryAddress,
        selectedBranch,
        setSelectedBranch,
        appliedCoupon,
        applyCouponCode,
        removeCoupon,
        appliedRedemption,
        applyRedemption,
        removeRedemption,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
