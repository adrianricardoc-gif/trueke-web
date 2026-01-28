import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Shield,
  Bot,
  Lock,
  Settings,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Info,
  Globe,
  Key,
  Sparkles,
  ShieldCheck,
  Activity,
  Database,
  RefreshCw,
  Server,
  Fingerprint,
  Mail,
  BellRing,
  Clock,
  Trash2,
  Eye,
} from "lucide-react";
import { useAdminSettings } from "@/hooks/useAdminSettings";
import { useAdminFeatureFlags } from "@/hooks/useAdminFeatureFlags";
import { useToast } from "@/hooks/use-toast";

// Google SVG Icon
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5">
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

// Facebook SVG Icon
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

export function AdminSystemConfig() {
  const { toast } = useToast();
  const { settings, loading: settingsLoading, updateSetting, createSetting } = useAdminSettings();
  const { flags, toggleFeature, updating } = useAdminFeatureFlags();
  const [activeTab, setActiveTab] = useState("auth");

  const getSetting = (key: string) => settings.find(s => s.key === key);
  const getSettingValue = (key: string) => getSetting(key)?.value || "";

  const handleOpenCloudDashboard = () => {
    toast({
      title: "Abrir Lovable Cloud",
      description: "Accede al panel de Cloud para configurar proveedores OAuth.",
    });
  };

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Settings className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Configuración del Sistema</h2>
          <p className="text-muted-foreground">
            Gestiona autenticación, IA, seguridad y operatividad
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="auth" className="gap-1.5">
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">Auth</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-1.5">
            <Bot className="h-4 w-4" />
            <span className="hidden sm:inline">IA</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Seguridad</span>
          </TabsTrigger>
          <TabsTrigger value="operations" className="gap-1.5">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Operación</span>
          </TabsTrigger>
        </TabsList>

        {/* Authentication Tab */}
        <TabsContent value="auth" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Proveedores de Autenticación OAuth
              </CardTitle>
              <CardDescription>
                Configura proveedores de inicio de sesión social
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Configuración desde Lovable Cloud</AlertTitle>
                <AlertDescription>
                  Los proveedores OAuth se configuran desde el panel de Lovable Cloud en 
                  <strong> Users → Authentication Settings → Sign In Methods</strong>.
                </AlertDescription>
              </Alert>

              {/* Google OAuth */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-background border">
                    <GoogleIcon />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Google OAuth</span>
                      <Badge className="bg-emerald-500/90 hover:bg-emerald-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Soportado
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Permite inicio de sesión con cuentas de Google
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="gap-2" onClick={handleOpenCloudDashboard}>
                  <ExternalLink className="h-4 w-4" />
                  Configurar
                </Button>
              </div>

              {/* Facebook OAuth */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-background border">
                    <FacebookIcon />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Facebook OAuth</span>
                      <Badge variant="outline" className="text-warning border-warning">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        No soportado
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Actualmente no disponible en Lovable Cloud
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" disabled>
                  No disponible
                </Button>
              </div>

              <Separator />

              {/* Email Configuration */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Configuración de Email
                </h4>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <span className="font-medium">Auto-confirmar emails</span>
                      <p className="text-sm text-muted-foreground">
                        Los usuarios no necesitan verificar su email
                      </p>
                    </div>
                    <Badge className="bg-emerald-500">Activo</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <span className="font-medium">Recuperación de contraseña</span>
                      <p className="text-sm text-muted-foreground">
                        Envío de links de recuperación
                      </p>
                    </div>
                    <Badge className="bg-emerald-500">Activo</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Instrucciones de Configuración</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium">Para configurar Google OAuth:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Ve a <strong>Google Cloud Console</strong> y crea un proyecto</li>
                  <li>Configura la pantalla de consentimiento OAuth</li>
                  <li>Crea credenciales OAuth 2.0 (ID de cliente web)</li>
                  <li>Agrega las URLs de redirect autorizadas del proyecto</li>
                  <li>Copia el Client ID y Client Secret</li>
                  <li>Configura en Lovable Cloud → Authentication Settings</li>
                </ol>
              </div>
              
              <Button className="w-full gap-2">
                <ExternalLink className="h-4 w-4" />
                Abrir Lovable Cloud Dashboard
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Configuration Tab */}
        <TabsContent value="ai" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Configuración de IA - Lovable AI
              </CardTitle>
              <CardDescription>
                La app utiliza Lovable AI Gateway para funcionalidades de inteligencia artificial
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-emerald-500/10 border-emerald-500/30">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <AlertTitle className="text-emerald-500">Lovable AI Activo</AlertTitle>
                <AlertDescription>
                  El proyecto tiene acceso a Lovable AI sin necesidad de API keys adicionales.
                </AlertDescription>
              </Alert>

              <div className="grid gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Bot className="h-5 w-5 text-primary" />
                      <span className="font-medium">Modelos Disponibles</span>
                    </div>
                    <Badge>Activo</Badge>
                  </div>
                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <span>google/gemini-2.5-flash</span>
                      <Badge variant="outline" className="text-xs">Recomendado</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <span>google/gemini-2.5-pro</span>
                      <Badge variant="outline" className="text-xs">Premium</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <span>openai/gpt-5-mini</span>
                      <Badge variant="outline" className="text-xs">Alternativo</Badge>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">Funcionalidades de IA Activas</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm">Generación de descripciones</span>
                      </div>
                      <Badge variant="secondary">ai-product-assistant</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm">Sugerencia de precios</span>
                      </div>
                      <Badge variant="secondary">ai-product-assistant</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm">Análisis de imágenes</span>
                      </div>
                      <Badge variant="secondary">ai-product-assistant</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm">Traducción de mensajes</span>
                      </div>
                      <Badge variant="secondary">ai-product-assistant</Badge>
                    </div>
                  </div>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Rate Limits</AlertTitle>
                  <AlertDescription>
                    Lovable AI tiene límites de uso por minuto. Si los usuarios ven errores 429, 
                    pueden esperar unos segundos y reintentar.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>

          {/* External AI APIs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                APIs de IA Externas (Opcional)
              </CardTitle>
              <CardDescription>
                Configura claves de API para proveedores externos si necesitas más capacidad
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <span className="font-medium">OpenAI API Key</span>
                    <p className="text-sm text-muted-foreground">
                      Para uso directo de GPT (no requerido con Lovable AI)
                    </p>
                  </div>
                  <Badge variant="outline">Opcional</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <span className="font-medium">Anthropic API Key</span>
                    <p className="text-sm text-muted-foreground">
                      Para uso de Claude (no disponible vía gateway)
                    </p>
                  </div>
                  <Badge variant="outline">Opcional</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Seguridad de la Aplicación
              </CardTitle>
              <CardDescription>
                Configuraciones de seguridad y protección de datos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                {/* RLS Status */}
                <div className="flex items-center justify-between p-4 border rounded-lg bg-emerald-500/5 border-emerald-500/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-emerald-500/10">
                      <Database className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <span className="font-medium">Row Level Security (RLS)</span>
                      <p className="text-sm text-muted-foreground">
                        Políticas de seguridad a nivel de filas en todas las tablas
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Activo
                  </Badge>
                </div>

                {/* Auth Protection */}
                <div className="flex items-center justify-between p-4 border rounded-lg bg-emerald-500/5 border-emerald-500/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-emerald-500/10">
                      <Fingerprint className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <span className="font-medium">Autenticación Requerida</span>
                      <p className="text-sm text-muted-foreground">
                        Todas las rutas protegidas requieren sesión activa
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Activo
                  </Badge>
                </div>

                {/* Admin Role Protection */}
                <div className="flex items-center justify-between p-4 border rounded-lg bg-emerald-500/5 border-emerald-500/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-emerald-500/10">
                      <Lock className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <span className="font-medium">Roles de Administrador</span>
                      <p className="text-sm text-muted-foreground">
                        Separados en tabla user_roles con RLS
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Seguro
                  </Badge>
                </div>

                {/* HTTPS */}
                <div className="flex items-center justify-between p-4 border rounded-lg bg-emerald-500/5 border-emerald-500/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-emerald-500/10">
                      <Shield className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <span className="font-medium">HTTPS/SSL</span>
                      <p className="text-sm text-muted-foreground">
                        Conexiones cifradas en producción
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Activo
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Security Features */}
              <div className="space-y-3">
                <h4 className="font-medium">Características de Seguridad</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Verificación de Usuarios</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Sistema de verificación con documento y selfie
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Sistema de Reportes</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Reportes de usuarios y productos sospechosos
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Server className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Edge Functions</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Lógica sensible ejecutada en el servidor
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Key className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Secretos Cifrados</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      API keys almacenadas de forma segura
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recomendaciones de Seguridad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Alert className="bg-emerald-500/10 border-emerald-500/30">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <AlertDescription>
                    Los roles de administrador están protegidos en una tabla separada.
                  </AlertDescription>
                </Alert>
                <Alert className="bg-emerald-500/10 border-emerald-500/30">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <AlertDescription>
                    Las políticas RLS previenen acceso no autorizado a datos.
                  </AlertDescription>
                </Alert>
                <Alert className="bg-emerald-500/10 border-emerald-500/30">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <AlertDescription>
                    El super admin (Adrian@genial.com.ec) tiene protección permanente.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Operations Tab */}
        <TabsContent value="operations" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Operatividad del Sistema
              </CardTitle>
              <CardDescription>
                Monitoreo y configuración operativa de la aplicación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* System Status */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium">Estado del Sistema</span>
                    <Badge className="bg-emerald-500">Online</Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Base de datos</span>
                      <span className="text-emerald-500">●</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Autenticación</span>
                      <span className="text-emerald-500">●</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Storage</span>
                      <span className="text-emerald-500">●</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Edge Functions</span>
                      <span className="text-emerald-500">●</span>
                    </div>
                  </div>
                </div>

                {/* Notifications */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <BellRing className="h-4 w-4" />
                    <span className="font-medium">Notificaciones</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Push notifications</span>
                      <Badge variant="secondary">PWA</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Email (Resend)</span>
                      <Badge className="bg-emerald-500">Activo</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Realtime</span>
                      <Badge className="bg-emerald-500">Activo</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Scheduled Tasks */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Tareas Programadas
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <span className="text-sm font-medium">Notificación de expiración</span>
                      <p className="text-xs text-muted-foreground">
                        product-expiry-notify
                      </p>
                    </div>
                    <Badge variant="outline">Edge Function</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <span className="text-sm font-medium">Expiración de suscripciones</span>
                      <p className="text-xs text-muted-foreground">
                        subscription-expiry-notify
                      </p>
                    </div>
                    <Badge variant="outline">Edge Function</Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Storage */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Almacenamiento
                </h4>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="p-3 border rounded-lg text-center">
                    <span className="text-lg font-bold">avatars</span>
                    <p className="text-xs text-muted-foreground">Público</p>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <span className="text-lg font-bold">product-images</span>
                    <p className="text-xs text-muted-foreground">Público</p>
                  </div>
                  <div className="p-3 border rounded-lg text-center">
                    <span className="text-lg font-bold">verification-docs</span>
                    <p className="text-xs text-muted-foreground">Privado</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Maintenance Actions */}
              <div className="space-y-3">
                <h4 className="font-medium">Acciones de Mantenimiento</h4>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Refrescar caché
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Limpiar productos expirados
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feature Flags Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Funcionalidades Activas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2">
                {flags.filter(f => f.is_enabled).slice(0, 6).map(flag => (
                  <div key={flag.id} className="flex items-center gap-2 p-2 border rounded">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm">{flag.feature_name}</span>
                  </div>
                ))}
              </div>
              {flags.filter(f => f.is_enabled).length > 6 && (
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  +{flags.filter(f => f.is_enabled).length - 6} más activas
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
