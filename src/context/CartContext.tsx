import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { mockProducts, type CustomerProduct } from "@/data/customerMockData";

export type CartEntry = {
  productId: string;
  quantity: number;
};

export type CartLineItem = CustomerProduct & {
  quantity: number;
};

type CartContextValue = {
  cart: CartEntry[];
  items: CartLineItem[];
  totalCount: number;
  subtotal: number;
  addToCart: (product: CustomerProduct, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);
const STORAGE_KEY = "first-root-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      setCart(raw ? (JSON.parse(raw) as CartEntry[]) : []);
    } catch {
      setCart([]);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart, isHydrated]);

  const items = useMemo<CartLineItem[]>(() => {
    return cart
      .map((entry) => {
        const product = mockProducts.find((item) => item.id === entry.productId);
        return product ? { ...product, quantity: entry.quantity } : null;
      })
      .filter((item): item is CartLineItem => item !== null);
  }, [cart]);

  const totalCount = useMemo(
    () => cart.reduce((sum, entry) => sum + Math.max(0, entry.quantity), 0),
    [cart],
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  const addToCart = useCallback((product: CustomerProduct, quantity = 1) => {
    setCart((current) => {
      const nextQuantity = Math.max(1, quantity);
      const existing = current.find((entry) => entry.productId === product.id);

      if (existing) {
        return current.map((entry) =>
          entry.productId === product.id
            ? { ...entry, quantity: entry.quantity + nextQuantity }
            : entry,
        );
      }

      return [...current, { productId: product.id, quantity: nextQuantity }];
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    const nextQuantity = Math.max(0, quantity);

    setCart((current) => {
      if (nextQuantity === 0) {
        return current.filter((entry) => entry.productId !== productId);
      }

      return current.map((entry) =>
        entry.productId === productId ? { ...entry, quantity: nextQuantity } : entry,
      );
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setCart((current) => current.filter((entry) => entry.productId !== productId));
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      items,
      totalCount,
      subtotal,
      addToCart,
      updateQuantity,
      removeItem,
    }),
    [addToCart, cart, items, subtotal, totalCount, updateQuantity, removeItem],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
}
