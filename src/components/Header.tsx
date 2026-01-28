import { useNavigate } from "react-router-dom";
import logoHorizontal from "@/assets/trueke-logo-horizontal.png";
import { Bell, User, Plus, LogOut, Package, Bookmark, Trophy, Shield, Target, Award, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const Header = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminRole();
  const { unreadCount } = useUnreadMessages();

  const getInitials = () => {
    if (!user?.email) return "U";
    return user.email.charAt(0).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center cursor-pointer" onClick={() => navigate("/")}>
          <img src={logoHorizontal} alt="Trueke" className="h-10 object-contain" />
        </div>
        
        <nav className="hidden md:flex items-center gap-6">
          <button 
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            Explorar
          </button>
          <button 
            onClick={() => navigate("/my-truekes")}
            className="text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            Mis Truekes
          </button>
          <button 
            onClick={() => navigate("/favorites")}
            className="text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            Favoritos
          </button>
          <button 
            onClick={() => navigate("/messages")}
            className="text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            Mensajes
          </button>
        </nav>
        
        <div className="flex items-center gap-2">
          <Button 
            size="icon" 
            variant="ghost" 
            className="relative"
            onClick={() => navigate("/messages")}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem 
                className="flex items-center gap-2"
                onClick={() => navigate("/profile")}
              >
                <User className="h-4 w-4" />
                Mi Perfil
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="flex items-center gap-2"
                onClick={() => navigate("/my-products")}
              >
                <Package className="h-4 w-4" />
                Mis Productos
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="flex items-center gap-2"
                onClick={() => navigate("/favorites")}
              >
                <Bookmark className="h-4 w-4" />
                Favoritos
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="flex items-center gap-2"
                onClick={() => navigate("/trade-history")}
              >
                <Trophy className="h-4 w-4" />
                Historial
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">Gamificación</DropdownMenuLabel>
              <DropdownMenuItem 
                className="flex items-center gap-2"
                onClick={() => navigate("/missions")}
              >
                <Target className="h-4 w-4" />
                Misiones
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="flex items-center gap-2"
                onClick={() => navigate("/achievements")}
              >
                <Award className="h-4 w-4" />
                Logros
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="flex items-center gap-2"
                onClick={() => navigate("/tournaments")}
              >
                <Swords className="h-4 w-4" />
                Torneos
              </DropdownMenuItem>
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="flex items-center gap-2"
                    onClick={() => navigate("/admin")}
                  >
                    <Shield className="h-4 w-4" />
                    Panel Admin
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="flex items-center gap-2 text-destructive"
                onClick={() => signOut()}
              >
                <LogOut className="h-4 w-4" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button 
            className="gradient-brand text-primary-foreground gap-2 font-semibold shadow-lg hover:opacity-90 transition-opacity"
            onClick={() => navigate("/new-product")}
          >
            <Plus className="h-4 w-4" />
            Publicar
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
