import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Package, Send, Inbox, Loader2, Heart, Star, CheckCircle, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ReviewForm from "@/components/ReviewForm";
import { toast } from "@/hooks/use-toast";

interface Product {
  id: string;
  title: string;
  images: string[];
  estimated_value: number;
  category: string;
  status: string;
}

interface Match {
  id: string;
  status: string;
  created_at: string;
  product1_id: string;
  product2_id: string;
  user1_id: string;
  user2_id: string;
  product1?: Product;
  product2?: Product;
}

interface SwipedProduct {
  id: string;
  product_id: string;
  product?: Product;
}

const MyTruekes = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("products");
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [sentProposals, setSentProposals] = useState<Match[]>([]);
  const [receivedProposals, setReceivedProposals] = useState<Match[]>([]);
  const [likedProducts, setLikedProducts] = useState<SwipedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewedMatches, setReviewedMatches] = useState<Set<string>>(new Set());
  const [reviewModal, setReviewModal] = useState<{
    isOpen: boolean;
    matchId: string;
    reviewedUserId: string;
    reviewedUserName: string;
  }>({
    isOpen: false,
    matchId: "",
    reviewedUserId: "",
    reviewedUserName: "",
  });

  useEffect(() => {
    if (user) {
      fetchData();
      fetchReviewedMatches();
    }
  }, [user]);

  const fetchReviewedMatches = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("reviews")
      .select("match_id")
      .eq("reviewer_id", user.id);
    
    if (data) {
      setReviewedMatches(new Set(data.map(r => r.match_id)));
    }
  };

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch my products
      const { data: products } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setMyProducts(products || []);

      // Fetch matches where I initiated (sent proposals)
      const { data: sent } = await supabase
        .from("matches")
        .select("*")
        .eq("user1_id", user.id)
        .order("created_at", { ascending: false });

      // Fetch product details for sent matches
      if (sent && sent.length > 0) {
        const productIds = [...new Set(sent.flatMap(m => [m.product1_id, m.product2_id]))];
        const { data: matchProducts } = await supabase
          .from("products")
          .select("*")
          .in("id", productIds);

        const sentWithProducts = sent.map(match => ({
          ...match,
          product1: matchProducts?.find(p => p.id === match.product1_id),
          product2: matchProducts?.find(p => p.id === match.product2_id),
        }));
        setSentProposals(sentWithProducts);
      } else {
        setSentProposals([]);
      }

      // Fetch matches where I received (received proposals)
      const { data: received } = await supabase
        .from("matches")
        .select("*")
        .eq("user2_id", user.id)
        .order("created_at", { ascending: false });

      if (received && received.length > 0) {
        const productIds = [...new Set(received.flatMap(m => [m.product1_id, m.product2_id]))];
        const { data: matchProducts } = await supabase
          .from("products")
          .select("*")
          .in("id", productIds);

        const receivedWithProducts = received.map(match => ({
          ...match,
          product1: matchProducts?.find(p => p.id === match.product1_id),
          product2: matchProducts?.find(p => p.id === match.product2_id),
        }));
        setReceivedProposals(receivedWithProducts);
      } else {
        setReceivedProposals([]);
      }

      // Fetch liked products (swipes with action = 'like')
      const { data: swipes } = await supabase
        .from("swipes")
        .select("id, product_id")
        .eq("user_id", user.id)
        .eq("action", "like");

      if (swipes && swipes.length > 0) {
        const productIds = swipes.map(s => s.product_id);
        const { data: likedProductsData } = await supabase
          .from("products")
          .select("*")
          .in("id", productIds);

        const swipesWithProducts = swipes.map(swipe => ({
          ...swipe,
          product: likedProductsData?.find(p => p.id === swipe.product_id),
        }));
        setLikedProducts(swipesWithProducts);
      } else {
        setLikedProducts([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Pendiente", variant: "secondary" },
      accepted: { label: "Aceptado", variant: "default" },
      rejected: { label: "Rechazado", variant: "destructive" },
      completed: { label: "Completado", variant: "outline" },
    };
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const ProductCard = ({ product }: { product: Product }) => (
    <Card className="overflow-hidden">
      <div className="aspect-square relative">
        <img
          src={product.images[0] || "/placeholder.svg"}
          alt={product.title}
          className="w-full h-full object-cover"
        />
        <Badge className="absolute top-2 right-2" variant="secondary">
          {product.category}
        </Badge>
      </div>
      <CardContent className="p-3">
        <h3 className="font-medium text-sm truncate">{product.title}</h3>
        <p className="text-xs text-muted-foreground">
          ${product.estimated_value.toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );

  const MatchCard = ({ match, type }: { match: Match; type: "sent" | "received" }) => {
    const [completing, setCompleting] = useState(false);
    const [responding, setResponding] = useState(false);
    const myProduct = type === "sent" ? match.product1 : match.product2;
    const theirProduct = type === "sent" ? match.product2 : match.product1;
    const otherUserId = type === "sent" ? match.user2_id : match.user1_id;
    const canReview = match.status === "completed" && !reviewedMatches.has(match.id);
    const canComplete = match.status === "accepted";
    const canRespond = type === "received" && match.status === "pending";

    const handleOpenReview = async () => {
      // Fetch other user's profile name
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", otherUserId)
        .maybeSingle();

      setReviewModal({
        isOpen: true,
        matchId: match.id,
        reviewedUserId: otherUserId,
        reviewedUserName: profile?.display_name || "Usuario",
      });
    };

    const handleMarkCompleted = async () => {
      setCompleting(true);
      try {
        const { error } = await supabase
          .from("matches")
          .update({ status: "completed" })
          .eq("id", match.id);

        if (error) throw error;

        toast({
          title: "¡Trueke completado!",
          description: "Ahora puedes valorar al otro usuario",
        });

        fetchData();
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "No se pudo completar el trueke",
        });
      } finally {
        setCompleting(false);
      }
    };

    const handleAcceptMatch = async () => {
      setResponding(true);
      try {
        const { error } = await supabase
          .from("matches")
          .update({ status: "accepted" })
          .eq("id", match.id);

        if (error) throw error;

        toast({
          title: "¡Propuesta aceptada!",
          description: "Ahora pueden coordinar el intercambio",
        });

        fetchData();
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "No se pudo aceptar la propuesta",
        });
      } finally {
        setResponding(false);
      }
    };

    const handleRejectMatch = async () => {
      setResponding(true);
      try {
        const { error } = await supabase
          .from("matches")
          .update({ status: "rejected" })
          .eq("id", match.id);

        if (error) throw error;

        toast({
          title: "Propuesta rechazada",
          description: "La propuesta ha sido rechazada",
        });

        fetchData();
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "No se pudo rechazar la propuesta",
        });
      } finally {
        setResponding(false);
      }
    };

    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-xs font-medium text-primary mb-1">
                {type === "sent" ? "🎁 Tu producto" : "📦 Recibes"}
              </p>
              <div className="flex items-center gap-2">
                <img
                  src={myProduct?.images[0] || "/placeholder.svg"}
                  alt={myProduct?.title}
                  className="w-12 h-12 rounded-lg object-cover border-2 border-primary/20"
                />
                <span className="text-sm font-medium truncate">
                  {myProduct?.title || "Producto"}
                </span>
              </div>
            </div>

            <div className="text-2xl">⇄</div>

            <div className="flex-1">
              <p className="text-xs font-medium text-secondary mb-1">
                {type === "sent" ? "🔄 A cambio de" : "🎁 A cambio de tu"}
              </p>
              <div className="flex items-center gap-2">
                <img
                  src={theirProduct?.images[0] || "/placeholder.svg"}
                  alt={theirProduct?.title}
                  className="w-12 h-12 rounded-lg object-cover border-2 border-secondary/20"
                />
                <span className="text-sm font-medium truncate">
                  {theirProduct?.title || "Producto"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-4 pt-3 border-t">
            {canRespond && (
              <div className="flex gap-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-1 text-xs border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      disabled={responding}
                    >
                      <X className="h-3 w-3" />
                      Rechazar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Rechazar propuesta?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. El otro usuario será notificado del rechazo.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleRejectMatch}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {responding ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Sí, rechazar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button
                  size="sm"
                  className="flex-1 gap-1 text-xs gradient-brand"
                  onClick={handleAcceptMatch}
                  disabled={responding}
                >
                  {responding ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                  Aceptar
                </Button>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {new Date(match.created_at).toLocaleDateString()}
              </span>
              <div className="flex items-center gap-2">
                {canComplete && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-xs border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                    onClick={handleMarkCompleted}
                    disabled={completing}
                  >
                    {completing ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <CheckCircle className="h-3 w-3" />
                    )}
                    Completar
                  </Button>
                )}
                {canReview && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-xs"
                    onClick={handleOpenReview}
                  >
                    <Star className="h-3 w-3" />
                    Valorar
                  </Button>
                )}
                {reviewedMatches.has(match.id) && match.status === "completed" && (
                  <Badge variant="outline" className="text-xs">
                    <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                    Valorado
                  </Badge>
                )}
                {getStatusBadge(match.status)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const EmptyState = ({ icon: Icon, message }: { icon: typeof Package; message: string }) => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="h-12 w-12 text-muted-foreground/50 mb-4" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Mis Truekes</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="products" className="text-xs">
              <Package className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Mis</span> Productos
            </TabsTrigger>
            <TabsTrigger value="liked" className="text-xs">
              <Heart className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Me</span> Gustan
            </TabsTrigger>
            <TabsTrigger value="sent" className="text-xs">
              <Send className="h-4 w-4 mr-1" />
              Enviadas
            </TabsTrigger>
            <TabsTrigger value="received" className="text-xs">
              <Inbox className="h-4 w-4 mr-1" />
              Recibidas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-4">
            {myProducts.length === 0 ? (
              <EmptyState icon={Package} message="No has publicado productos aún" />
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {myProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="liked" className="mt-4">
            {likedProducts.length === 0 ? (
              <EmptyState icon={Heart} message="No has dado like a ningún producto" />
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {likedProducts.map((swipe) =>
                  swipe.product ? (
                    <ProductCard key={swipe.id} product={swipe.product} />
                  ) : null
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sent" className="mt-4">
            {sentProposals.length === 0 ? (
              <EmptyState icon={Send} message="No has enviado propuestas" />
            ) : (
              <div className="space-y-4">
                {sentProposals.map((match) => (
                  <MatchCard key={match.id} match={match} type="sent" />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="received" className="mt-4">
            {receivedProposals.length === 0 ? (
              <EmptyState icon={Inbox} message="No has recibido propuestas" />
            ) : (
              <div className="space-y-4">
                {receivedProposals.map((match) => (
                  <MatchCard key={match.id} match={match} type="received" />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <ReviewForm
        isOpen={reviewModal.isOpen}
        onClose={() => setReviewModal({ ...reviewModal, isOpen: false })}
        matchId={reviewModal.matchId}
        reviewedUserId={reviewModal.reviewedUserId}
        reviewedUserName={reviewModal.reviewedUserName}
        onReviewSubmitted={fetchReviewedMatches}
      />
    </div>
  );
};

export default MyTruekes;
