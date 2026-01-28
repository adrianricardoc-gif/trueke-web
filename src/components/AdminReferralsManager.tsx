import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Gift, TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface ReferralCode {
  id: string;
  user_id: string;
  code: string;
  uses_count: number;
  max_uses: number | null;
  reward_trukoins: number;
  is_active: boolean;
  created_at: string;
}

interface ReferralUse {
  id: string;
  code_id: string;
  referred_user_id: string;
  referrer_user_id: string;
  trukoins_earned: number;
  created_at: string;
}

export function AdminReferralsManager() {
  const [codes, setCodes] = useState<ReferralCode[]>([]);
  const [uses, setUses] = useState<ReferralUse[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCodes: 0,
    totalReferrals: 0,
    totalTrukoinsAwarded: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all referral codes (admin can see all)
      const { data: codesData, error: codesError } = await supabase
        .from("referral_codes")
        .select("*")
        .order("uses_count", { ascending: false });

      if (codesError) throw codesError;

      // Fetch all referral uses
      const { data: usesData, error: usesError } = await supabase
        .from("referral_uses")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (usesError) throw usesError;

      setCodes(codesData || []);
      setUses(usesData || []);

      // Calculate stats
      const totalTrukoinsAwarded = (usesData || []).reduce(
        (acc, use) => acc + use.trukoins_earned,
        0
      );

      setStats({
        totalCodes: codesData?.length || 0,
        totalReferrals: usesData?.length || 0,
        totalTrukoinsAwarded,
      });
    } catch (error) {
      console.error("Error fetching referral data:", error);
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
            <CardTitle className="text-sm font-medium">Códigos Activos</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCodes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Referidos Totales</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReferrals}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TrueKoins Otorgados</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTrukoinsAwarded.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Top Referrers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Top Códigos de Referido
          </CardTitle>
          <CardDescription>
            Códigos con más usos en la plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Usuario ID</TableHead>
                <TableHead className="text-right">Usos</TableHead>
                <TableHead className="text-right">Máx. Usos</TableHead>
                <TableHead className="text-right">Recompensa</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Creado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {codes.slice(0, 20).map((code) => (
                <TableRow key={code.id}>
                  <TableCell className="font-mono font-bold">{code.code}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {code.user_id.substring(0, 8)}...
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={code.uses_count > 0 ? "default" : "secondary"}>
                      {code.uses_count}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {code.max_uses || "∞"}
                  </TableCell>
                  <TableCell className="text-right">
                    {code.reward_trukoins} TK
                  </TableCell>
                  <TableCell>
                    <Badge variant={code.is_active ? "default" : "destructive"}>
                      {code.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(code.created_at), "dd/MM/yyyy")}
                  </TableCell>
                </TableRow>
              ))}
              {codes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No hay códigos de referido creados aún
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Referrals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Referidos Recientes
          </CardTitle>
          <CardDescription>
            Últimos usuarios referidos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referido</TableHead>
                <TableHead>Referidor</TableHead>
                <TableHead className="text-right">TrueKoins</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {uses.slice(0, 20).map((use) => (
                <TableRow key={use.id}>
                  <TableCell className="font-mono text-xs">
                    {use.referred_user_id.substring(0, 8)}...
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {use.referrer_user_id.substring(0, 8)}...
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline">{use.trukoins_earned} TK</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(use.created_at), "dd/MM/yyyy HH:mm")}
                  </TableCell>
                </TableRow>
              ))}
              {uses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No hay referidos registrados aún
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
