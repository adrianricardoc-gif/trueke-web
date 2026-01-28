import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Trophy } from "lucide-react";

interface Achievement {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  reward_trukoins: number;
  is_secret: boolean;
  is_active: boolean;
}

export function AdminAchievementsManager() {
  const { toast } = useToast();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "🏆",
    category: "general",
    requirement_type: "trades_completed",
    requirement_value: 1,
    reward_trukoins: 50,
    is_secret: false,
    is_active: true,
  });

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .order("category", { ascending: true });

      if (error) throw error;
      setAchievements(data || []);
    } catch (error) {
      console.error("Error fetching achievements:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingAchievement) {
        const { error } = await supabase
          .from("achievements")
          .update(formData)
          .eq("id", editingAchievement.id);

        if (error) throw error;
        toast({ title: "Logro actualizado" });
      } else {
        const { error } = await supabase.from("achievements").insert(formData);

        if (error) throw error;
        toast({ title: "Logro creado" });
      }

      setIsDialogOpen(false);
      setEditingAchievement(null);
      resetForm();
      fetchAchievements();
    } catch (error) {
      console.error("Error saving achievement:", error);
      toast({ variant: "destructive", title: "Error al guardar" });
    }
  };

  const handleEdit = (achievement: Achievement) => {
    setEditingAchievement(achievement);
    setFormData({
      name: achievement.name,
      description: achievement.description || "",
      icon: achievement.icon,
      category: achievement.category,
      requirement_type: achievement.requirement_type,
      requirement_value: achievement.requirement_value,
      reward_trukoins: achievement.reward_trukoins,
      is_secret: achievement.is_secret,
      is_active: achievement.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("achievements").delete().eq("id", id);

      if (error) throw error;
      toast({ title: "Logro eliminado" });
      fetchAchievements();
    } catch (error) {
      console.error("Error deleting achievement:", error);
      toast({ variant: "destructive", title: "Error al eliminar" });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      icon: "🏆",
      category: "general",
      requirement_type: "trades_completed",
      requirement_value: 1,
      reward_trukoins: 50,
      is_secret: false,
      is_active: true,
    });
  };

  const categories = [
    { value: "general", label: "General" },
    { value: "trading", label: "Trading" },
    { value: "social", label: "Social" },
    { value: "collector", label: "Coleccionista" },
    { value: "streak", label: "Racha" },
  ];

  const requirementTypes = [
    { value: "trades_completed", label: "Truekes completados" },
    { value: "trukoins_earned", label: "TrueKoins ganados" },
    { value: "streak_days", label: "Días de racha" },
    { value: "products_listed", label: "Productos publicados" },
    { value: "likes_received", label: "Likes recibidos" },
    { value: "reviews_given", label: "Reseñas dadas" },
    { value: "perfect_rating", label: "Rating perfecto" },
  ];

  const emojiIcons = ["🏆", "🎉", "🌟", "💫", "👑", "🔥", "⚡", "📦", "🏪", "❤️", "💰", "📝", "⭐", "🎯", "🚀"];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Gestión de Logros
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingAchievement(null);
                resetForm();
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Logro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingAchievement ? "Editar Logro" : "Nuevo Logro"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-3">
                  <Label>Nombre</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Icono</Label>
                  <Select
                    value={formData.icon}
                    onValueChange={(value) =>
                      setFormData({ ...formData, icon: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {emojiIcons.map((emoji) => (
                        <SelectItem key={emoji} value={emoji}>
                          {emoji}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Descripción</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Categoría</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo de Requisito</Label>
                  <Select
                    value={formData.requirement_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, requirement_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {requirementTypes.map((req) => (
                        <SelectItem key={req.value} value={req.value}>
                          {req.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Valor Requerido</Label>
                  <Input
                    type="number"
                    value={formData.requirement_value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        requirement_value: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Recompensa TrueKoins</Label>
                  <Input
                    type="number"
                    value={formData.reward_trukoins}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        reward_trukoins: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_secret}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_secret: checked })
                    }
                  />
                  <Label>Secreto</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                  <Label>Activo</Label>
                </div>
              </div>
              <Button onClick={handleSubmit} className="w-full">
                {editingAchievement ? "Guardar Cambios" : "Crear Logro"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Cargando...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Logro</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Requisito</TableHead>
                <TableHead>Recompensa</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {achievements.map((achievement) => (
                <TableRow key={achievement.id}>
                  <TableCell className="font-medium">
                    <span className="mr-2">{achievement.icon}</span>
                    {achievement.name}
                    {achievement.is_secret && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (secreto)
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{achievement.category}</TableCell>
                  <TableCell>
                    {achievement.requirement_type}: {achievement.requirement_value}
                  </TableCell>
                  <TableCell>{achievement.reward_trukoins} TK</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        achievement.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {achievement.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(achievement)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(achievement.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
