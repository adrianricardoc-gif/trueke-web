import { useState } from "react";
import { useAdminSettings } from "@/hooks/useAdminSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Eye, EyeOff, Save, Plus, Trash2, Key, CreditCard, MessageSquare, Bot } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

const API_KEY_ICONS: Record<string, React.ReactNode> = {
  STRIPE_SECRET_KEY: <CreditCard className="h-4 w-4" />,
  STRIPE_PUBLISHABLE_KEY: <CreditCard className="h-4 w-4" />,
  WHATSAPP_API_KEY: <MessageSquare className="h-4 w-4" />,
  OPENAI_API_KEY: <Bot className="h-4 w-4" />,
};

export function AdminAPIKeysManager() {
  const { settings, loading, updateSetting, createSetting, deleteSetting } = useAdminSettings();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showValue, setShowValue] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newKey, setNewKey] = useState({ key: "", value: "", description: "", isSecret: true });

  const handleEdit = (key: string, currentValue: string | null) => {
    setEditingKey(key);
    setEditValue(currentValue || "");
  };

  const handleSave = async (key: string) => {
    setSaving(true);
    await updateSetting(key, editValue);
    setEditingKey(null);
    setEditValue("");
    setSaving(false);
  };

  const handleAddNew = async () => {
    if (!newKey.key) return;
    setSaving(true);
    await createSetting(newKey.key, newKey.value, newKey.description, newKey.isSecret);
    setNewKey({ key: "", value: "", description: "", isSecret: true });
    setIsAddDialogOpen(false);
    setSaving(false);
  };

  const handleDelete = async (key: string) => {
    if (confirm(`¿Estás seguro de eliminar ${key}?`)) {
      await deleteSetting(key);
    }
  };

  const toggleShowValue = (key: string) => {
    setShowValue(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const maskValue = (value: string | null, isSecret: boolean) => {
    if (!value) return "No configurado";
    if (!isSecret) return value;
    if (value.length <= 8) return "••••••••";
    return value.substring(0, 4) + "••••••••" + value.substring(value.length - 4);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Keys y Configuración
            </CardTitle>
            <CardDescription>
              Configura las claves de API para integraciones externas
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Agregar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar nueva configuración</DialogTitle>
                <DialogDescription>
                  Agrega una nueva clave de API o configuración
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nombre de la clave</Label>
                  <Input
                    placeholder="MY_API_KEY"
                    value={newKey.key}
                    onChange={(e) => setNewKey({ ...newKey, key: e.target.value.toUpperCase().replace(/\s/g, "_") })}
                  />
                </div>
                <div>
                  <Label>Valor</Label>
                  <Input
                    type="password"
                    placeholder="sk_live_..."
                    value={newKey.value}
                    onChange={(e) => setNewKey({ ...newKey, value: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Descripción</Label>
                  <Input
                    placeholder="API key para..."
                    value={newKey.description}
                    onChange={(e) => setNewKey({ ...newKey, description: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newKey.isSecret}
                    onCheckedChange={(checked) => setNewKey({ ...newKey, isSecret: checked })}
                  />
                  <Label>Es secreto (ocultar valor)</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddNew} disabled={!newKey.key || saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Guardar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {settings.map((setting) => (
            <div
              key={setting.id}
              className="flex items-center justify-between p-4 border rounded-lg bg-card"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 rounded-md bg-muted">
                  {API_KEY_ICONS[setting.key] || <Key className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">{setting.key}</span>
                    {setting.is_secret && (
                      <Badge variant="secondary" className="text-xs">Secreto</Badge>
                    )}
                    {setting.value ? (
                      <Badge className="text-xs bg-emerald-500/90 hover:bg-emerald-500">Configurado</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-warning border-warning">Pendiente</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{setting.description}</p>
                  
                  {editingKey === setting.key ? (
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        type={showValue[setting.key] ? "text" : "password"}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1"
                        placeholder="Ingresa el valor..."
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => toggleShowValue(setting.key)}
                      >
                        {showValue[setting.key] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSave(setting.key)}
                        disabled={saving}
                      >
                        {saving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingKey(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm font-mono text-muted-foreground mt-1">
                      {showValue[setting.key]
                        ? setting.value || "No configurado"
                        : maskValue(setting.value, setting.is_secret)}
                    </p>
                  )}
                </div>
              </div>
              
              {editingKey !== setting.key && (
                <div className="flex items-center gap-2">
                  {setting.is_secret && setting.value && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => toggleShowValue(setting.key)}
                    >
                      {showValue[setting.key] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(setting.key, setting.value)}
                  >
                    Editar
                  </Button>
                  {!["STRIPE_SECRET_KEY", "STRIPE_PUBLISHABLE_KEY", "WHATSAPP_API_KEY", "OPENAI_API_KEY"].includes(setting.key) && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => handleDelete(setting.key)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}

          {settings.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No hay configuraciones. Agrega una nueva.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
