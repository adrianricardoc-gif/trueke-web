import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, Gavel, DollarSign, Clock, Trophy, Settings, Ban, Eye, RefreshCw, TrendingUp } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useToast } from "@/hooks/use-toast";

interface Auction {
  id: string;
  product_id: string;
  seller_id: string;
  starting_price: number;
  current_price: number;
  min_increment: number;
  ends_at: string;
  status: string;
  winner_id: string | null;
  created_at: string;
  product?: {
    title: string;
    images: string[];
  };
}

interface AuctionBid {
  id: string;
  auction_id: string;
  bidder_id: string;
  amount: number;
  is_winning: boolean;
  created_at: string;
}

export function AdminAuctionsManager() {
  const { isEnabled } = useFeatureFlags();
  const { toast } = useToast();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [auctionBids, setAuctionBids] = useState<AuctionBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [bidsLoading, setBidsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalAuctions: 0,
    activeAuctions: 0,
    totalBidsValue: 0,
    completedAuctions: 0,
    avgBidsPerAuction: 0,
  });

  const auctionsEnabled = isEnabled('trading_auctions');

  useEffect(() => {
    fetchAuctions();
  }, []);

  const fetchAuctions = async () => {
    try {
      const { data, error } = await supabase
        .from("auctions")
        .select(`
          *,
          product:products(title, images)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const auctionsData = data || [];
      setAuctions(auctionsData);

      // Calculate stats
      const activeAuctions = auctionsData.filter(
        (a) => a.status === "active" && new Date(a.ends_at) > new Date()
      );
      const completedAuctions = auctionsData.filter(
        (a) => a.status === "sold" || a.status === "ended"
      );
      const totalBidsValue = auctionsData.reduce((acc, a) => acc + a.current_price, 0);

      // Get bids count
      const { count } = await supabase
        .from("auction_bids")
        .select("*", { count: "exact", head: true });

      setStats({
        totalAuctions: auctionsData.length,
        activeAuctions: activeAuctions.length,
        totalBidsValue,
        completedAuctions: completedAuctions.length,
        avgBidsPerAuction: auctionsData.length > 0 ? (count || 0) / auctionsData.length : 0,
      });
    } catch (error) {
      console.error("Error fetching auctions:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuctionBids = async (auctionId: string) => {
    setBidsLoading(true);
    try {
      const { data, error } = await supabase
        .from("auction_bids")
        .select("*")
        .eq("auction_id", auctionId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAuctionBids(data || []);
    } catch (error) {
      console.error("Error fetching bids:", error);
    } finally {
      setBidsLoading(false);
    }
  };

  const cancelAuction = async (auctionId: string) => {
    try {
      const { error } = await supabase
        .from("auctions")
        .update({ status: "cancelled" })
        .eq("id", auctionId);

      if (error) throw error;

      toast({
        title: "Subasta cancelada",
        description: "La subasta ha sido cancelada exitosamente.",
      });

      await fetchAuctions();
    } catch (error) {
      console.error("Error cancelling auction:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cancelar la subasta.",
      });
    }
  };

  const endAuctionEarly = async (auctionId: string) => {
    try {
      const auction = auctions.find(a => a.id === auctionId);
      if (!auction) return;

      // Get winning bid
      const { data: winningBid } = await supabase
        .from("auction_bids")
        .select("*")
        .eq("auction_id", auctionId)
        .eq("is_winning", true)
        .single();

      const { error } = await supabase
        .from("auctions")
        .update({ 
          status: winningBid ? "sold" : "ended",
          winner_id: winningBid?.bidder_id || null,
          ends_at: new Date().toISOString()
        })
        .eq("id", auctionId);

      if (error) throw error;

      toast({
        title: "Subasta finalizada",
        description: winningBid 
          ? "La subasta ha sido adjudicada al mejor postor."
          : "La subasta ha sido finalizada sin ganador.",
      });

      await fetchAuctions();
    } catch (error) {
      console.error("Error ending auction:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo finalizar la subasta.",
      });
    }
  };

  const getStatusBadge = (auction: Auction) => {
    const now = new Date();
    const endsAt = new Date(auction.ends_at);

    if (auction.status === "cancelled") {
      return <Badge variant="destructive">Cancelada</Badge>;
    }
    if (auction.status === "sold") {
      return <Badge className="bg-emerald-500/90 hover:bg-emerald-500">Vendida</Badge>;
    }
    if (auction.status === "ended") {
      return <Badge variant="secondary">Terminada</Badge>;
    }
    if (endsAt < now) {
      return <Badge variant="secondary">Expirada</Badge>;
    }
    return <Badge variant="default">Activa</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Feature Status Banner */}
      {!auctionsEnabled && (
        <Card className="border-orange-500/50 bg-orange-500/10">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Ban className="h-5 w-5 text-orange-500" />
              <div>
                <p className="font-medium text-orange-700 dark:text-orange-300">
                  Subastas desactivadas
                </p>
                <p className="text-sm text-muted-foreground">
                  El sistema de subastas está desactivado. Actívalo en "Funcionalidades" para permitir a los usuarios crear subastas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subastas</CardTitle>
            <Gavel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAuctions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.activeAuctions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completadas</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedAuctions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalBidsValue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prom. Pujas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgBidsPerAuction.toFixed(1)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Auctions Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Gavel className="h-5 w-5" />
              Gestión de Subastas
            </CardTitle>
            <CardDescription>
              Administra todas las subastas del sistema
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchAuctions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">P. Inicial</TableHead>
                <TableHead className="text-right">P. Actual</TableHead>
                <TableHead>Termina</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Creada</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auctions.map((auction) => (
                <TableRow key={auction.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {auction.product?.images?.[0] && (
                        <img
                          src={auction.product.images[0]}
                          alt=""
                          className="h-8 w-8 rounded object-cover"
                        />
                      )}
                      <span className="font-medium truncate max-w-[150px]">
                        {auction.product?.title || "Producto eliminado"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    ${auction.starting_price.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    ${auction.current_price.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {new Date(auction.ends_at) > new Date() ? (
                      <span className="text-sm">
                        {formatDistanceToNow(new Date(auction.ends_at), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Terminada</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(auction)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(auction.created_at), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              setSelectedAuction(auction);
                              fetchAuctionBids(auction.id);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Detalles de la Subasta</DialogTitle>
                          </DialogHeader>
                          {selectedAuction && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-muted-foreground">Producto</Label>
                                  <p className="font-medium">{selectedAuction.product?.title}</p>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">Estado</Label>
                                  <div className="mt-1">{getStatusBadge(selectedAuction)}</div>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">Precio Inicial</Label>
                                  <p className="font-medium">${selectedAuction.starting_price.toFixed(2)}</p>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">Precio Actual</Label>
                                  <p className="font-bold text-lg">${selectedAuction.current_price.toFixed(2)}</p>
                                </div>
                              </div>

                              <div>
                                <Label className="text-muted-foreground mb-2 block">Historial de Pujas</Label>
                                {bidsLoading ? (
                                  <div className="flex justify-center py-4">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                  </div>
                                ) : auctionBids.length > 0 ? (
                                  <div className="max-h-60 overflow-y-auto border rounded-lg">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Postor</TableHead>
                                          <TableHead className="text-right">Monto</TableHead>
                                          <TableHead>Fecha</TableHead>
                                          <TableHead>Estado</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {auctionBids.map((bid) => (
                                          <TableRow key={bid.id}>
                                            <TableCell className="font-mono text-xs">
                                              {bid.bidder_id.substring(0, 8)}...
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                              ${bid.amount.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                              {format(new Date(bid.created_at), "dd/MM HH:mm")}
                                            </TableCell>
                                            <TableCell>
                                              {bid.is_winning && (
                                                <Badge variant="default" className="text-xs">Ganando</Badge>
                                              )}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground text-center py-4">
                                    No hay pujas registradas
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      {auction.status === "active" && new Date(auction.ends_at) > new Date() && (
                        <>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-orange-500">
                                <Clock className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Finalizar subasta anticipadamente</AlertDialogTitle>
                                <AlertDialogDescription>
                                  ¿Estás seguro de finalizar esta subasta antes de tiempo? 
                                  {auctionBids.length > 0 
                                    ? " Se adjudicará al mejor postor actual."
                                    : " No hay pujas, la subasta terminará sin ganador."}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => endAuctionEarly(auction.id)}>
                                  Finalizar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive">
                                <Ban className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cancelar subasta</AlertDialogTitle>
                                <AlertDialogDescription>
                                  ¿Estás seguro de cancelar esta subasta? Esta acción no se puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>No, mantener</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => cancelAuction(auction.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Sí, cancelar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {auctions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No hay subastas creadas aún
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
