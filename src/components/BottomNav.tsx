import { useNavigate, useLocation } from "react-router-dom";
import { Home, Heart, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { motion } from "framer-motion";
import isotipo from "@/assets/trueke-isotipo-clean.png";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount } = useUnreadMessages();

  const navItems = [
    { icon: Home, label: "Inicio", path: "/" },
    { icon: Heart, label: "Truekes", path: "/my-truekes" },
    { type: "isotipo", label: "Publicar", path: "/new-product", tutorialId: "publish-button" },
    { icon: MessageCircle, label: "Mensajes", path: "/messages", badge: unreadCount, tutorialId: "messages-nav" },
    { icon: User, label: "Perfil", path: "/profile", tutorialId: "profile-nav" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border md:hidden safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-1 max-w-md mx-auto">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          const isIsotipo = 'type' in item && item.type === "isotipo";
          
          return (
            <motion.button
              key={index}
              onClick={() => navigate(item.path)}
              data-tutorial={'tutorialId' in item ? item.tutorialId : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 p-2 rounded-xl transition-all relative min-w-[56px]",
                isIsotipo && "relative -top-4"
              )}
              whileTap={{ scale: 0.9 }}
            >
              {isIsotipo ? (
                <motion.div 
                  className="relative flex flex-col items-center"
                  whileHover={{ scale: 1.05 }}
                  animate={{ 
                    y: [0, -2, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <img 
                    src={isotipo} 
                    alt="Publicar" 
                    className="h-12 w-12 rounded-2xl object-contain shadow-lg"
                  />
                  <span className="mt-0.5 text-[10px] font-semibold text-primary">
                    Publicar
                  </span>
                </motion.div>
              ) : (
                <>
                  <div className="relative">
                    {'icon' in item && item.icon && (
                      <item.icon className={cn(
                        "h-5 w-5 transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )} />
                    )}
                    {'badge' in item && typeof item.badge === 'number' && item.badge > 0 && (
                      <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2.5 min-w-[18px] h-[18px] flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full shadow-lg border-2 border-card"
                      >
                        {item.badge > 99 ? "99+" : item.badge}
                      </motion.span>
                    )}
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}>
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div 
                      className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary"
                      layoutId="activeTab"
                    />
                  )}
                </>
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
