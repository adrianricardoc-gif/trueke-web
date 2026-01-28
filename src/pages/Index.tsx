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
import { Sparkles, Loader2, RefreshCw, Eye, HelpCircle, AlertCircle, Undo2, Star } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import isotipo from "@/assets/trueke-isotipo-clean.png";
import MatchCelebration from "@/components/MatchCelebration";
import { useMatchNotification } from "@/hooks/useMatchNotification";
import { InteractiveTutorial } from "@/components/InteractiveTutorial";
import { useAuth } from "@/contexts/AuthContext";
import SelectProductDialog from "@/components/SelectProductDialog";
import HotProductsSection from "@/components/HotProductsSection";
import PremiumControls from "@/components/PremiumControls";
import { usePremiumFeatures } from "@/hooks/usePremiumFeatures";
interface Filters {
  searchQuery: string;
  categories: string[];
  location: string;
  minPrice: number;
  maxPrice: number;
  conditions: ConditionOption[];
  sortBy: SortOption;
  productType: ProductTypeOption;
}

const Index = () => {
  const [browseOnlyMode, setBrowseOnlyMode] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{
    id: string;
    title: string;
    images: string[];
    estimated_value: number;
    category: string;
  } | null>(null);
  const [filters, setFilters] = useState<Filters>({
    searchQuery: "",
    categories: [],
    location: "",
    minPrice: 0,
    maxPrice: 5000,
    conditions: [],
    sortBy: "newest",
    productType: "all",
  });
  
  // Solo Miro popup state
  const [showSelectProductPopup, setShowSelectProductPopup] = useState(false);
  const [pendingLikeProduct, setPendingLikeProduct] = useState<any>(null);

  // Tutorial state
  const { user } = useAuth();
  const [showTutorial, setShowTutorial] = useState(false);

  // Check if tutorial should be shown for new users
  useEffect(() => {
    if (user) {
      const tutorialCompleted = localStorage.getItem("trueke_interactive_tutorial_completed");
      if (!tutorialCompleted) {
        // Delay slightly to allow page to render
        const timer = setTimeout(() => setShowTutorial(true), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [user]);
  
  // Register service worker and realtime notifications
  useServiceWorker();
  useRealtimeNotifications();
  
  // Match celebration
  const { newMatch, clearMatch } = useMatchNotification();
  
  const handleProductSelect = useCallback((product: typeof selectedProduct) => {
    setSelectedProduct(product);
    setBrowseOnlyMode(false);
  }, []);

  const handleBrowseOnlyChange = useCallback((value: boolean) => {
    setBrowseOnlyMode(value);
    if (value) {
      setSelectedProduct(null);
    }
  }, []);


  // Premium features
  const { sendSuperLike, canUseSuperLike, remainingSuperLikes, useRewind, canUseRewind } = usePremiumFeatures();

  const { 
    currentProduct, 
    loading, 
    handleLike, 
    handleDislike, 
    hasMore,
    refetch,
    showingAlternatives,
    clearAlternatives,
    undoLastDislike,
    canUndo,
    totalCount,
  } = useProducts(
    filters.categories.length === 0 ? "all" : filters.categories[0], 
    filters, 
    browseOnlyMode ? null : selectedProduct?.id
  );

  // Super Like handler
  const onSuperLike = async () => {
    if (!currentProduct) return;
    const result = await sendSuperLike(currentProduct.user_id, currentProduct.id);
    if (result.success) {
      // Move to next product
      await handleLike();
    }
  };
  const onUndo = async () => {
    // Use rewind from premium features for tracking
    const canDoRewind = await useRewind();
    if (!canDoRewind) return;
    
    const success = await undoLastDislike();
    if (success) {
      toast({
        title: "↩️ Deshecho",
        description: "Has recuperado el producto anterior",
      });
    }
  };

  const onLike = async () => {
    const product = await handleLike();
    if (product) {
      toast({
        title: "¡Te interesa!",
        description: `${product.title} agregado a tus truekes potenciales`,
      });
    }
  };

  // Handle like when in browse only mode - show popup to select product
  const handleBrowseOnlyLike = () => {
    if (currentProduct) {
      setPendingLikeProduct(currentProduct);
      setShowSelectProductPopup(true);
    }
  };

  // When user selects a product from popup, set it and process the like
  const handleProductSelectedFromPopup = async (product: typeof selectedProduct) => {
    if (product) {
      setSelectedProduct(product);
      setBrowseOnlyMode(false);
      // Process the pending like after selection
      toast({
        title: "¡Producto seleccionado!",
        description: `Ahora puedes hacer match con "${pendingLikeProduct?.title}"`,
      });
      setPendingLikeProduct(null);
    }
  };

  const onDislike = async () => {
    await handleDislike();
    toast({
      title: "Pasaste",
      description: "Buscando más opciones para ti...",
    });
  };

  const handleFiltersChange = (newFilters: Filters) => {
    setFilters(newFilters);
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header - Hidden on mobile */}
      <div className="hidden lg:block">
        <Header />
      </div>
      
      {/* Mobile/Tablet Header with Isotipo - Compact */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 border-b lg:hidden safe-area-inset-top">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="w-8" /> {/* Spacer */}
          <img 
            src={isotipo} 
            alt="Trueke" 
            className="h-9 w-9 md:h-10 md:w-10 rounded-xl object-contain" 
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:h-9 md:w-9 touch-manipulation"
            onClick={() => setShowTutorial(true)}
          >
            <HelpCircle className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
      </header>

      {/* Interactive Tutorial */}
      <InteractiveTutorial 
        isOpen={showTutorial} 
        onClose={() => setShowTutorial(false)} 
      />

      {/* Match Celebration */}
      <MatchCelebration match={newMatch} onClose={clearMatch} />
      
      <main className="container mx-auto px-3 py-3 md:px-6 lg:px-8 md:py-4 lg:py-6 max-w-6xl">
        {/* Hero Section - Hidden on mobile/tablet for more space */}
        <section className="hidden lg:block text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted mb-3">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium text-muted-foreground">
              Explora productos para trueke
            </span>
          </div>
          <h1 className="text-3xl xl:text-4xl font-bold text-foreground mb-2">
            Encuentra tu <span className="text-gradient">Trueke</span>
          </h1>
          <p className="text-base text-muted-foreground max-w-md mx-auto">
            Desliza a la derecha si te interesa, izquierda si no
          </p>
        </section>

        {/* HOT Products Section - Show popular products */}
        <section className="mb-4 lg:hidden">
          <HotProductsSection />
        </section>

        {/* Search and Filters */}
        <section className="mb-4 lg:mb-8 space-y-3 lg:space-y-4">
          {/* Product Selector - Select what you're offering */}
          <div data-tutorial="product-selector">
            <MyProductSelector 
              selectedProductId={selectedProduct?.id || null}
              onSelect={handleProductSelect}
              browseOnlyMode={browseOnlyMode}
              onBrowseOnlyChange={handleBrowseOnlyChange}
            />
          </div>

          {/* Unified Search & Filters - Rappi/DoorDash Style */}
          <div data-tutorial="search-bar">
            <UnifiedSearchFilters
              onFiltersChange={handleFiltersChange}
              productTitle={selectedProduct?.title}
              resultCount={totalCount}
              isLoading={loading}
            />
          </div>

          {/* Premium Controls - Compact on mobile */}
          <div className="lg:hidden">
            <PremiumControls compact onSuperLike={onSuperLike} />
          </div>

        </section>

        {/* Content Section - Swipe Cards */}
        <section className="min-h-[calc(100vh-340px)] md:min-h-[calc(100vh-300px)] lg:min-h-[450px] flex items-start justify-center">
          {!selectedProduct && !browseOnlyMode ? (
            <div className="flex justify-center items-start pt-8 md:pt-12">
              <div className="text-center p-5 md:p-8 space-y-3">
                <div className="w-14 h-14 md:w-16 md:h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                  <Sparkles className="h-6 w-6 md:h-7 md:w-7 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-base md:text-lg font-semibold text-foreground mb-1">
                    Selecciona tu producto
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground max-w-xs">
                    Elige qué ofreces o activa "Solo miro"
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-start w-full">
              {loading ? (
                <div className="flex flex-col items-center gap-3 pt-8 md:pt-12">
                  <Loader2 className="h-8 w-8 md:h-10 md:w-10 animate-spin text-primary" />
                  <p className="text-sm md:text-base text-muted-foreground text-center px-4">
                    {browseOnlyMode 
                      ? "Explorando productos..." 
                      : `Buscando truekes para "${selectedProduct?.title}"...`}
                  </p>
                </div>
              ) : currentProduct && hasMore ? (
                <div className="flex flex-col items-center gap-3 w-full max-w-sm md:max-w-md lg:max-w-lg" data-tutorial="swipe-card">
                  {/* Alert for showing alternative products */}
                  {showingAlternatives && (
                    <Alert className="bg-amber-500/10 border-amber-500/30 py-2 w-full max-w-[340px] md:max-w-[380px]">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <AlertDescription className="text-xs md:text-sm text-amber-700 dark:text-amber-300">
                        No hay más en tus categorías. Te mostramos otras opciones.
                        <button 
                          onClick={clearAlternatives}
                          className="underline ml-1 font-medium touch-manipulation"
                        >
                          Cambiar filtros
                        </button>
                      </AlertDescription>
                    </Alert>
                  )}
                  {browseOnlyMode && !showingAlternatives && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-xs md:text-sm font-medium text-muted-foreground">
                      <Eye className="h-3.5 w-3.5" />
                      Modo explorar (no puedes hacer match)
                    </span>
                  )}
                  <SwipeCard
                    product={currentProduct}
                    onLike={browseOnlyMode ? handleBrowseOnlyLike : onLike}
                    onDislike={onDislike}
                    onSuperLike={!browseOnlyMode && canUseSuperLike ? onSuperLike : undefined}
                    myProduct={selectedProduct}
                  />
                  {/* Undo Button */}
                  {canUndo && (
                    <Button
                      onClick={onUndo}
                      variant="outline"
                      size="sm"
                      className="gap-1.5 rounded-full bg-card border-muted-foreground/30 shadow-sm mt-2 touch-manipulation"
                    >
                      <Undo2 className="h-4 w-4" />
                      Deshacer
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center p-6 md:p-8 space-y-3">
                  <div className="w-14 h-14 md:w-16 md:h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                    <Sparkles className="h-6 w-6 md:h-7 md:w-7 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-base md:text-lg font-semibold text-foreground mb-1">
                      ¡No hay más productos!
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground mb-3">
                      Vuelve más tarde o cambia los filtros
                    </p>
                    <Button 
                      onClick={refetch} 
                      variant="outline" 
                      size="sm" 
                      className="gap-1.5 h-9 text-sm touch-manipulation"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Actualizar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Stats Section - Hidden on mobile/tablet for cleaner look */}
        <section className="hidden lg:grid mt-8 grid-cols-3 gap-4 max-w-lg mx-auto">
          <div className="text-center p-4 xl:p-5 rounded-2xl bg-card shadow-card hover:shadow-card-hover transition-shadow">
            <p className="text-2xl xl:text-3xl font-bold text-gradient">2.5K+</p>
            <p className="text-xs xl:text-sm text-muted-foreground">Usuarios activos</p>
          </div>
          <div className="text-center p-4 xl:p-5 rounded-2xl bg-card shadow-card hover:shadow-card-hover transition-shadow">
            <p className="text-2xl xl:text-3xl font-bold text-trueke-green">850+</p>
            <p className="text-xs xl:text-sm text-muted-foreground">Truekes exitosos</p>
          </div>
          <div className="text-center p-4 xl:p-5 rounded-2xl bg-card shadow-card hover:shadow-card-hover transition-shadow">
            <p className="text-2xl xl:text-3xl font-bold text-trueke-orange">15K+</p>
            <p className="text-xs xl:text-sm text-muted-foreground">Productos</p>
          </div>
        </section>
      </main>

      <BottomNav />
      
      {/* Select Product Popup for Browse Only Mode */}
      <SelectProductDialog
        open={showSelectProductPopup}
        onOpenChange={setShowSelectProductPopup}
        onSelect={handleProductSelectedFromPopup}
        title="¿Qué ofreces a cambio?"
        description="Selecciona tu producto para poder hacer match con este artículo"
      />
    </div>
  );
};

export default Index;
