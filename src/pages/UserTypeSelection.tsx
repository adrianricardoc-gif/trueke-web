import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { UserCircle, Building2, ArrowRight, Sparkles, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import isotipo from "@/assets/trueke-isotipo-clean.png";
import ThemeSelector from "@/components/ThemeSelector";

const UserTypeSelection = () => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<"person" | "company" | null>(null);

  const handleContinue = () => {
    if (selectedType) {
      navigate("/auth", { state: { userType: selectedType, isNewUser: true } });
    }
  };

  const handleDirectLogin = () => {
    navigate("/auth", { state: { isNewUser: false } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-trueke-orange/5 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Theme Toggle - Top Right */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeSelector variant="compact" />
      </div>

      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-trueke-orange/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 rounded-full bg-trueke-pink/10 blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-32 h-32 rounded-full bg-trueke-cyan/5 blur-2xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <motion.div 
          className="flex flex-col items-center gap-4 mb-8"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-trueke-orange to-trueke-pink rounded-3xl blur-xl opacity-50" />
            <img 
              src={isotipo} 
              alt="Trueke" 
              className="relative h-24 w-24 rounded-2xl object-cover shadow-lg"
            />
          </div>
          <p className="text-muted-foreground text-center flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-trueke-yellow" />
            Intercambia lo que tienes por lo que necesitas
            <Sparkles className="h-4 w-4 text-trueke-yellow" />
          </p>
        </motion.div>

        {/* Selection Cards */}
        <div className="space-y-4 mb-8">
          <motion.p 
            className="text-center text-lg font-medium text-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            ¿Cómo deseas usar Trueke?
          </motion.p>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card 
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                selectedType === "person" 
                  ? "border-2 border-primary bg-primary/5 shadow-lg" 
                  : "border-border hover:border-primary/50"
              }`}
              onClick={() => setSelectedType("person")}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-2xl transition-colors ${
                    selectedType === "person" 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  }`}>
                    <UserCircle className="h-10 w-10" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-foreground mb-1">
                      Persona
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Intercambia productos, objetos y artículos personales con otros usuarios
                    </p>
                  </div>
                  {selectedType === "person" && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                    >
                      <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card 
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                selectedType === "company" 
                  ? "border-2 border-secondary bg-secondary/5 shadow-lg" 
                  : "border-border hover:border-secondary/50"
              }`}
              onClick={() => setSelectedType("company")}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-2xl transition-colors ${
                    selectedType === "company" 
                      ? "bg-secondary text-secondary-foreground" 
                      : "bg-muted text-muted-foreground"
                  }`}>
                    <Building2 className="h-10 w-10" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-foreground mb-1">
                      Empresa
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Ofrece servicios profesionales e intercambia con clientes y otros negocios
                    </p>
                  </div>
                  {selectedType === "company" && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center"
                    >
                      <div className="w-2 h-2 rounded-full bg-secondary-foreground" />
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            onClick={handleContinue}
            disabled={!selectedType}
            className="w-full h-14 text-lg font-semibold gradient-brand gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continuar
            <ArrowRight className="h-5 w-5" />
          </Button>
        </motion.div>

        {/* Info text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center text-xs text-muted-foreground mt-6"
        >
          Podrás cambiar esto más tarde en tu perfil
        </motion.p>

        {/* Terms link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.75 }}
          className="text-center text-xs text-muted-foreground mt-2"
        >
          Al continuar, aceptas nuestros{" "}
          <button 
            onClick={() => navigate("/terms")}
            className="text-primary hover:underline"
          >
            Términos y Condiciones
          </button>
        </motion.p>

        {/* Direct Login Link for existing users */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8 pt-6 border-t border-border"
        >
          <p className="text-center text-sm text-muted-foreground mb-3">
            ¿Ya tienes una cuenta?
          </p>
          <Button
            variant="outline"
            onClick={handleDirectLogin}
            className="w-full h-12 gap-2"
          >
            <LogIn className="h-5 w-5" />
            Iniciar sesión directamente
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default UserTypeSelection;
