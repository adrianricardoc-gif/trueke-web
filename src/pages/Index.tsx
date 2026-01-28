import { useState, useCallback, useEffect } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import SwipeCard from "@/components/SwipeCard";
import UnifiedSearchFilters, { type SortOption, type ProductTypeOption, type ConditionOption } from "@/components/UnifiedSearchFilters";
import MyProductSelector from "@/components/MyProductSelector";
import { useProducts } from "@/hooks/useProducts";
import { useServiceWorker } from "@/hooks/useServiceWorker";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { toast } from "@/hooks/use-toast";
import { Sparkles, Loader2, RefreshCw, HelpCircle, Undo2, X, Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
// ZONA AZUL: Importamos el logo horizontal
import logoHorizontal from "@/assets/trueke-logo-horizontal.png";
import MatchCelebration from "@/components/MatchCelebration";
import { useMatchNotification } from "@/hooks/useMatchNotification";
import { InteractiveTutorial } from "@/components/InteractiveTutorial";
import { useAuth } from "@/contexts/AuthContext";
import SelectProductDialog from "@/components/SelectProductDialog";
import HotProductsSection from "@/components/HotProductsSection";
import PremiumControls from "@/components/PremiumControls";
import { usePremiumFeatures } from "@/hooks/usePremiumFeatures";

const Index = () => {
  const [browseOnlyMode, setBrowseOnlyMode] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [filters, setFilters] = useState<any>({
    searchQuery: "",
    categories: [],
    location: "",
    minPrice: 0,
    maxPrice: 5000,
    conditions: [],
    sortBy: "newest",
    productType: "all",
  });
  
  const [showSelectProductPopup, setShowSelectProductPopup] = useState(false);
  const { user } = useAuth();
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (user) {
      const tutorialCompleted = localStorage.getItem("trueke_interactive_tutorial_completed");
      if (!tutorialCompleted) {
        const timer = setTimeout(() => setShowTutorial(true), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [user]);
  
  useServiceWorker();
  useRealtimeNotifications();
  const { newMatch, clearMatch } = useMatchNotification();
  const { sendSuperLike, canUseSuperLike, useRewind } = usePremiumFeatures();

  const { 
    currentProduct, 
    loading, 
    handleLike, 
    handleDislike, 
    hasMore,
    refetch,
    undoLastDislike,
    canUndo,
    totalCount,
  } = useProducts(
    filters.categories.length === 0 ? "all" : filters.categories[0], 
    filters, 
    browseOnlyMode ? null : selectedProduct?.id
  );

  const onLike = async () => {
    const product = await handleLike();
    if (product) {
      toast({ title: "¡Te interesa!", description: `${product.title} agregado.` });
    }
  };

  const onDislike = async () => {
    await handleDislike();
  };

  return (
    <div className="min-h-screen bg-background pb-32 overflow-x-hidden">
      <div className="hidden lg:block">
        <Header />
      </div>
      
      {/* ZONA AZUL: Header Mobile con Logo Horizontal AGRANDADO (h-14) */}
      <header className="sticky top-0 z-[100] bg-background/95 backdrop-blur-md border-b lg:hidden safe-area-inset-top">
        <div className="flex items-center justify-between px-4 py-2 h-20">
          <div className="flex-1 flex items-center">
            <img 
              src={logoHorizontal} 
              alt="Trueke" 
              className="h-14 w-auto object-contain transition-all" 
            />
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowTutorial(true)}>
            <HelpCircle className="h-7 w-7 text-muted-foreground" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-3 py-3 max-w-6xl relative z-10 overflow-visible">
        <section className="mb-4 lg:hidden">
          <HotProductsSection />
        </section>

        <section className="mb-4 space-y-3 relative z-20">
          <MyProductSelector 
            selectedProductId={selectedProduct?.id || null}
            onSelect={(p) => setSelectedProduct(p)}
            browseOnlyMode={browseOnlyMode}
            onBrowseOnlyChange={(v) => setBrowseOnlyMode(v)}
          />
          <UnifiedSearchFilters
            onFiltersChange={(f) => setFilters(f)}
            productTitle={selectedProduct?.title}
            resultCount={totalCount}
            isLoading={loading}
          />
        </section>

        {/* ZONA ROJA: Contenedor con espacio libre y z-index alto para evitar cortes */}
        <section className="relative z-50 flex flex-col items-center justify-start min-h-[600px] overflow-visible mt-6">
          {!selectedProduct && !browseOnlyMode ? (
            <div className="mt-20 text-center text-muted-foreground font-medium">
              Selecciona un producto para empezar
            </div>
          ) : (
            <div className="w-full flex flex-col items-center overflow-visible">
              {loading ? (
                <Loader2 className="h-10 w-10 animate-spin text-primary mt-20" />
              ) : currentProduct && hasMore ? (
                <>
                  {/* Tarjeta con visibilidad total */}
                  <div className="relative z-[150] w-full max-w-[350px] md:max-w-md transform-gpu overflow-visible">
                    <SwipeCard
                      product={currentProduct}
                      onLike={browseOnlyMode ? () => setShowSelectProductPopup(true) : onLike}
                      onDislike={onDislike}
                      myProduct={selectedProduct}
                    />
                  </div>

                  {/* BOTONES XL DE INTERACCIÓN: Ajustados para ergonomía móvil */}
                  <div className="flex items-center justify-center gap-8 mt-14 z-[160] relative">
                    <Button
                      onClick={onDislike}
                      variant="outline"
                      className="h-16 w-16 rounded-full border-2 border-destructive/20 bg-background text-destructive shadow-2xl active:scale-90 transition-transform touch-manipulation"
                    >
                      <X className="h-8 w-8" />
                    </Button>

                    {!browseOnlyMode && (
                      <Button
                        onClick={async () => {
                           const res = await sendSuperLike(currentProduct.user_id, currentProduct.id);
                           if(res.success) onLike();
                        }}
                        className="h-14 w-14 rounded-full bg-amber-400 text-white shadow-xl active:scale-90 transition-transform touch-manipulation"
                      >
                        <Star className="h-6 w-6 fill-current" />
                      </Button>
                    )}

                    <Button
                      onClick={onLike}
                      className="h-16 w-16 rounded-full bg-trueke-green text-white shadow-2xl active:scale-90 transition-transform touch-manipulation"
                    >
                      <Heart className="h-8 w-8 fill-current" />
                    </Button>
                  </div>

                  {canUndo && (
                    <Button
                      onClick={async () => { if(await useRewind()) undoLastDislike(); }}
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground gap-2 z-[160] relative mt-6"
                    >
                      <Undo2 className="h-4 w-4" /> Deshacer
                    </Button>
                  )}
                </>
              ) : (
                <div className="mt-20 text-center">
                  <p className="font-medium">¡No hay más productos por ahora!</p>
                  <Button onClick={refetch} variant="link">Actualizar lista</Button>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <BottomNav />
      <SelectProductDialog 
        open={showSelectProductPopup} 
        onOpenChange={setShowSelectProductPopup} 
        onSelect={(p) => {setSelectedProduct(p); setBrowseOnlyMode(false);}} 
      />
      <MatchCelebration match={newMatch} onClose={clearMatch} />
      <InteractiveTutorial isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
    </div>
  );
};

export default Index;