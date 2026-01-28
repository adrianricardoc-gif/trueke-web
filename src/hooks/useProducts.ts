import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserType } from "@/hooks/useUserType";

interface Product {
  id: string;
  title: string;
  description: string | null;
  estimated_value: number;
  additional_value: number | null;
  images: string[];
  location: string | null;
  category: string;
  user_id: string;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface Filters {
  location: string;
  minPrice: number;
  maxPrice: number;
  searchQuery: string;
  sortBy?: "newest" | "oldest" | "price_asc" | "price_desc";
  productType?: "all" | "product" | "service";
  distance?: number;
  categories?: string[];
  conditions?: string[];
}

export function useProducts(category: string = "all", filters?: Filters, offeredProductId?: string | null) {
  const { user } = useAuth();
  const { userType, isCompany } = useUserType();
  const [products, setProducts] = useState<Product[]>([]);
  const [alternativeProducts, setAlternativeProducts] = useState<Product[]>([]);
  const [showingAlternatives, setShowingAlternatives] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipedIds, setSwipedIds] = useState<Set<string>>(new Set());
  const [favoriteCategories, setFavoriteCategories] = useState<string[]>([]);
  const [lastDislikedProduct, setLastDislikedProduct] = useState<{ productId: string; swipeId: string } | null>(null);
  
  // Use refs to store latest values without causing re-renders
  const filtersRef = useRef(filters);
  const categoryRef = useRef(category);
  const favoriteCategoriesRef = useRef(favoriteCategories);
  const userTypeRef = useRef(userType);
  
  // Update refs when values change
  useEffect(() => {
    filtersRef.current = filters;
    categoryRef.current = category;
    favoriteCategoriesRef.current = favoriteCategories;
    userTypeRef.current = userType;
  }, [filters, category, favoriteCategories, userType]);

  // Fetch user's favorite categories
  useEffect(() => {
    if (!user) return;
    
    const fetchFavoriteCategories = async () => {
      try {
        const { data } = await supabase
          .from("user_favorite_categories")
          .select("category")
          .eq("user_id", user.id)
          .order("priority", { ascending: true });

        if (data) {
          setFavoriteCategories(data.map(d => d.category));
        }
      } catch (error) {
        console.error("Error fetching favorite categories:", error);
      }
    };
    
    fetchFavoriteCategories();
  }, [user]);

  // Fetch swiped products
  useEffect(() => {
    if (!user) return;

    const fetchSwipedProducts = async () => {
      try {
        const { data } = await supabase
          .from("swipes")
          .select("product_id")
          .eq("user_id", user.id);

        if (data) {
          setSwipedIds(new Set(data.map((s) => s.product_id)));
        }
      } catch (error) {
        console.error("Error fetching swiped products:", error);
      }
    };
    
    fetchSwipedProducts();
  }, [user]);

  // Main products fetch function - defined with useCallback for refetch
  const fetchProducts = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const currentFilters = filtersRef.current;
      const currentCategory = categoryRef.current;
      const currentFavoriteCategories = favoriteCategoriesRef.current;
      
      // Determine sort order
      const sortBy = currentFilters?.sortBy || "newest";
      let orderColumn = "created_at";
      let ascending = false;
      
      if (sortBy === "oldest") {
        orderColumn = "created_at";
        ascending = true;
      } else if (sortBy === "price_asc") {
        orderColumn = "estimated_value";
        ascending = true;
      } else if (sortBy === "price_desc") {
        orderColumn = "estimated_value";
        ascending = false;
      }

      let query = supabase
        .from("products")
        .select("*")
        .neq("user_id", user.id)
        .eq("status", "active")
        .order(orderColumn, { ascending });

      // Apply category filter - prioritize filters.categories over single category param
      const categoriesToFilter = currentFilters?.categories && currentFilters.categories.length > 0
        ? currentFilters.categories
        : currentCategory !== "all" ? [currentCategory] : null;
      
      if (categoriesToFilter && categoriesToFilter.length > 0) {
        query = query.in("category", categoriesToFilter);
      }

      // Apply product type filter
      if (currentFilters?.productType && currentFilters.productType !== "all") {
        query = query.eq("product_type", currentFilters.productType);
      }

      // Apply filters
      if (currentFilters) {
        if (currentFilters.location) {
          query = query.eq("location", currentFilters.location);
        }
        if (currentFilters.minPrice > 0) {
          query = query.gte("estimated_value", currentFilters.minPrice);
        }
        if (currentFilters.maxPrice < 5000) {
          query = query.lte("estimated_value", currentFilters.maxPrice);
        }
        // Apply condition filter
        if (currentFilters.conditions && currentFilters.conditions.length > 0) {
          query = query.in("condition", currentFilters.conditions);
        }
      }

      const { data: productsData, error } = await query;

      if (error) throw error;

      // Fetch profiles for product owners
      if (productsData && productsData.length > 0) {
        const userIds = [...new Set(productsData.map((p) => p.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url")
          .in("user_id", userIds);

        const profileMap = new Map(
          profiles?.map((p) => [p.user_id, p]) || []
        );

        let productsWithProfiles = productsData.map((product) => ({
          ...product,
          profile: profileMap.get(product.user_id) || null,
        }));

        // Apply text search filter on client side
        if (currentFilters?.searchQuery) {
          const searchLower = currentFilters.searchQuery.toLowerCase();
          productsWithProfiles = productsWithProfiles.filter(
            (p) =>
              p.title.toLowerCase().includes(searchLower) ||
              (p.description && p.description.toLowerCase().includes(searchLower))
          );
        }

        // Sort by favorite categories first (if viewing "all")
        if (currentCategory === "all" && currentFavoriteCategories.length > 0) {
          productsWithProfiles.sort((a, b) => {
            const aIndex = currentFavoriteCategories.indexOf(a.category);
            const bIndex = currentFavoriteCategories.indexOf(b.category);
            // Products in favorite categories come first
            if (aIndex !== -1 && bIndex === -1) return -1;
            if (aIndex === -1 && bIndex !== -1) return 1;
            if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
            return 0;
          });
        }

        // Fetch featured products for visibility boost
        const { data: featuredData } = await supabase
          .from("featured_products")
          .select("product_id, priority")
          .or(`featured_until.is.null,featured_until.gt.${new Date().toISOString()}`);

        const featuredMap = new Map(
          featuredData?.map(f => [f.product_id, f.priority]) || []
        );

        // Fetch premium user subscriptions for visibility boost
        const { data: subscriptions } = await supabase
          .from("user_subscriptions")
          .select("user_id, plan:premium_plans(visibility_boost)")
          .eq("status", "active");

        const visibilityBoostMap = new Map<string, number>();
        subscriptions?.forEach(sub => {
          const boost = (sub.plan as any)?.visibility_boost || 1;
          visibilityBoostMap.set(sub.user_id, boost);
        });

        // Personalize feed based on user type AND premium visibility
        // Featured products come first, then premium users, then regular
        const currentUserType = userTypeRef.current;
        if (currentCategory === "all" && (!currentFilters?.productType || currentFilters.productType === "all")) {
          productsWithProfiles.sort((a, b) => {
            // Featured products always come first
            const aFeatured = featuredMap.get(a.id) || 0;
            const bFeatured = featuredMap.get(b.id) || 0;
            if (aFeatured !== bFeatured) return bFeatured - aFeatured;

            // Premium users with higher visibility boost come next
            const aBoost = visibilityBoostMap.get(a.user_id) || 1;
            const bBoost = visibilityBoostMap.get(b.user_id) || 1;
            if (aBoost !== bBoost) return bBoost - aBoost;

            // Then sort by user type preference
            const aIsService = (a as any).product_type === "service";
            const bIsService = (b as any).product_type === "service";
            
            if (currentUserType === "company") {
              if (aIsService && !bIsService) return -1;
              if (!aIsService && bIsService) return 1;
            } else {
              if (!aIsService && bIsService) return -1;
              if (aIsService && !bIsService) return 1;
            }
            return 0;
          });
        }

        setProducts(productsWithProfiles);
        
        // If no products found with current filters, fetch alternatives
        if (productsWithProfiles.length === 0 && (currentFilters?.categories?.length || currentCategory !== "all")) {
          await fetchAlternativeProducts();
        } else {
          setAlternativeProducts([]);
          setShowingAlternatives(false);
        }
      } else {
        setProducts([]);
        // Fetch alternatives when no products
        if (currentFilters?.categories?.length || currentCategory !== "all") {
          await fetchAlternativeProducts();
        }
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch alternative products when no matches for current filters
  const fetchAlternativeProducts = useCallback(async () => {
    if (!user) return;
    
    try {
      const currentFilters = filtersRef.current;
      
      let query = supabase
        .from("products")
        .select("*")
        .neq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(20);

      // IMPORTANT: Respect product type filter even for alternatives
      if (currentFilters?.productType && currentFilters.productType !== "all") {
        query = query.eq("product_type", currentFilters.productType);
      }

      // Also respect price filters
      if (currentFilters?.minPrice && currentFilters.minPrice > 0) {
        query = query.gte("estimated_value", currentFilters.minPrice);
      }
      if (currentFilters?.maxPrice && currentFilters.maxPrice < 5000) {
        query = query.lte("estimated_value", currentFilters.maxPrice);
      }

      // Also respect location filter
      if (currentFilters?.location) {
        query = query.eq("location", currentFilters.location);
      }

      const { data: altProducts, error } = await query;

      if (error) throw error;

      if (altProducts && altProducts.length > 0) {
        // Fetch profiles for alternative products
        const userIds = [...new Set(altProducts.map((p) => p.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url")
          .in("user_id", userIds);

        const profileMap = new Map(
          profiles?.map((p) => [p.user_id, p]) || []
        );

        const altsWithProfiles = altProducts.map((product) => ({
          ...product,
          profile: profileMap.get(product.user_id) || null,
        }));

        setAlternativeProducts(altsWithProfiles);
        setShowingAlternatives(true);
      }
    } catch (error) {
      console.error("Error fetching alternative products:", error);
    }
  }, [user]);

  const clearAlternatives = useCallback(() => {
    setShowingAlternatives(false);
    setAlternativeProducts([]);
  }, []);

  // Fetch products when dependencies change
  // Note: Using JSON.stringify for categories array to properly detect changes
  const categoriesKey = filters?.categories?.join(',') || '';
  const conditionsKey = filters?.conditions?.join(',') || '';
  
  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user, category, filters?.location, filters?.minPrice, filters?.maxPrice, filters?.searchQuery, filters?.sortBy, filters?.productType, categoriesKey, conditionsKey, favoriteCategories, userType, fetchProducts]);

  // Combine main products with alternatives when showing alternatives
  const mainProducts = products.filter((p) => !swipedIds.has(p.id));
  const altProducts = alternativeProducts.filter((p) => !swipedIds.has(p.id));
  
  // Use alternative products if main products are empty and alternatives are available
  const availableProducts = mainProducts.length > 0 ? mainProducts : (showingAlternatives ? altProducts : []);
  const currentProduct = availableProducts[currentIndex] || null;

  const recordSwipe = useCallback(async (productId: string, action: "like" | "dislike", offeredId?: string | null) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.from("swipes").insert({
        user_id: user.id,
        product_id: productId,
        action,
        offered_product_id: offeredId || null,
      }).select("id").single();

      if (error) throw error;

      setSwipedIds((prev) => new Set([...prev, productId]));
      
      // Track last dislike for undo functionality
      if (action === "dislike" && data) {
        setLastDislikedProduct({ productId, swipeId: data.id });
      }
      
      return data?.id || null;
    } catch (error) {
      console.error("Error recording swipe:", error);
      return null;
    }
  }, [user]);

  const handleLike = useCallback(async () => {
    if (!currentProduct) return;
    await recordSwipe(currentProduct.id, "like", offeredProductId);
    setCurrentIndex((prev) => prev + 1);
    return currentProduct;
  }, [currentProduct, recordSwipe, offeredProductId]);

  const handleDislike = useCallback(async () => {
    if (!currentProduct) return;
    await recordSwipe(currentProduct.id, "dislike", offeredProductId);
    setCurrentIndex((prev) => prev + 1);
  }, [currentProduct, recordSwipe, offeredProductId]);

  const resetIndex = useCallback(() => setCurrentIndex(0), []);

  // Undo last dislike
  const undoLastDislike = useCallback(async () => {
    if (!lastDislikedProduct || !user) return false;

    try {
      const { error } = await supabase
        .from("swipes")
        .delete()
        .eq("id", lastDislikedProduct.swipeId)
        .eq("user_id", user.id);

      if (error) throw error;

      // Remove from swiped IDs
      setSwipedIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(lastDislikedProduct.productId);
        return newSet;
      });

      // Go back one index
      setCurrentIndex((prev) => Math.max(0, prev - 1));
      setLastDislikedProduct(null);
      
      return true;
    } catch (error) {
      console.error("Error undoing dislike:", error);
      return false;
    }
  }, [lastDislikedProduct, user]);

  const canUndo = !!lastDislikedProduct;

  return {
    products: availableProducts,
    currentProduct,
    loading,
    handleLike,
    handleDislike,
    resetIndex,
    refetch: fetchProducts,
    hasMore: currentIndex < availableProducts.length,
    showingAlternatives,
    clearAlternatives,
    undoLastDislike,
    canUndo,
    totalCount: availableProducts.length,
  };
}
