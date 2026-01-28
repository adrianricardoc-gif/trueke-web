import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Coins, TrendingUp, Users } from "lucide-react";
import { format } from "date-fns";

interface WalletWithProfile {
  id: string;
  user_id: string;
  balance: number;
  lifetime_earned: number;
  created_at: string;
}

export function AdminTrukoinsManager() {
  const [wallets, setWallets] = useState<WalletWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalWallets: 0,
    totalCirculating: 0,
    totalEverEarned: 0,
  });

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    try {
      const { data, error } = await supabase
        .from("trukoin_wallets")
        .select("*")
        .order("balance", { ascending: false });

      if (error) throw error;

      const walletsData = data || [];
      setWallets(walletsData);

      // Calculate stats
      const totalCirculating = walletsData.reduce((acc, w) => acc + w.balance, 0);
      const totalEverEarned = walletsData.reduce((acc, w) => acc + w.lifetime_earned, 0);

      setStats({
        totalWallets: walletsData.length,
        totalCirculating,
        totalEverEarned,
      });
    } catch (error) {
      console.error("Error fetching wallets:", error);
    } finally {
      setLoading(false);
    }
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
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Billeteras Activas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWallets}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TrueKoins en Circulación</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCirculating.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Generados</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEverEarned.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Wallets Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Billeteras de TrueKoins
          </CardTitle>
          <CardDescription>
            Gestión de la moneda virtual del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario ID</TableHead>
                <TableHead className="text-right">Balance Actual</TableHead>
                <TableHead className="text-right">Total Ganado</TableHead>
                <TableHead className="text-right">Gastado</TableHead>
                <TableHead>Creada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wallets.map((wallet) => (
                <TableRow key={wallet.id}>
                  <TableCell className="font-mono text-xs">
                    {wallet.user_id.substring(0, 8)}...
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={wallet.balance > 0 ? "default" : "secondary"}>
                      {wallet.balance.toLocaleString()} TK
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {wallet.lifetime_earned.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {(wallet.lifetime_earned - wallet.balance).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(wallet.created_at), "dd/MM/yyyy")}
                  </TableCell>
                </TableRow>
              ))}
              {wallets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No hay billeteras creadas aún
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
