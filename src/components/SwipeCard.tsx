import { useState, useEffect } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { Heart, X, ChevronLeft, ChevronRight, MapPin, ArrowLeftRight, Bookmark, BadgeCheck, Briefcase, ShoppingBag, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import UserRating from "@/components/UserRating";
import ReportDialog from "@/components/ReportDialog";
import TrustBadge from "@/components/TrustBadge";
import PremiumBadge from "@/components/PremiumBadge";
import { supabase } from "@/integrations/supabase/client";
import { useFavorites } from "@/hooks/useFavorites";
import { useToast } from "@/hooks/use-toast";
import { useTrustScore } from "@/hooks/useTrustScore";
import { useUserPremiumStatus } from "@/hooks/useUserPremiumStatus";
import PriceDifferenceDialog from "@/components/PriceDifferenceDialog";

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
  product_type?: string;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
    is_verified?: boolean;
  } | null;
}

interface SwipeCardProps {
  product: Product;
  onLike: () => void;
  onDislike: () => void;
  onSuperLike?: () => void;
  myProduct?: {
    id: string;
    title: string;
    images: string[];
    estimated_value: number;
  } | null;
}

const SwipeCard = ({ product, onLike, onDislike, onSuperLike, myProduct }: SwipeCardProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(null);
  const [userRating, setUserRating] = useState({ average: 0, count: 0 });
  const [showPriceDiffDialog, setShowPriceDiffDialog] = useState(false);
  const [pendingLike, setPendingLike] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { toast } = useToast();
  const { trustData } = useTrustScore(product.user_id);
  const { isPremium, planName } = useUserPremiumStatus(product.user_id);
  
  // Calculate price difference
  const priceDifference = myProduct ? Math.abs(product.estimated_value - myProduct.estimated_value) : 0;
  const hasSigDifference = myProduct && priceDifference > 20; // $20+ difference is significant
  const isService = product.product_type === "service";

  // Fetch user rating
  useEffect(() => {
    const fetchRating = async () => {
      const { data } = await supabase
        .from("reviews")
        .select("rating")
        .eq("reviewed_id", product.user_id);

      if (data && data.length > 0) {
        const total = data.reduce((sum, r) => sum + r.rating, 0);
        setUserRating({
          average: Math.round((total / data.length) * 10) / 10,
          count: data.length,
        });
      }
    };

    fetchRating();
  }, [product.user_id]);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-25, 0, 25]);
  const opacity = useTransform(x, [-300, -100, 0, 100, 300], [0.5, 1, 1, 1, 0.5]);
  
  // Overlay opacity based on drag
  const likeOpacity = useTransform(x, [0, 100, 200], [0, 0.5, 1]);
  const dislikeOpacity = useTransform(x, [-200, -100, 0], [1, 0.5, 0]);

  const images = product.images.length > 0 ? product.images : ["/placeholder.svg"];

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleDragEnd = (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    const swipeThreshold = 100;
    const velocityThreshold = 500;

    if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      // Check for significant price difference before liking
      if (hasSigDifference) {
        setPendingLike(true);
        setShowPriceDiffDialog(true);
      } else {
        setExitDirection("right");
        setTimeout(onLike, 200);
      }
    } else if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
      setExitDirection("left");
      setTimeout(onDislike, 200);
    }
  };

  const handleButtonLike = () => {
    // Check for significant price difference before liking
    if (hasSigDifference) {
      setPendingLike(true);
      setShowPriceDiffDialog(true);
    } else {
      setExitDirection("right");
      setTimeout(onLike, 200);
    }
  };

  const handleButtonDislike = () => {
    setExitDirection("left");
    setTimeout(onDislike, 200);
  };

  const handlePriceDiffConfirm = (additionalAmount: number, direction: "offer" | "request") => {
    // Store the additional amount preference (could be sent with the like)
    if (additionalAmount > 0) {
      toast({
        title: direction === "offer" ? "💵 Oferta enviada" : "💵 Solicitud enviada",
        description: direction === "offer" 
          ? `Ofrecerás ${formatCurrency(additionalAmount)} adicionales`
          : `Solicitarás ${formatCurrency(additionalAmount)} adicionales`,
      });
    }
    
    if (pendingLike) {
      setExitDirection("right");
      setTimeout(onLike, 200);
      setPendingLike(false);
    }
  };

  const ownerName = product.profile?.display_name || "Usuario";
  const ownerAvatar = product.profile?.avatar_url || null;
  const isVerified = product.profile?.is_verified || false;
  const isProductFavorite = isFavorite(product.id);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await toggleFavorite(product.id);
    if (success) {
      toast({
        title: isProductFavorite ? "Eliminado de favoritos" : "Agregado a favoritos",
        description: isProductFavorite ? "El producto ha sido removido" : "Guardado para ver después",
      });
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={product.id}
        className="relative w-full max-w-[340px] md:max-w-[380px] lg:max-w-[400px] mx-auto bg-card rounded-3xl shadow-card overflow-hidden cursor-grab active:cursor-grabbing select-none touch-manipulation will-change-transform"
        style={{ x, rotate, opacity }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.9}
        onDragEnd={handleDragEnd}
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ 
          scale: 1, 
          opacity: 1, 
          y: 0,
          x: exitDirection === "right" ? 500 : exitDirection === "left" ? -500 : 0,
        }}
        exit={{ 
          x: exitDirection === "right" ? 500 : -500,
          opacity: 0,
          scale: 0.8,
          rotate: exitDirection === "right" ? 20 : -20,
        }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 25,
          opacity: { duration: 0.2 }
        }}
        whileDrag={{ scale: 1.02 }}
      >
        {/* Like Overlay - GREEN for right swipe */}
        <motion.div 
          className="absolute inset-0 z-20 flex items-center justify-center bg-green-500/40 backdrop-blur-sm pointer-events-none"
          style={{ opacity: likeOpacity }}
        >
          <motion.div 
            className="bg-green-500 rounded-full p-5 shadow-lg"
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500 }}
          >
            <Heart className="h-12 w-12 text-white" fill="currentColor" />
          </motion.div>
        </motion.div>

        {/* Dislike Overlay - RED for left swipe */}
        <motion.div 
          className="absolute inset-0 z-20 flex items-center justify-center bg-red-500/40 backdrop-blur-sm pointer-events-none"
          style={{ opacity: dislikeOpacity }}
        >
          <motion.div 
            className="bg-red-500 rounded-full p-5 shadow-lg"
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500 }}
          >
            <X className="h-12 w-12 text-white" />
          </motion.div>
        </motion.div>

        {/* Image Gallery - Responsive aspect ratio */}
        <div className="relative aspect-[4/3] md:aspect-[16/10] lg:aspect-[4/3] bg-muted overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentImageIndex}
              src={images[currentImageIndex]}
              alt={product.title}
              className="w-full h-full object-cover"
              draggable={false}
              loading="lazy"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            />
          </AnimatePresence>
          
          {/* Image Indicators */}
          {images.length > 1 && (
            <div className="absolute top-4 left-4 right-4 flex gap-1">
              {images.map((_, index) => (
                <motion.div
                  key={index}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-all",
                    index === currentImageIndex ? "bg-primary-foreground" : "bg-primary-foreground/40"
                  )}
                  animate={{ 
                    scaleY: index === currentImageIndex ? 1.5 : 1 
                  }}
                  transition={{ type: "spring", stiffness: 500 }}
                />
              ))}
            </div>
          )}

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <motion.button
                onClick={handlePrevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-card/80 backdrop-blur-sm hover:bg-card transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ChevronLeft className="h-5 w-5" />
              </motion.button>
              <motion.button
                onClick={handleNextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-card/80 backdrop-blur-sm hover:bg-card transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ChevronRight className="h-5 w-5" />
              </motion.button>
            </>
          )}

          {/* Category Badge + Product Type */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <motion.button
              onClick={handleToggleFavorite}
              className={cn(
                "p-2 rounded-full backdrop-blur-sm transition-colors",
                isProductFavorite ? "bg-primary text-primary-foreground" : "bg-card/90 text-foreground"
              )}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Bookmark className={cn("h-4 w-4", isProductFavorite && "fill-current")} />
            </motion.button>
            {isService && (
              <motion.div 
                className="px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold flex items-center gap-1"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <Briefcase className="h-3 w-3" />
                Servicio
              </motion.div>
            )}
            <motion.div 
              className="px-3 py-1 rounded-full bg-card/90 backdrop-blur-sm text-sm font-medium"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {product.category}
            </motion.div>
          </div>
        </div>

        {/* Content - Responsive layout */}
        <motion.div 
          className="p-4 md:p-5 space-y-3 md:space-y-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Owner Row */}
          <div className="flex items-center gap-2">
            {ownerAvatar ? (
              <img
                src={ownerAvatar}
                alt={ownerName}
                className="h-8 w-8 rounded-full object-cover ring-2 ring-primary/20"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20">
                <span className="text-xs font-bold text-primary">
                  {ownerName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="font-medium text-sm text-foreground truncate">{ownerName}</p>
                {isVerified && <BadgeCheck className="h-3.5 w-3.5 text-primary fill-primary/20 shrink-0" />}
                {isPremium && planName && (
                  <PremiumBadge planName={planName} size="sm" variant="minimal" showLabel={false} />
                )}
              </div>
              <div className="flex items-center gap-2">
                {product.location && (
                  <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                    <MapPin className="h-3 w-3" />
                    {product.location}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {trustData && (
                <TrustBadge
                  completedTrades={trustData.completedTrades}
                  isVerified={trustData.isVerified}
                  level={trustData.level}
                  size="sm"
                  showLabel={false}
                />
              )}
              {userRating.count > 0 && (
                <UserRating rating={userRating.average} count={userRating.count} size="sm" />
              )}
              <ReportDialog type="product" productId={product.id} />
            </div>
          </div>

          {/* Title & Description */}
          <div>
            <h3 className="text-lg md:text-xl font-bold text-foreground leading-tight">{product.title}</h3>
            {product.description && (
              <p className="text-muted-foreground text-xs md:text-sm mt-0.5 line-clamp-2">{product.description}</p>
            )}
          </div>

          {/* Price Row - Inline with USD format */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg gradient-brand">
                <ArrowLeftRight className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground leading-none">Valor</p>
                <p className="text-base font-bold text-foreground">{formatCurrency(product.estimated_value)}</p>
              </div>
            </div>
            {product.additional_value && product.additional_value > 0 && (
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground leading-none">+ Adicional</p>
                <p className="text-base font-bold text-trueke-green">{formatCurrency(product.additional_value)}</p>
              </div>
            )}
          </div>

          {/* Action Buttons - Larger touch targets for mobile */}
          <div className="flex items-center gap-2 md:gap-3">
            <motion.div className="flex-1" whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleButtonDislike}
                size="lg"
                variant="outline"
                className="w-full h-12 md:h-14 rounded-xl border-2 border-destructive/30 hover:bg-destructive/10 hover:border-destructive transition-all touch-manipulation"
              >
                <X className="h-5 w-5 md:h-6 md:w-6 text-destructive" />
              </Button>
            </motion.div>
            
            {/* Super Like Button */}
            {onSuperLike && (
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={onSuperLike}
                  size="lg"
                  variant="outline"
                  className="h-12 md:h-14 w-12 md:w-14 rounded-xl border-2 border-trueke-yellow/50 hover:bg-trueke-yellow/10 hover:border-trueke-yellow transition-all touch-manipulation"
                >
                  <Star className="h-5 w-5 md:h-6 md:w-6 text-trueke-yellow" fill="currentColor" />
                </Button>
              </motion.div>
            )}
            
            <motion.div className="flex-1" whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleButtonLike}
                size="lg"
                className="w-full h-12 md:h-14 rounded-xl gradient-like hover:opacity-90 transition-opacity touch-manipulation"
              >
                <Heart className="h-5 w-5 md:h-6 md:w-6" fill="currentColor" />
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Price Difference Dialog */}
        {myProduct && (
          <PriceDifferenceDialog
            isOpen={showPriceDiffDialog}
            onClose={() => {
              setShowPriceDiffDialog(false);
              setPendingLike(false);
            }}
            onConfirm={handlePriceDiffConfirm}
            myProductValue={myProduct.estimated_value}
            theirProductValue={product.estimated_value}
            myProductTitle={myProduct.title}
            theirProductTitle={product.title}
            myProductImage={myProduct.images[0]}
            theirProductImage={product.images[0]}
            myProductId={myProduct.id}
            theirProductId={product.id}
            theirUserId={product.user_id}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default SwipeCard;
