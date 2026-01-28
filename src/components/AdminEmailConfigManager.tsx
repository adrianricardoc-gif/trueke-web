import { useState, useEffect } from "react";
import { Mail, Send, CheckCircle, AlertCircle, Save, TestTube, Server, Key, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminSettings } from "@/hooks/useAdminSettings";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

type EmailProvider = "resend" | "smtp" | "sendgrid";

interface EmailConfig {
  provider: EmailProvider;
  sender_address: string;
  sender_name: string;
  reply_to: string;
  // SMTP specific
  smtp_host: string;
  smtp_port: string;
  smtp_user: string;
  smtp_password: string;
  smtp_secure: boolean;
  // API keys
  resend_api_key: string;
  sendgrid_api_key: string;
}

const DEFAULT_CONFIG: EmailConfig = {
  provider: "resend",
  sender_address: "",
  sender_name: "Trueke",
  reply_to: "",
  smtp_host: "",
  smtp_port: "587",
  smtp_user: "",
  smtp_password: "",
  smtp_secure: true,
  resend_api_key: "",
  sendgrid_api_key: "",
};

export const AdminEmailConfigManager = () => {
  const { settings, loading, updateSetting, createSetting, refetch } = useAdminSettings();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [config, setConfig] = useState<EmailConfig>(DEFAULT_CONFIG);
  const [testEmail, setTestEmail] = useState("");

  useEffect(() => {
    if (settings.length > 0) {
      const settingsMap: Record<string, string> = {};
      settings.forEach(s => { settingsMap[s.key] = s.value || ""; });
      
      setConfig({
        provider: (settingsMap.email_provider as EmailProvider) || "resend",
        sender_address: settingsMap.email_sender_address || "",
        sender_name: settingsMap.email_sender_name || "Trueke",
        reply_to: settingsMap.email_reply_to || "",
        smtp_host: settingsMap.email_smtp_host || "",
        smtp_port: settingsMap.email_smtp_port || "587",
        smtp_user: settingsMap.email_smtp_user || "",
        smtp_password: settingsMap.email_smtp_password || "",
        smtp_secure: settingsMap.email_smtp_secure !== "false",
        resend_api_key: settingsMap.email_resend_api_key || "",
        sendgrid_api_key: settingsMap.email_sendgrid_api_key || "",
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates = [
        { key: "email_provider", value: config.provider, desc: "Proveedor de correo", isSecret: false },
        { key: "email_sender_address", value: config.sender_address, desc: "Dirección de correo remitente", isSecret: false },
        { key: "email_sender_name", value: config.sender_name, desc: "Nombre del remitente", isSecret: false },
        { key: "email_reply_to", value: config.reply_to, desc: "Dirección de respuesta", isSecret: false },
        { key: "email_smtp_host", value: config.smtp_host, desc: "Host SMTP", isSecret: false },
        { key: "email_smtp_port", value: config.smtp_port, desc: "Puerto SMTP", isSecret: false },
        { key: "email_smtp_user", value: config.smtp_user, desc: "Usuario SMTP", isSecret: false },
        { key: "email_smtp_password", value: config.smtp_password, desc: "Contraseña SMTP", isSecret: true },
        { key: "email_smtp_secure", value: config.smtp_secure.toString(), desc: "SMTP seguro (TLS)", isSecret: false },
        { key: "email_resend_api_key", value: config.resend_api_key, desc: "API Key de Resend", isSecret: true },
        { key: "email_sendgrid_api_key", value: config.sendgrid_api_key, desc: "API Key de SendGrid", isSecret: true },
      ];

      for (const update of updates) {
        const existing = settings.find(s => s.key === update.key);
        if (existing) {
          await updateSetting(update.key, update.value);
        } else {
          await createSetting(update.key, update.value, update.desc, update.isSecret);
        }
      }

      toast({
        title: "Configuración guardada",
        description: "La configuración de correo ha sido actualizada.",
      });
      
      await refetch();
    } catch (error) {
      console.error("Error saving email config:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar la configuración.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast({ variant: "destructive", title: "Error", description: "Ingresa un correo de prueba." });
      return;
    }

    if (!config.sender_address) {
      toast({ variant: "destructive", title: "Error", description: "Configura primero la dirección del remitente." });
      return;
    }

    setIsTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-test-email", {
        body: {
          to: testEmail,
          provider: config.provider,
          senderEmail: config.sender_address,
          senderName: config.sender_name,
          // Provider-specific config
          smtpHost: config.smtp_host,
          smtpPort: parseInt(config.smtp_port),
          smtpUser: config.smtp_user,
          smtpPassword: config.smtp_password,
          smtpSecure: config.smtp_secure,
          resendApiKey: config.resend_api_key,
          sendgridApiKey: config.sendgrid_api_key,
        },
      });

      if (error) throw error;

      toast({
        title: "Correo enviado",
        description: `Se envió un correo de prueba a ${testEmail}`,
      });
    } catch (error: any) {
      console.error("Error sending test email:", error);
      toast({
        variant: "destructive",
        title: "Error al enviar",
        description: error.message || "No se pudo enviar el correo de prueba.",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const togglePassword = (field: string) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent><Skeleton className="h-48 w-full" /></CardContent>
      </Card>
    );
  }

  const isConfigured = config.sender_address.length > 0 && (
    (config.provider === "resend" && config.resend_api_key.length > 0) ||
    (config.provider === "sendgrid" && config.sendgrid_api_key.length > 0) ||
    (config.provider === "smtp" && config.smtp_host.length > 0)
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-trueke-teal" />
              Configuración de Correo Externo
            </CardTitle>
            <CardDescription>
              Conecta un servicio de correo externo para enviar notificaciones
            </CardDescription>
          </div>
          <Badge variant={isConfigured ? "default" : "secondary"} className="gap-1">
            {isConfigured ? (
              <><CheckCircle className="h-3 w-3" /> Configurado</>
            ) : (
              <><AlertCircle className="h-3 w-3" /> Sin configurar</>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Provider Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Proveedor de Correo</Label>
          <Select
            value={config.provider}
            onValueChange={(value: EmailProvider) => setConfig(prev => ({ ...prev, provider: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un proveedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="resend">Resend</SelectItem>
              <SelectItem value="sendgrid">SendGrid</SelectItem>
              <SelectItem value="smtp">SMTP Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Common Sender Configuration */}
        <div className="space-y-4">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <Mail className="h-4 w-4" /> Configuración del Remitente
          </Label>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Correo del Remitente *</Label>
              <Input
                type="email"
                placeholder="noreply@tudominio.com"
                value={config.sender_address}
                onChange={(e) => setConfig(prev => ({ ...prev, sender_address: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Nombre del Remitente</Label>
              <Input
                placeholder="Trueke"
                value={config.sender_name}
                onChange={(e) => setConfig(prev => ({ ...prev, sender_name: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Correo de Respuesta (opcional)</Label>
            <Input
              type="email"
              placeholder="soporte@tudominio.com"
              value={config.reply_to}
              onChange={(e) => setConfig(prev => ({ ...prev, reply_to: e.target.value }))}
            />
          </div>
        </div>

        <Separator />

        {/* Provider-specific Configuration */}
        {config.provider === "resend" && (
          <div className="space-y-4">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Key className="h-4 w-4" /> Configuración de Resend
            </Label>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">API Key de Resend *</Label>
              <div className="flex gap-2">
                <Input
                  type={showPasswords.resend ? "text" : "password"}
                  placeholder="re_xxxxxxxxx..."
                  value={config.resend_api_key}
                  onChange={(e) => setConfig(prev => ({ ...prev, resend_api_key: e.target.value }))}
                  className="flex-1"
                />
                <Button variant="outline" size="icon" onClick={() => togglePassword("resend")}>
                  {showPasswords.resend ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Obtén tu API Key en <a href="https://resend.com/api-keys" target="_blank" className="underline">resend.com/api-keys</a>
              </p>
            </div>
          </div>
        )}

        {config.provider === "sendgrid" && (
          <div className="space-y-4">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Key className="h-4 w-4" /> Configuración de SendGrid
            </Label>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">API Key de SendGrid *</Label>
              <div className="flex gap-2">
                <Input
                  type={showPasswords.sendgrid ? "text" : "password"}
                  placeholder="SG.xxxxxxxxx..."
                  value={config.sendgrid_api_key}
                  onChange={(e) => setConfig(prev => ({ ...prev, sendgrid_api_key: e.target.value }))}
                  className="flex-1"
                />
                <Button variant="outline" size="icon" onClick={() => togglePassword("sendgrid")}>
                  {showPasswords.sendgrid ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Obtén tu API Key en <a href="https://app.sendgrid.com/settings/api_keys" target="_blank" className="underline">SendGrid API Keys</a>
              </p>
            </div>
          </div>
        )}

        {config.provider === "smtp" && (
          <div className="space-y-4">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Server className="h-4 w-4" /> Configuración SMTP
            </Label>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Host SMTP *</Label>
                <Input
                  placeholder="smtp.gmail.com"
                  value={config.smtp_host}
                  onChange={(e) => setConfig(prev => ({ ...prev, smtp_host: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Puerto</Label>
                <Input
                  placeholder="587"
                  value={config.smtp_port}
                  onChange={(e) => setConfig(prev => ({ ...prev, smtp_port: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Usuario SMTP</Label>
                <Input
                  placeholder="usuario@gmail.com"
                  value={config.smtp_user}
                  onChange={(e) => setConfig(prev => ({ ...prev, smtp_user: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Contraseña SMTP</Label>
                <div className="flex gap-2">
                  <Input
                    type={showPasswords.smtp ? "text" : "password"}
                    placeholder="••••••••"
                    value={config.smtp_password}
                    onChange={(e) => setConfig(prev => ({ ...prev, smtp_password: e.target.value }))}
                    className="flex-1"
                  />
                  <Button variant="outline" size="icon" onClick={() => togglePassword("smtp")}>
                    {showPasswords.smtp ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Para Gmail, usa una "Contraseña de aplicación" desde <a href="https://myaccount.google.com/apppasswords" target="_blank" className="underline">myaccount.google.com</a>
            </p>
          </div>
        )}

        <Button onClick={handleSave} disabled={isSaving} className="w-full gap-2">
          <Save className="h-4 w-4" />
          {isSaving ? "Guardando..." : "Guardar Configuración"}
        </Button>

        <Separator />

        {/* Test Email */}
        <div className="space-y-4">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Enviar Correo de Prueba
          </Label>
          
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="tucorreo@ejemplo.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={handleTestEmail} 
              disabled={isTesting || !isConfigured}
              variant="outline"
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {isTesting ? "Enviando..." : "Probar"}
            </Button>
          </div>
          {!isConfigured && (
            <p className="text-xs text-muted-foreground">
              Completa la configuración del proveedor para enviar correos de prueba.
            </p>
          )}
        </div>

        <Separator />

        {/* Info */}
        <div className="p-4 rounded-lg bg-muted/50 space-y-2">
          <p className="text-sm font-medium">📧 Proveedores Soportados</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• <strong>Resend:</strong> Simple y moderno, ideal para startups</li>
            <li>• <strong>SendGrid:</strong> Robusto con analytics avanzados</li>
            <li>• <strong>SMTP:</strong> Cualquier servidor (Gmail, Outlook, custom)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminEmailConfigManager;
