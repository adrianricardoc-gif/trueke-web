import { useState } from "react";
import { Plus, Edit, Trash2, Crown, Building2, UserCircle, DollarSign, Star, Rocket, RotateCcw, Eye, Flame, Gamepad2, Trophy, Target, Gavel } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAdminPlans } from "@/hooks/useAdminPlans";
import { PremiumPlan } from "@/hooks/usePremiumPlans";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminPlanManager = () => {
  const { plans, loading, createPlan, updatePlan, deletePlan } = useAdminPlans();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PremiumPlan | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    billing_period: "monthly",
    target_user_type: "person",
    features: "",
    visibility_boost: 1,
    max_products: "",
    max_featured_products: 0,
    is_active: true,
    // Tinder-style premium features
    super_likes_per_day: 1,
    boosts_per_month: 0,
    rewinds_per_day: 1,
    can_see_likes: false,
    priority_in_hot: false,
    // Feature toggles per plan
    enable_super_likes: true,
    enable_boosts: true,
    enable_rewinds: true,
    enable_who_likes_me: false,
    enable_hot_priority: false,
    enable_missions: true,
    enable_achievements: true,
    enable_tournaments: true,
    enable_auctions: true,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: 0,
      billing_period: "monthly",
      target_user_type: "person",
      features: "",
      visibility_boost: 1,
      max_products: "",
      max_featured_products: 0,
      is_active: true,
      super_likes_per_day: 1,
      boosts_per_month: 0,
      rewinds_per_day: 1,
      can_see_likes: false,
      priority_in_hot: false,
      enable_super_likes: true,
      enable_boosts: true,
      enable_rewinds: true,
      enable_who_likes_me: false,
      enable_hot_priority: false,
      enable_missions: true,
      enable_achievements: true,
      enable_tournaments: true,
      enable_auctions: true,
    });
  };

  const handleEdit = (plan: PremiumPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || "",
      price: plan.price,
      billing_period: plan.billing_period,
      target_user_type: plan.target_user_type,
      features: plan.features.join("\n"),
      visibility_boost: plan.visibility_boost,
      max_products: plan.max_products?.toString() || "",
      max_featured_products: plan.max_featured_products,
      is_active: plan.is_active,
      super_likes_per_day: plan.super_likes_per_day || 1,
      boosts_per_month: plan.boosts_per_month || 0,
      rewinds_per_day: plan.rewinds_per_day || 1,
      can_see_likes: plan.can_see_likes || false,
      priority_in_hot: plan.priority_in_hot || false,
      enable_super_likes: plan.enable_super_likes !== false,
      enable_boosts: plan.enable_boosts !== false,
      enable_rewinds: plan.enable_rewinds !== false,
      enable_who_likes_me: plan.enable_who_likes_me || false,
      enable_hot_priority: plan.enable_hot_priority || false,
      enable_missions: plan.enable_missions !== false,
      enable_achievements: plan.enable_achievements !== false,
      enable_tournaments: plan.enable_tournaments !== false,
      enable_auctions: plan.enable_auctions !== false,
    });
  };

  const handleSubmit = async () => {
    const planData = {
      name: formData.name,
      description: formData.description || null,
      price: formData.price,
      billing_period: formData.billing_period,
      target_user_type: formData.target_user_type,
      features: formData.features.split("\n").filter(f => f.trim()),
      visibility_boost: formData.visibility_boost,
      max_products: formData.max_products ? parseInt(formData.max_products) : null,
      max_featured_products: formData.max_featured_products,
      is_active: formData.is_active,
      super_likes_per_day: formData.super_likes_per_day,
      boosts_per_month: formData.boosts_per_month,
      rewinds_per_day: formData.rewinds_per_day,
      can_see_likes: formData.can_see_likes,
      priority_in_hot: formData.priority_in_hot,
      enable_super_likes: formData.enable_super_likes,
      enable_boosts: formData.enable_boosts,
      enable_rewinds: formData.enable_rewinds,
      enable_who_likes_me: formData.enable_who_likes_me,
      enable_hot_priority: formData.enable_hot_priority,
      enable_missions: formData.enable_missions,
      enable_achievements: formData.enable_achievements,
      enable_tournaments: formData.enable_tournaments,
      enable_auctions: formData.enable_auctions,
    };

    if (editingPlan) {
      await updatePlan(editingPlan.id, planData);
      setEditingPlan(null);
    } else {
      await createPlan(planData);
      setIsCreateOpen(false);
    }
    resetForm();
  };

  const PlanForm = () => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nombre del Plan</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ej: Premium Empresa"
          />
        </div>
        <div className="space-y-2">
          <Label>Precio</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Descripción</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descripción del plan..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Período de Facturación</Label>
          <Select
            value={formData.billing_period}
            onValueChange={(v) => setFormData({ ...formData, billing_period: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Mensual</SelectItem>
              <SelectItem value="yearly">Anual</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Tipo de Usuario</Label>
          <Select
            value={formData.target_user_type}
            onValueChange={(v) => setFormData({ ...formData, target_user_type: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="person">Persona</SelectItem>
              <SelectItem value="company">Empresa</SelectItem>
              <SelectItem value="all">Todos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Características (una por línea)</Label>
        <Textarea
          value={formData.features}
          onChange={(e) => setFormData({ ...formData, features: e.target.value })}
          placeholder="Productos ilimitados&#10;Mayor visibilidad&#10;Soporte prioritario"
          rows={5}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Boost Visibilidad</Label>
          <Input
            type="number"
            value={formData.visibility_boost}
            onChange={(e) => setFormData({ ...formData, visibility_boost: parseInt(e.target.value) || 1 })}
          />
        </div>
        <div className="space-y-2">
          <Label>Máx. Productos</Label>
          <Input
            type="number"
            value={formData.max_products}
            onChange={(e) => setFormData({ ...formData, max_products: e.target.value })}
            placeholder="Ilimitado"
          />
        </div>
        <div className="space-y-2">
          <Label>Máx. Destacados</Label>
          <Input
            type="number"
            value={formData.max_featured_products}
            onChange={(e) => setFormData({ ...formData, max_featured_products: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      <Separator className="my-4" />
      
      {/* Tinder-style Premium Features */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm font-semibold">
          <Flame className="h-4 w-4 text-trueke-orange" />
          Beneficios Estilo Tinder
        </Label>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1 text-xs">
              <Star className="h-3 w-3 text-trueke-yellow" />
              Super Likes/día
            </Label>
            <Input
              type="number"
              value={formData.super_likes_per_day}
              onChange={(e) => setFormData({ ...formData, super_likes_per_day: parseInt(e.target.value) || 1 })}
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1 text-xs">
              <Rocket className="h-3 w-3 text-trueke-orange" />
              Boosts/mes
            </Label>
            <Input
              type="number"
              value={formData.boosts_per_month}
              onChange={(e) => setFormData({ ...formData, boosts_per_month: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1 text-xs">
              <RotateCcw className="h-3 w-3 text-trueke-green" />
              Rewinds/día
            </Label>
            <Input
              type="number"
              value={formData.rewinds_per_day}
              onChange={(e) => setFormData({ ...formData, rewinds_per_day: parseInt(e.target.value) || 1 })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <Label className="flex items-center gap-2 text-sm">
              <Eye className="h-4 w-4 text-trueke-teal" />
              Ver quién te likea
            </Label>
            <Switch
              checked={formData.can_see_likes}
              onCheckedChange={(checked) => setFormData({ ...formData, can_see_likes: checked })}
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <Label className="flex items-center gap-2 text-sm">
              <Flame className="h-4 w-4 text-trueke-orange" />
              Prioridad en HOT
            </Label>
            <Switch
              checked={formData.priority_in_hot}
              onCheckedChange={(checked) => setFormData({ ...formData, priority_in_hot: checked })}
            />
          </div>
        </div>
      </div>

      {/* Feature Toggles Section */}
      <Separator className="my-4" />
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm font-semibold">
          <Gamepad2 className="h-4 w-4 text-trueke-teal" />
          Funciones Habilitadas en Este Plan
        </Label>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
            <Label className="flex items-center gap-2 text-xs">
              <Star className="h-3 w-3 text-trueke-yellow" />
              Super Likes
            </Label>
            <Switch
              checked={formData.enable_super_likes}
              onCheckedChange={(checked) => setFormData({ ...formData, enable_super_likes: checked })}
            />
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
            <Label className="flex items-center gap-2 text-xs">
              <Rocket className="h-3 w-3 text-trueke-orange" />
              Boosts
            </Label>
            <Switch
              checked={formData.enable_boosts}
              onCheckedChange={(checked) => setFormData({ ...formData, enable_boosts: checked })}
            />
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
            <Label className="flex items-center gap-2 text-xs">
              <RotateCcw className="h-3 w-3 text-trueke-green" />
              Rewinds
            </Label>
            <Switch
              checked={formData.enable_rewinds}
              onCheckedChange={(checked) => setFormData({ ...formData, enable_rewinds: checked })}
            />
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
            <Label className="flex items-center gap-2 text-xs">
              <Eye className="h-3 w-3 text-trueke-teal" />
              Quién te Likea
            </Label>
            <Switch
              checked={formData.enable_who_likes_me}
              onCheckedChange={(checked) => setFormData({ ...formData, enable_who_likes_me: checked })}
            />
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
            <Label className="flex items-center gap-2 text-xs">
              <Flame className="h-3 w-3 text-trueke-orange" />
              Prioridad HOT
            </Label>
            <Switch
              checked={formData.enable_hot_priority}
              onCheckedChange={(checked) => setFormData({ ...formData, enable_hot_priority: checked })}
            />
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
            <Label className="flex items-center gap-2 text-xs">
              <Target className="h-3 w-3 text-trueke-green" />
              Misiones
            </Label>
            <Switch
              checked={formData.enable_missions}
              onCheckedChange={(checked) => setFormData({ ...formData, enable_missions: checked })}
            />
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
            <Label className="flex items-center gap-2 text-xs">
              <Trophy className="h-3 w-3 text-trueke-yellow" />
              Logros
            </Label>
            <Switch
              checked={formData.enable_achievements}
              onCheckedChange={(checked) => setFormData({ ...formData, enable_achievements: checked })}
            />
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
            <Label className="flex items-center gap-2 text-xs">
              <Gamepad2 className="h-3 w-3 text-trueke-teal" />
              Torneos
            </Label>
            <Switch
              checked={formData.enable_tournaments}
              onCheckedChange={(checked) => setFormData({ ...formData, enable_tournaments: checked })}
            />
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 col-span-2">
            <Label className="flex items-center gap-2 text-xs">
              <Gavel className="h-3 w-3 text-trueke-orange" />
              Subastas
            </Label>
            <Switch
              checked={formData.enable_auctions}
              onCheckedChange={(checked) => setFormData({ ...formData, enable_auctions: checked })}
            />
          </div>
        </div>
      </div>

      <Separator className="my-4" />

      <div className="flex items-center justify-between">
        <Label>Plan Activo</Label>
        <Switch
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
      </div>

      <Button onClick={handleSubmit} className="w-full">
        {editingPlan ? "Actualizar Plan" : "Crear Plan"}
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
              <Skeleton key={i} className="h-24 w-full" />
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
            <Crown className="h-5 w-5 text-trueke-yellow" />
            Gestión de Planes Premium
          </CardTitle>
          <CardDescription>Configura los planes y precios</CardDescription>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2" onClick={resetForm}>
              <Plus className="h-4 w-4" />
              Nuevo Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Plan</DialogTitle>
              <DialogDescription>
                Define las características y precio del nuevo plan
              </DialogDescription>
            </DialogHeader>
            <PlanForm />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                !plan.is_active ? "opacity-50 bg-muted" : ""
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${
                  plan.target_user_type === "company" 
                    ? "bg-secondary/10" 
                    : "bg-primary/10"
                }`}>
                  {plan.target_user_type === "company" ? (
                    <Building2 className="h-5 w-5 text-secondary" />
                  ) : (
                    <UserCircle className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{plan.name}</p>
                    {!plan.is_active && (
                      <Badge variant="secondary">Inactivo</Badge>
                    )}
                    {plan.price > 0 && (
                      <Badge className="bg-trueke-yellow/20 text-trueke-yellow">
                        Premium
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="h-3 w-3" />
                    {plan.price === 0 ? "Gratis" : `${formatCurrency(plan.price)}/${plan.billing_period === "monthly" ? "mes" : "año"}`}
                    <span className="mx-1">•</span>
                    {plan.features.length} características
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Dialog open={editingPlan?.id === plan.id} onOpenChange={(open) => !open && setEditingPlan(null)}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleEdit(plan)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Editar Plan</DialogTitle>
                      <DialogDescription>
                        Modifica las características del plan
                      </DialogDescription>
                    </DialogHeader>
                    <PlanForm />
                  </DialogContent>
                </Dialog>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => deletePlan(plan.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminPlanManager;
