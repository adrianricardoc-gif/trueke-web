import { useState } from "react";
import { Plus, Edit, Trash2, Tag, Percent, DollarSign, Calendar, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useDiscountCodes, DiscountCode } from "@/hooks/useDiscountCodes";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const AdminDiscountManager = () => {
  const { codes, loading, createCode, updateCode, deleteCode } = useDiscountCodes();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null);
  
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: 10,
    max_uses: "",
    valid_until: "",
    min_plan_price: 0,
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      discount_type: "percentage",
      discount_value: 10,
      max_uses: "",
      valid_until: "",
      min_plan_price: 0,
      is_active: true,
    });
  };

  const handleEdit = (code: DiscountCode) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      description: code.description || "",
      discount_type: code.discount_type,
      discount_value: code.discount_value,
      max_uses: code.max_uses?.toString() || "",
      valid_until: code.valid_until ? format(new Date(code.valid_until), "yyyy-MM-dd") : "",
      min_plan_price: code.min_plan_price,
      is_active: code.is_active,
    });
  };

  const handleSubmit = async () => {
    const codeData = {
      code: formData.code,
      description: formData.description || null,
      discount_type: formData.discount_type,
      discount_value: formData.discount_value,
      max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
      valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null,
      min_plan_price: formData.min_plan_price,
      is_active: formData.is_active,
    };

    if (editingCode) {
      await updateCode(editingCode.id, codeData);
      setEditingCode(null);
    } else {
      await createCode(codeData);
      setIsCreateOpen(false);
    }
    resetForm();
  };

  const generateRandomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  const CodeForm = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Código</Label>
        <div className="flex gap-2">
          <Input
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="DESCUENTO20"
            className="uppercase"
          />
          <Button type="button" variant="outline" onClick={generateRandomCode}>
            Generar
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Descripción</Label>
        <Input
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descuento de bienvenida"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo de Descuento</Label>
          <Select
            value={formData.discount_type}
            onValueChange={(v) => setFormData({ ...formData, discount_type: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Porcentaje (%)</SelectItem>
              <SelectItem value="fixed">Monto Fijo ($)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Valor</Label>
          <Input
            type="number"
            value={formData.discount_value}
            onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Usos Máximos</Label>
          <Input
            type="number"
            value={formData.max_uses}
            onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
            placeholder="Ilimitado"
          />
        </div>
        <div className="space-y-2">
          <Label>Válido Hasta</Label>
          <Input
            type="date"
            value={formData.valid_until}
            onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Precio Mínimo del Plan</Label>
        <Input
          type="number"
          value={formData.min_plan_price}
          onChange={(e) => setFormData({ ...formData, min_plan_price: parseFloat(e.target.value) || 0 })}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label>Código Activo</Label>
        <Switch
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
      </div>

      <Button onClick={handleSubmit} className="w-full">
        {editingCode ? "Actualizar Código" : "Crear Código"}
      </Button>
    </div>
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-trueke-green" />
            Códigos de Descuento
          </CardTitle>
          <CardDescription>Gestiona códigos promocionales</CardDescription>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2" onClick={resetForm}>
              <Plus className="h-4 w-4" />
              Nuevo Código
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Código de Descuento</DialogTitle>
              <DialogDescription>
                Define los parámetros del código promocional
              </DialogDescription>
            </DialogHeader>
            <CodeForm />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {codes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay códigos de descuento creados
            </p>
          ) : (
            codes.map((code) => (
              <div
                key={code.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  !code.is_active ? "opacity-50 bg-muted" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-trueke-green/10">
                    {code.discount_type === "percentage" ? (
                      <Percent className="h-5 w-5 text-trueke-green" />
                    ) : (
                      <DollarSign className="h-5 w-5 text-trueke-green" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-mono font-bold">{code.code}</p>
                      {!code.is_active && (
                        <Badge variant="secondary">Inactivo</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>
                        {code.discount_type === "percentage" 
                          ? `${code.discount_value}% OFF` 
                          : `$${code.discount_value} OFF`}
                      </span>
                      <span className="mx-1">•</span>
                      <Users className="h-3 w-3" />
                      <span>{code.current_uses}{code.max_uses ? `/${code.max_uses}` : ""} usos</span>
                      {code.valid_until && (
                        <>
                          <span className="mx-1">•</span>
                          <Calendar className="h-3 w-3" />
                          <span>hasta {format(new Date(code.valid_until), "dd/MM/yy", { locale: es })}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Dialog open={editingCode?.id === code.id} onOpenChange={(open) => !open && setEditingCode(null)}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleEdit(code)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Editar Código</DialogTitle>
                        <DialogDescription>
                          Modifica los parámetros del código
                        </DialogDescription>
                      </DialogHeader>
                      <CodeForm />
                    </DialogContent>
                  </Dialog>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => deleteCode(code.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminDiscountManager;
