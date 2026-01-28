import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTradeOffers } from "@/hooks/useTradeOffers";
import { formatCurrency } from "@/lib/utils";
import {
  Package,
  Check,
  X,
  Loader2,
  ArrowRight,
  ArrowLeftRight,
  DollarSign,
  MessageSquare,
  RefreshCw,
} from "lucide-react";

interface Product {
  id: string;
  title: string;
  images: string[];
  estimated_value: number;
}

interface NegotiationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matchId: string;
  otherUserId: string;
  otherUserName: string;
}

const NegotiationDialog = ({
  open,
  onOpenChange,
  matchId,
  otherUserId,
  otherUserName,
}: NegotiationDialogProps) => {
  const { user } = useAuth();
  const { offers, createOffer, respondToOffer, loading: offersLoading } = useTradeOffers(matchId);
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [additionalOffered, setAdditionalOffered] = useState(0);
  const [additionalRequested, setAdditionalRequested] = useState(0);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<"create" | "history">("create");

  useEffect(() => {
    if (open && user) {
      fetchMyProducts();
    }
  }, [open, user]);

  const fetchMyProducts = async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("products")
      .select("id, title, images, estimated_value")
      .eq("user_id", user.id)
      .eq("status", "active");

    if (!error && data) {
      setMyProducts(data);
    }
    setLoading(false);
  };

  const toggleProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSendOffer = async () => {
    if (!user || selectedProducts.length === 0) return;

    setSending(true);

    await createOffer({
      matchId,
      receiverId: otherUserId,
      proposedProducts: selectedProducts,
      additionalValueOffered: additionalOffered,
      additionalValueRequested: additionalRequested,
      message,
    });

    setSelectedProducts([]);
    setAdditionalOffered(0);
    setAdditionalRequested(0);
    setMessage("");
    setSending(false);
    setActiveTab("history");
  };

  const handleRespondOffer = async (
    offerId: string,
    response: "accepted" | "rejected"
  ) => {
    await respondToOffer(offerId, response);
    if (response === "accepted") {
      onOpenChange(false);
    }
  };

  const totalValue = myProducts
    .filter((p) => selectedProducts.includes(p.id))
    .reduce((sum, p) => sum + p.estimated_value, 0);

  const pendingOffers = offers.filter(
    (o) => o.status === "pending" && o.receiver_id === user?.id
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-primary" />
            Negociar con {otherUserName}
          </DialogTitle>
          <DialogDescription>
            Crea ofertas o responde a propuestas existentes
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border pb-2">
          <Button
            variant={activeTab === "create" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("create")}
          >
            Nueva Oferta
          </Button>
          <Button
            variant={activeTab === "history" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("history")}
            className="relative"
          >
            Historial
            {pendingOffers.length > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center">
                {pendingOffers.length}
              </Badge>
            )}
          </Button>
        </div>

        {activeTab === "create" ? (
          <div className="space-y-4">
            {/* My products */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                Selecciona productos a ofrecer:
              </p>

              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : myProducts.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No tienes productos publicados</p>
                </div>
              ) : (
                <ScrollArea className="h-[150px] rounded-lg border border-border">
                  <div className="p-2 space-y-2">
                    {myProducts.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => toggleProduct(product.id)}
                        className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all ${
                          selectedProducts.includes(product.id)
                            ? "bg-primary/10 border-2 border-primary"
                            : "bg-muted/30 border-2 border-transparent hover:bg-muted/50"
                        }`}
                      >
                        <div className="relative">
                          <img
                            src={product.images[0] || "/placeholder.svg"}
                            alt={product.title}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                          {selectedProducts.includes(product.id) && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                              <Check className="h-2.5 w-2.5 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {product.title}
                          </p>
                          <p className="text-xs text-trueke-green font-semibold">
                            {formatCurrency(product.estimated_value)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Additional value inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Yo añado ($)
                </label>
                <Input
                  type="number"
                  min={0}
                  value={additionalOffered}
                  onChange={(e) => setAdditionalOffered(Number(e.target.value))}
                  placeholder="0"
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Solicito ($)
                </label>
                <Input
                  type="number"
                  min={0}
                  value={additionalRequested}
                  onChange={(e) => setAdditionalRequested(Number(e.target.value))}
                  placeholder="0"
                  className="h-9"
                />
              </div>
            </div>

            {/* Summary */}
            {selectedProducts.length > 0 && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/30">
                <span className="text-sm text-foreground">
                  {selectedProducts.length} producto(s)
                </span>
                <span className="text-sm font-semibold text-trueke-green">
                  Total: {formatCurrency(totalValue + additionalOffered)}
                </span>
              </div>
            )}

            {/* Message */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                Mensaje (opcional)
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Agrega detalles sobre tu propuesta..."
                className="resize-none"
                rows={2}
              />
            </div>

            {/* Actions */}
            <Button
              className="w-full gradient-brand"
              onClick={handleSendOffer}
              disabled={selectedProducts.length === 0 || sending}
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Enviar Oferta
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {offersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : offers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <RefreshCw className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay ofertas todavía</p>
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-3 pr-4">
                  {offers.map((offer) => {
                    const isMyOffer = offer.sender_id === user?.id;
                    const isPending = offer.status === "pending";

                    return (
                      <div
                        key={offer.id}
                        className={`p-3 rounded-xl border ${
                          isPending && !isMyOffer
                            ? "border-primary bg-primary/5"
                            : "border-border bg-card"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge
                            variant={isMyOffer ? "secondary" : "default"}
                          >
                            {isMyOffer ? "Tu oferta" : "Propuesta recibida"}
                          </Badge>
                          <Badge
                            variant={
                              offer.status === "accepted"
                                ? "default"
                                : offer.status === "rejected"
                                ? "destructive"
                                : "secondary"
                            }
                            className={
                              offer.status === "accepted"
                                ? "bg-trueke-green"
                                : ""
                            }
                          >
                            {offer.status === "pending"
                              ? "Pendiente"
                              : offer.status === "accepted"
                              ? "Aceptada"
                              : offer.status === "rejected"
                              ? "Rechazada"
                              : offer.status}
                          </Badge>
                        </div>

                        <div className="text-sm space-y-1 mb-2">
                          <p className="text-muted-foreground">
                            {offer.proposed_products.length} producto(s)
                          </p>
                          {offer.additional_value_offered > 0 && (
                            <p className="text-trueke-green">
                              +{formatCurrency(offer.additional_value_offered)} añadido
                            </p>
                          )}
                          {offer.additional_value_requested > 0 && (
                            <p className="text-trueke-orange">
                              Solicita +{formatCurrency(offer.additional_value_requested)}
                            </p>
                          )}
                          {offer.message && (
                            <p className="text-foreground italic">
                              "{offer.message}"
                            </p>
                          )}
                        </div>

                        {isPending && !isMyOffer && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1 bg-trueke-green hover:bg-trueke-green/90"
                              onClick={() =>
                                handleRespondOffer(offer.id, "accepted")
                              }
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Aceptar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() =>
                                handleRespondOffer(offer.id, "rejected")
                              }
                            >
                              <X className="h-4 w-4 mr-1" />
                              Rechazar
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NegotiationDialog;
