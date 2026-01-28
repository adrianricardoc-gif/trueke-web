import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, AlertTriangle, CheckCircle, XCircle, Clock, Eye, FileText, User, Crown, BarChart3, Tag, Key, Coins, Gift, Gavel, Zap, Target, Trophy, Swords, Users, ScrollText, Timer, Settings, ImageIcon, Star, Gamepad2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useAdminData } from "@/hooks/useAdminData";
import AdminPlanManager from "@/components/AdminPlanManager";
import AdminStatsDashboard from "@/components/AdminStatsDashboard";
import AdminDiscountManager from "@/components/AdminDiscountManager";
import { AdminAPIKeysManager } from "@/components/AdminAPIKeysManager";
import { AdminTrukoinsManager } from "@/components/AdminTrukoinsManager";
import { AdminReferralsManager } from "@/components/AdminReferralsManager";
import { AdminAuctionsManager } from "@/components/AdminAuctionsManager";
import { AdminFeatureFlagsManager } from "@/components/AdminFeatureFlagsManager";
import { AdminMissionsManager } from "@/components/AdminMissionsManager";
import { AdminAchievementsManager } from "@/components/AdminAchievementsManager";
import { AdminTournamentsManager } from "@/components/AdminTournamentsManager";
import { AdminUsersManager } from "@/components/AdminUsersManager";
import AdminTermsManager from "@/components/AdminTermsManager";
import { AdminProductExpiryManager } from "@/components/AdminProductExpiryManager";
import { AdminSystemConfig } from "@/components/AdminSystemConfig";
import { AdminImageCompressionManager } from "@/components/AdminImageCompressionManager";
import { AdminPremiumFeaturesManager } from "@/components/AdminPremiumFeaturesManager";
import { AdminGamificationFeaturesManager } from "@/components/AdminGamificationFeaturesManager";
import AdminFreeUserLimitsManager from "@/components/AdminFreeUserLimitsManager";
import { AdminEmailConfigManager } from "@/components/AdminEmailConfigManager";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const AdminPanel = () => {
  const navigate = useNavigate();
  const { 
    isAdmin, 
    verificationRequests, 
    reports, 
    loading, 
    updateVerificationStatus,
    updateReportStatus 
  } = useAdminData();
  
  const [selectedVerification, setSelectedVerification] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Shield className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Acceso Restringido</h1>
        <p className="text-muted-foreground mb-4">No tienes permisos de administrador</p>
        <Button onClick={() => navigate("/")}>Volver al inicio</Button>
      </div>
    );
  }

  const pendingVerifications = verificationRequests.filter(v => v.status === "pending");
  const pendingReports = reports.filter(r => r.status === "pending");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Pendiente</Badge>;
      case "approved":
      case "resolved":
        return <Badge className="bg-green-500 gap-1"><CheckCircle className="h-3 w-3" /> {status === "approved" ? "Aprobado" : "Resuelto"}</Badge>;
      case "rejected":
      case "dismissed":
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> {status === "rejected" ? "Rechazado" : "Desestimado"}</Badge>;
      case "reviewed":
        return <Badge variant="secondary" className="gap-1"><Eye className="h-3 w-3" /> Revisado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleApproveVerification = (id: string) => {
    updateVerificationStatus(id, "approved", adminNotes);
    setAdminNotes("");
    setSelectedVerification(null);
  };

  const handleRejectVerification = (id: string) => {
    updateVerificationStatus(id, "rejected", adminNotes);
    setAdminNotes("");
    setSelectedVerification(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Panel de Administración</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-orange-500">{pendingVerifications.length}</div>
              <p className="text-sm text-muted-foreground">Verificaciones pendientes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-red-500">{pendingReports.length}</div>
              <p className="text-sm text-muted-foreground">Reportes pendientes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-500">
                {verificationRequests.filter(v => v.status === "approved").length}
              </div>
              <p className="text-sm text-muted-foreground">Verificaciones aprobadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-500">
                {reports.filter(r => r.status === "resolved").length}
              </div>
              <p className="text-sm text-muted-foreground">Reportes resueltos</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="stats" className="space-y-4">
          <ScrollArea className="w-full">
            <TabsList className="inline-flex w-max gap-1 p-1">
              <TabsTrigger value="stats" className="gap-1 text-xs sm:text-sm">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Estadísticas</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-1 text-xs sm:text-sm">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Usuarios</span>
              </TabsTrigger>
              <TabsTrigger value="apikeys" className="gap-1 text-xs sm:text-sm">
                <Key className="h-4 w-4" />
                <span className="hidden sm:inline">API Keys</span>
              </TabsTrigger>
              <TabsTrigger value="verifications" className="gap-1 text-xs sm:text-sm">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Verificaciones</span>
                {pendingVerifications.length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-[10px]">
                    {pendingVerifications.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="reports" className="gap-1 text-xs sm:text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span className="hidden sm:inline">Reportes</span>
                {pendingReports.length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-[10px]">
                    {pendingReports.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="plans" className="gap-1 text-xs sm:text-sm">
                <Crown className="h-4 w-4" />
                <span className="hidden sm:inline">Planes</span>
              </TabsTrigger>
              <TabsTrigger value="premium" className="gap-1 text-xs sm:text-sm">
                <Star className="h-4 w-4" />
                <span className="hidden sm:inline">Premium</span>
              </TabsTrigger>
              <TabsTrigger value="discounts" className="gap-1 text-xs sm:text-sm">
                <Tag className="h-4 w-4" />
                <span className="hidden sm:inline">Descuentos</span>
              </TabsTrigger>
              <TabsTrigger value="trukoins" className="gap-1 text-xs sm:text-sm">
                <Coins className="h-4 w-4" />
                <span className="hidden sm:inline">TrueKoins</span>
              </TabsTrigger>
              <TabsTrigger value="referrals" className="gap-1 text-xs sm:text-sm">
                <Gift className="h-4 w-4" />
                <span className="hidden sm:inline">Referidos</span>
              </TabsTrigger>
              <TabsTrigger value="auctions" className="gap-1 text-xs sm:text-sm">
                <Gavel className="h-4 w-4" />
                <span className="hidden sm:inline">Subastas</span>
              </TabsTrigger>
              <TabsTrigger value="missions" className="gap-1 text-xs sm:text-sm">
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">Misiones</span>
              </TabsTrigger>
              <TabsTrigger value="achievements" className="gap-1 text-xs sm:text-sm">
                <Trophy className="h-4 w-4" />
                <span className="hidden sm:inline">Logros</span>
              </TabsTrigger>
              <TabsTrigger value="tournaments" className="gap-1 text-xs sm:text-sm">
                <Swords className="h-4 w-4" />
                <span className="hidden sm:inline">Torneos</span>
              </TabsTrigger>
              <TabsTrigger value="gamification" className="gap-1 text-xs sm:text-sm">
                <Gamepad2 className="h-4 w-4" />
                <span className="hidden sm:inline">Gamificación</span>
              </TabsTrigger>
              <TabsTrigger value="features" className="gap-1 text-xs sm:text-sm">
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Funcionalidades</span>
              </TabsTrigger>
              <TabsTrigger value="terms" className="gap-1 text-xs sm:text-sm">
                <ScrollText className="h-4 w-4" />
                <span className="hidden sm:inline">Términos</span>
              </TabsTrigger>
              <TabsTrigger value="expiry" className="gap-1 text-xs sm:text-sm">
                <Timer className="h-4 w-4" />
                <span className="hidden sm:inline">Caducidad</span>
              </TabsTrigger>
              <TabsTrigger value="compression" className="gap-1 text-xs sm:text-sm">
                <ImageIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Imágenes</span>
              </TabsTrigger>
              <TabsTrigger value="email" className="gap-1 text-xs sm:text-sm">
                <Mail className="h-4 w-4" />
                <span className="hidden sm:inline">Correo</span>
              </TabsTrigger>
              <TabsTrigger value="system" className="gap-1 text-xs sm:text-sm">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Sistema</span>
              </TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {/* Stats Tab */}
          <TabsContent value="stats">
            <AdminStatsDashboard />
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <AdminUsersManager />
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="apikeys">
            <AdminAPIKeysManager />
          </TabsContent>

          {/* Verifications Tab */}
          <TabsContent value="verifications" className="space-y-4">
            {verificationRequests.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay solicitudes de verificación</p>
                </CardContent>
              </Card>
            ) : (
              verificationRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-base">
                          Usuario: {request.user_id.slice(0, 8)}...
                        </CardTitle>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                    <CardDescription>
                      {format(new Date(request.created_at), "PPP 'a las' p", { locale: es })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <div className="cursor-pointer group">
                            <p className="text-sm text-muted-foreground mb-1">Documento</p>
                            <img 
                              src={request.document_url} 
                              alt="Documento" 
                              className="w-full h-32 object-cover rounded-lg border group-hover:border-primary transition-colors"
                            />
                          </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>Documento de identidad</DialogTitle>
                          </DialogHeader>
                          <img src={request.document_url} alt="Documento" className="w-full rounded-lg" />
                        </DialogContent>
                      </Dialog>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <div className="cursor-pointer group">
                            <p className="text-sm text-muted-foreground mb-1">Selfie</p>
                            <img 
                              src={request.selfie_url} 
                              alt="Selfie" 
                              className="w-full h-32 object-cover rounded-lg border group-hover:border-primary transition-colors"
                            />
                          </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>Selfie de verificación</DialogTitle>
                          </DialogHeader>
                          <img src={request.selfie_url} alt="Selfie" className="w-full rounded-lg" />
                        </DialogContent>
                      </Dialog>
                    </div>

                    {request.status === "pending" && (
                      <div className="space-y-3">
                        <Textarea
                          placeholder="Notas del administrador (opcional)"
                          value={selectedVerification === request.id ? adminNotes : ""}
                          onChange={(e) => {
                            setSelectedVerification(request.id);
                            setAdminNotes(e.target.value);
                          }}
                        />
                        <div className="flex gap-2">
                          <Button 
                            className="flex-1 gap-2" 
                            onClick={() => handleApproveVerification(request.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                            Aprobar
                          </Button>
                          <Button 
                            variant="destructive" 
                            className="flex-1 gap-2"
                            onClick={() => handleRejectVerification(request.id)}
                          >
                            <XCircle className="h-4 w-4" />
                            Rechazar
                          </Button>
                        </div>
                      </div>
                    )}

                    {request.admin_notes && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium">Notas:</p>
                        <p className="text-sm text-muted-foreground">{request.admin_notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            {reports.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay reportes</p>
                </CardContent>
              </Card>
            ) : (
              reports.map((report) => (
                <Card key={report.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base capitalize">
                        {report.report_type === "user" ? "Reporte de usuario" : "Reporte de producto"}
                      </CardTitle>
                      {getStatusBadge(report.status)}
                    </div>
                    <CardDescription>
                      {format(new Date(report.created_at), "PPP 'a las' p", { locale: es })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <div>
                        <span className="text-sm font-medium">Razón: </span>
                        <Badge variant="outline">{report.reason}</Badge>
                      </div>
                      {report.description && (
                        <p className="text-sm text-muted-foreground">{report.description}</p>
                      )}
                    </div>

                    {report.status === "pending" && (
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => updateReportStatus(report.id, "reviewed")}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Marcar revisado
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => updateReportStatus(report.id, "resolved")}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Resolver
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => updateReportStatus(report.id, "dismissed")}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Desestimar
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Plans Tab */}
          <TabsContent value="plans">
            <AdminPlanManager />
          </TabsContent>

          {/* Premium Features Tab */}
          <TabsContent value="premium" className="space-y-6">
            <AdminFreeUserLimitsManager />
            <AdminPremiumFeaturesManager />
          </TabsContent>

          {/* Discounts Tab */}
          <TabsContent value="discounts">
            <AdminDiscountManager />
          </TabsContent>

          {/* TrueKoins Tab */}
          <TabsContent value="trukoins">
            <AdminTrukoinsManager />
          </TabsContent>

          {/* Referrals Tab */}
          <TabsContent value="referrals">
            <AdminReferralsManager />
          </TabsContent>

          {/* Auctions Tab */}
          <TabsContent value="auctions">
            <AdminAuctionsManager />
          </TabsContent>

          {/* Feature Flags Tab */}
          <TabsContent value="features">
            <AdminFeatureFlagsManager />
          </TabsContent>

          {/* Missions Tab */}
          <TabsContent value="missions">
            <AdminMissionsManager />
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements">
            <AdminAchievementsManager />
          </TabsContent>

          {/* Tournaments Tab */}
          <TabsContent value="tournaments">
            <AdminTournamentsManager />
          </TabsContent>

          {/* Gamification Tab */}
          <TabsContent value="gamification">
            <AdminGamificationFeaturesManager />
          </TabsContent>

          {/* Terms Tab */}
          <TabsContent value="terms">
            <AdminTermsManager />
          </TabsContent>

          {/* Expiry Tab */}
          <TabsContent value="expiry">
            <AdminProductExpiryManager />
          </TabsContent>

          {/* Image Compression Tab */}
          <TabsContent value="compression">
            <AdminImageCompressionManager />
          </TabsContent>

          {/* Email Config Tab */}
          <TabsContent value="email">
            <AdminEmailConfigManager />
          </TabsContent>

          {/* System Config Tab */}
          <TabsContent value="system">
            <AdminSystemConfig />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminPanel;
