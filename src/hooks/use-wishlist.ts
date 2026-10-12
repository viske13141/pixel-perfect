import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/useAuth";
import {
  fetchWishlist,
  setWishlistProduct,
  type SavedProduct,
} from "@/services/customerAccountService";

export function useWishlist() {
  const { user } = useAuth();
  const client = useQueryClient();
  const key = ["customer-wishlist", user?.id];
  const query = useQuery({
    queryKey: key,
    queryFn: () => fetchWishlist(user!.id),
    enabled: Boolean(user?.id),
    refetchOnWindowFocus: true,
  });
  const mutation = useMutation({
    mutationKey: key,
    scope: { id: `wishlist-${user?.id}` },
    mutationFn: ({ product, saved }: { product: SavedProduct; saved: boolean }) =>
      setWishlistProduct(user!.id, product, saved),
    onSuccess: (items) => {
      client.setQueryData(key, items);
    },
  });
  return { user, query, mutation, items: query.data ?? [] };
}
