import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Search, KeyRound, Shield, ShieldOff, UserCog, Mail, Calendar, MapPin, MoreHorizontal, Loader2, Users, ShieldCheck, Ban, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  location: string | null;
  user_type: string;
  is_verified: boolean;
  created_at: string;
  email?: string;
}

interface UserRole {
  user_id: string;
  role: string;
}

// Super admin email - this user cannot be removed as admin
const SUPER_ADMIN_EMAIL = "adrian@genial.com.ec";

export const AdminUsersManager = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [userEmails, setUserEmails] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchUserRoles();
    fetchUserEmails();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserEmails = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await supabase.functions.invoke('list-users-admin', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) throw response.error;
      setUserEmails(response.data?.userEmails || {});
    } catch (error) {
      console.error("Error fetching user emails:", error);
    }
  };

  const fetchUserRoles = async () => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (error) throw error;
      setUserRoles(data || []);
    } catch (error) {
      console.error("Error fetching user roles:", error);
    }
  };

  const getUserRole = (userId: string): string | null => {
    const role = userRoles.find(r => r.user_id === userId);
    return role?.role || null;
  };

  const handleResetPassword = async () => {
    if (!resetEmail) {
      toast({
        title: "Error",
        description: "Ingresa el email del usuario",
        variant: "destructive",
      });
      return;
    }

    setIsResetting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Correo enviado",
        description: "Se ha enviado un correo de restablecimiento de contraseña",
      });
      setIsResetDialogOpen(false);
      setResetEmail("");
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el correo",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleToggleAdmin = async (userId: string, currentRole: string | null, userEmail?: string) => {
    // Prevent removing super admin
    if (currentRole === "admin" && userEmail === SUPER_ADMIN_EMAIL) {
      toast({
        title: "Acción no permitida",
        description: "No se puede remover el rol de administrador al super admin",
        variant: "destructive",
      });
      setIsRoleDialogOpen(false);
      return;
    }

    setIsUpdatingRole(true);
    try {
      if (currentRole === "admin") {
        // Remove admin role
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", "admin");

        if (error) throw error;

        toast({
          title: "Rol actualizado",
          description: "Se ha removido el rol de administrador",
        });
      } else {
        // Add admin role
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: "admin" });

        if (error) throw error;

        toast({
          title: "Rol actualizado",
          description: "Se ha asignado el rol de administrador",
        });
      }

      await fetchUserRoles();
      setIsRoleDialogOpen(false);
    } catch (error: any) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el rol",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleToggleVerification = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          is_verified: !currentStatus,
          verified_at: !currentStatus ? new Date().toISOString() : null
        })
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "Estado actualizado",
        description: !currentStatus 
          ? "Usuario verificado correctamente" 
          : "Se ha removido la verificación",
      });

      await fetchUsers();
    } catch (error: any) {
      console.error("Error updating verification:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el estado",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.map(user => ({
    ...user,
    email: userEmails[user.user_id] || undefined
  })).filter(user => {
    const userEmail = userEmails[user.user_id] || "";
    const matchesSearch = 
      (user.display_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      user.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.location?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "all" || user.user_type === filterType;
    
    return matchesSearch && matchesType;
  });

  const stats = {
    total: users.length,
    verified: users.filter(u => u.is_verified).length,
    admins: userRoles.filter(r => r.role === "admin").length,
    companies: users.filter(u => u.user_type === "company").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-sm text-muted-foreground">Total usuarios</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{stats.verified}</div>
                <p className="text-sm text-muted-foreground">Verificados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{stats.admins}</div>
                <p className="text-sm text-muted-foreground">Administradores</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{stats.companies}</div>
                <p className="text-sm text-muted-foreground">Empresas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Gestión de Usuarios</CardTitle>
              <CardDescription>Administra usuarios, roles y permisos</CardDescription>
            </div>
            <div className="flex gap-2">
              <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <KeyRound className="h-4 w-4" />
                    Resetear Contraseña
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Resetear Contraseña</DialogTitle>
                    <DialogDescription>
                      Ingresa el email del usuario para enviar un correo de restablecimiento de contraseña.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Input
                      type="email"
                      placeholder="usuario@ejemplo.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsResetDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleResetPassword} disabled={isResetting}>
                      {isResetting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4 mr-2" />
                          Enviar Correo
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button variant="outline" onClick={() => { fetchUsers(); fetchUserRoles(); }}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, ID o ubicación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tipo de usuario" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="person">Personas</SelectItem>
                <SelectItem value="company">Empresas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead className="hidden md:table-cell">Ubicación</TableHead>
                  <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden lg:table-cell">Registro</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No se encontraron usuarios
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => {
                    const userRole = getUserRole(user.user_id);
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-sm font-medium">
                                  {user.display_name?.charAt(0).toUpperCase() || "U"}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{user.display_name || "Sin nombre"}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                                {user.email || user.user_id.slice(0, 12) + "..."}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="text-sm">{user.location || "No especificada"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline" className="capitalize">
                            {user.user_type === "company" ? "Empresa" : "Persona"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {user.is_verified && (
                              <Badge className="bg-green-500 w-fit">Verificado</Badge>
                            )}
                            {userRole === "admin" && (
                              <Badge className="bg-purple-500 w-fit">Admin</Badge>
                            )}
                            {!user.is_verified && userRole !== "admin" && (
                              <Badge variant="outline" className="w-fit">Normal</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-1 text-muted-foreground text-sm">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(user.created_at), "dd MMM yyyy", { locale: es })}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => handleToggleVerification(user.user_id, user.is_verified)}
                              >
                                {user.is_verified ? (
                                  <>
                                    <ShieldOff className="h-4 w-4 mr-2" />
                                    Quitar verificación
                                  </>
                                ) : (
                                  <>
                                    <ShieldCheck className="h-4 w-4 mr-2" />
                                    Verificar usuario
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsRoleDialogOpen(true);
                                }}
                                disabled={userRole === "admin" && user.email === SUPER_ADMIN_EMAIL}
                              >
                                {userRole === "admin" ? (
                                  user.email === SUPER_ADMIN_EMAIL ? (
                                    <>
                                      <Shield className="h-4 w-4 mr-2 text-primary" />
                                      Super Admin
                                    </>
                                  ) : (
                                    <>
                                      <ShieldOff className="h-4 w-4 mr-2" />
                                      Quitar admin
                                    </>
                                  )
                                ) : (
                                  <>
                                    <Shield className="h-4 w-4 mr-2" />
                                    Hacer admin
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => {
                                  setResetEmail("");
                                  setSelectedUser(user);
                                  setIsResetDialogOpen(true);
                                }}
                              >
                                <KeyRound className="h-4 w-4 mr-2" />
                                Resetear contraseña
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Role Confirmation Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar cambio de rol</DialogTitle>
            <DialogDescription>
              {selectedUser && getUserRole(selectedUser.user_id) === "admin"
                ? `¿Estás seguro de quitar el rol de administrador a ${selectedUser.display_name || "este usuario"}?`
                : `¿Estás seguro de asignar el rol de administrador a ${selectedUser?.display_name || "este usuario"}?`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => selectedUser && handleToggleAdmin(selectedUser.user_id, getUserRole(selectedUser.user_id), selectedUser.email)}
              disabled={isUpdatingRole || (selectedUser?.email === SUPER_ADMIN_EMAIL && getUserRole(selectedUser?.user_id || "") === "admin")}
            >
              {isUpdatingRole ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Actualizando...
                </>
              ) : (
                "Confirmar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
