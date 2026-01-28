import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import logoHorizontal from "@/assets/trueke-logo-horizontal.png";
import { Loader2, Sparkles, UserCircle, Building2, ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const Auth = () => {
  const location = useLocation();
  const locationState = location.state as { userType?: "person" | "company"; isNewUser?: boolean } | null;
  const [selectedUserType, setSelectedUserType] = useState<"person" | "company">(locationState?.userType || "person");
  const isNewUser = locationState?.isNewUser !== false;
  
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerName, setRegisterName] = useState("");

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const { error } = await signInWithGoogle();
    
    if (error) {
      toast({
        variant: "destructive",
        title: "Error con Google",
        description: error.message,
      });
      setIsGoogleLoading(false);
    }
    // Don't set loading to false on success - redirect will happen
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      toast({
        title: "Correo enviado",
        description: "Revisa tu bandeja de entrada para restablecer tu contraseña.",
      });
      setResetDialogOpen(false);
      setResetEmail("");
    }

    setIsResetLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(loginEmail, loginPassword);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error al iniciar sesión",
        description: error.message,
      });
    } else {
      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión correctamente.",
      });
      navigate("/");
    }

    setIsLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error, user: newUser } = await signUp(registerEmail, registerPassword, registerName);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error al registrarse",
        description: error.message,
      });
    } else {
      // Update user type in profile after registration
      if (newUser?.id) {
        await supabase
          .from("profiles")
          .update({ user_type: selectedUserType })
          .eq("user_id", newUser.id);
      }
      
      toast({
        title: "¡Cuenta creada!",
        description: `Tu cuenta de ${selectedUserType === "company" ? "empresa" : "persona"} ha sido creada exitosamente.`,
      });
      navigate("/");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-trueke-orange/5 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-trueke-orange/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 rounded-full bg-trueke-pink/10 blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-32 h-32 rounded-full bg-trueke-cyan/5 blur-2xl" />
      </div>

      {/* Back button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 left-4 z-20"
        onClick={() => navigate("/welcome")}
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="border-border/50 shadow-2xl backdrop-blur-sm bg-card/95">
          <CardHeader className="text-center pb-4">
            <motion.div 
              className="flex flex-col items-center gap-3 mb-2"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              {/* Logo container */}
              <div className="relative">
                <img 
                  src={logoHorizontal} 
                  alt="Trueke" 
                  className="relative h-16 object-contain"
                />
              </div>
            </motion.div>

            {/* User Type Toggle - Visible at the top */}
            <div className="flex justify-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => setSelectedUserType("person")}
                disabled={isLoading || isGoogleLoading}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${
                  selectedUserType === "person"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <UserCircle className="h-4 w-4" />
                Persona
              </button>
              <button
                type="button"
                onClick={() => setSelectedUserType("company")}
                disabled={isLoading || isGoogleLoading}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${
                  selectedUserType === "company"
                    ? "bg-secondary text-secondary-foreground shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <Building2 className="h-4 w-4" />
                Empresa
              </button>
            </div>

            <CardDescription className="flex items-center justify-center gap-2 text-muted-foreground mt-3">
              <Sparkles className="h-4 w-4 text-trueke-yellow" />
              {selectedUserType === "company" ? "Registra tu empresa" : "Crea tu cuenta personal"}
              <Sparkles className="h-4 w-4 text-trueke-yellow" />
            </CardDescription>
          </CardHeader>
        <CardContent>
          {/* Google Sign In Button */}
          <Button
            variant="outline"
            className="w-full h-12 gap-3 mb-4"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isLoading}
          >
            {isGoogleLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            Continuar con Google
          </Button>

          <div className="relative my-4">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
              o
            </span>
          </div>

          <Tabs defaultValue={isNewUser ? "register" : "login"} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="register">Registrarse</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="tu@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    disabled={isLoading || isGoogleLoading}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Contraseña</Label>
                    <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="link" className="px-0 h-auto text-xs text-muted-foreground">
                          ¿Olvidaste tu contraseña?
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Recuperar contraseña</DialogTitle>
                          <DialogDescription>
                            Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handlePasswordReset} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="reset-email">Email</Label>
                            <Input
                              id="reset-email"
                              type="email"
                              placeholder="tu@email.com"
                              value={resetEmail}
                              onChange={(e) => setResetEmail(e.target.value)}
                              required
                              disabled={isResetLoading}
                            />
                          </div>
                          <Button type="submit" className="w-full gradient-brand" disabled={isResetLoading}>
                            {isResetLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Enviando...
                              </>
                            ) : (
                              "Enviar enlace"
                            )}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    disabled={isLoading || isGoogleLoading}
                  />
                </div>
                <Button type="submit" className="w-full gradient-brand" disabled={isLoading || isGoogleLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cargando...
                    </>
                  ) : (
                    "Iniciar Sesión"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">
                    {selectedUserType === "company" ? "Nombre de empresa" : "Tu nombre"}
                  </Label>
                  <Input
                    id="register-name"
                    type="text"
                    placeholder={selectedUserType === "company" ? "Ej: Mi Empresa S.A." : "Ej: María González"}
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    required
                    disabled={isLoading || isGoogleLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">
                    {selectedUserType === "company" ? "Email corporativo" : "Email"}
                  </Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder={selectedUserType === "company" ? "contacto@empresa.com" : "tu@email.com"}
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                    disabled={isLoading || isGoogleLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Contraseña</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="••••••••"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={isLoading || isGoogleLoading}
                  />
                </div>

                <Button type="submit" className="w-full gradient-brand" disabled={isLoading || isGoogleLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cargando...
                    </>
                  ) : (
                    `Crear Cuenta ${selectedUserType === "company" ? "Empresa" : "Personal"}`
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
          <CardFooter className="text-center text-sm text-muted-foreground pt-4">
            Al registrarte, aceptas nuestros términos y condiciones
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default Auth;
