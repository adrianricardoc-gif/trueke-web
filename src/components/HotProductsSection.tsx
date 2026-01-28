import { useState } from "react";
import { Flame, Star, Zap, Eye, Rocket, ChevronRight, Lock, Crown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useHotProducts } from "@/hooks/useHotProducts";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "@/lib/utils";

const HotProductsSection = () => {
  const { hotProducts, loading, isEnabled } = useHotProducts(8);
  const navigate = useNavigate();

  // Don't render if feature is disabled
  if (!isEnabled) {
    return null;
  }

  if (loading) {
    return (
      <Card className="border-trueke-orange/30 bg-gradient-to-br from-trueke-orange/5 to-trueke-pink/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Flame className="h-5 w-5 text-trueke-orange animate-pulse" />
            HOT 🔥
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 overflow-hidden">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-40 w-32 shrink-0 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hotProducts.length === 0) {
    return null;
  }

  return (
    <Card className="border-trueke-orange/30 bg-gradient-to-br from-trueke-orange/5 to-trueke-pink/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Flame className="h-5 w-5 text-trueke-orange" />
            HOT 🔥
          </CardTitle>
          <Badge variant="outline" className="text-xs text-trueke-orange border-trueke-orange/30">
            Los más populares
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <ScrollArea className="w-full">
          <div className="flex gap-3 pb-2">
            {hotProducts.map((product, index) => (
              <div
                key={product.id}
                className="relative shrink-0 w-32 group cursor-pointer"
                onClick={() => navigate(`/`)}
              >
                {/* Position badge */}
                {index < 3 && (
                  <div className={`absolute -top-1 -left-1 z-10 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                    index === 0 ? 'bg-gradient-to-r from-yellow-400 to-amber-500' :
                    index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400' :
                    'bg-gradient-to-r from-amber-600 to-amber-700'
                  }`}>
                    {index + 1}
                  </div>
                )}

                {/* Product image */}
                <div className="relative h-32 rounded-lg overflow-hidden bg-muted">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Flame className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                  )}

                  {/* Hot score indicator */}
                  <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <Flame className="h-3 w-3 text-trueke-orange" />
                    {product.like_count}
                  </div>

                  {/* Premium badge if boosted */}
                  {(product.premium_boost > 1 || product.active_boost > 1) && (
                    <div className="absolute top-1 right-1">
                      <Zap className="h-4 w-4 text-trueke-yellow drop-shadow-lg" />
                    </div>
                  )}
                </div>

                {/* Product info */}
                <div className="mt-1.5">
                  <p className="text-xs font-medium truncate">{product.title}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatCurrency(product.estimated_value)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default HotProductsSection;
