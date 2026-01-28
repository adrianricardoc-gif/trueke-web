import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Package, Check, Loader2, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Product {
  id: string;
  title: string;
  images: string[];
  estimated_value: number;
}

interface TradeOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetProduct: Product | null;
  targetUserId: string | null;
}

const TradeOfferDialog = ({ open, onOpenChange, targetProduct, targetUserId }: TradeOfferDialogProps) => {
  const { user } = useAuth();
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

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
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSendOffer = async () => {
    if (!user || !targetProduct || !targetUserId || selectedProducts.length === 0) return;
    
    setSending(true);
    
    try {
      // Insert the trade offer with all selected products
      const { error: offerError } = await supabase.from("trade_offers").insert({
        sender_id: user.id,
        receiver_id: targetUserId,
        proposed_products: selectedProducts,
        message: message.trim() || null,
        status: "pending",
      });

      if (offerError) throw offerError;

      // Also create swipes for match detection
      for (const productId of selectedProducts) {
        await supabase.from("swipes").insert({
          user_id: user.id,
          product_id: targetProduct.id,
          offered_product_id: productId,
          action: "like",
        });
      }
      
      toast({
        title: "¡Propuesta enviada!",
        description: `Tu oferta de ${selectedProducts.length} producto(s) ha sido enviada. Te notificaremos cuando respondan.`,
      });
      
      setSelectedProducts([]);
      setMessage("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error sending trade offer:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar la propuesta. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const totalValue = myProducts
    .filter(p => selectedProducts.includes(p.id))
    .reduce((sum, p) => sum + p.estimated_value, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Proponer Trueke
          </DialogTitle>
          <DialogDescription>
            Selecciona los productos que quieres ofrecer a cambio
          </DialogDescription>
        </DialogHeader>

        {/* Target product */}
        {targetProduct && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border">
            <img
              src={targetProduct.images[0] || "/placeholder.svg"}
              alt={targetProduct.title}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{targetProduct.title}</p>
              <p className="text-sm text-trueke-green font-semibold">
                {formatCurrency(targetProduct.estimated_value)}
              </p>
            </div>
            <div className="text-muted-foreground">
              <ArrowRight className="h-5 w-5" />
            </div>
          </div>
        )}

        {/* My products */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Mis productos disponibles:</p>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : myProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No tienes productos publicados</p>
            </div>
          ) : (
            <ScrollArea className="h-[200px] rounded-lg border border-border">
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
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      {selectedProducts.includes(product.id) && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{product.title}</p>
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

        {/* Selected summary */}
        {selectedProducts.length > 0 && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/30">
            <span className="text-sm text-foreground">
              {selectedProducts.length} producto(s) seleccionado(s)
            </span>
            <span className="text-sm font-semibold text-trueke-green">
              Total: {formatCurrency(totalValue)}
            </span>
          </div>
        )}

        {/* Message */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Mensaje (opcional):</p>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="¡Hola! Me interesa hacer trueke contigo..."
            className="resize-none"
            rows={2}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 gradient-brand"
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
                <Package className="h-4 w-4 mr-2" />
                Enviar Oferta
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TradeOfferDialog;
