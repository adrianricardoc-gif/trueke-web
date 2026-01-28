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
import { Plus, Edit, Trash2, Target, Trophy } from "lucide-react";

interface Mission {
  id: string;
  title: string;
  description: string | null;
  mission_type: string;
  action_type: string;
  target_count: number;
  reward_trukoins: number;
  reward_xp: number;
  is_active: boolean;
}

export function AdminMissionsManager() {
  const { toast } = useToast();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMission, setEditingMission] = useState<Mission | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    mission_type: "daily",
    action_type: "swipe",
    target_count: 1,
    reward_trukoins: 10,
    reward_xp: 10,
    is_active: true,
  });

  useEffect(() => {
    fetchMissions();
  }, []);

  const fetchMissions = async () => {
    try {
      const { data, error } = await supabase
        .from("missions")
        .select("*")
        .order("mission_type", { ascending: true });

      if (error) throw error;
      setMissions(data || []);
    } catch (error) {
      console.error("Error fetching missions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingMission) {
        const { error } = await supabase
          .from("missions")
          .update(formData)
          .eq("id", editingMission.id);

        if (error) throw error;
        toast({ title: "Misión actualizada" });
      } else {
        const { error } = await supabase.from("missions").insert(formData);

        if (error) throw error;
        toast({ title: "Misión creada" });
      }

      setIsDialogOpen(false);
      setEditingMission(null);
      resetForm();
      fetchMissions();
    } catch (error) {
      console.error("Error saving mission:", error);
      toast({ variant: "destructive", title: "Error al guardar" });
    }
  };

  const handleEdit = (mission: Mission) => {
    setEditingMission(mission);
    setFormData({
      title: mission.title,
      description: mission.description || "",
      mission_type: mission.mission_type,
      action_type: mission.action_type,
      target_count: mission.target_count,
      reward_trukoins: mission.reward_trukoins,
      reward_xp: mission.reward_xp,
      is_active: mission.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("missions").delete().eq("id", id);

      if (error) throw error;
      toast({ title: "Misión eliminada" });
      fetchMissions();
    } catch (error) {
      console.error("Error deleting mission:", error);
      toast({ variant: "destructive", title: "Error al eliminar" });
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      mission_type: "daily",
      action_type: "swipe",
      target_count: 1,
      reward_trukoins: 10,
      reward_xp: 10,
      is_active: true,
    });
  };

  const actionTypes = [
    { value: "swipe", label: "Deslizar productos" },
    { value: "like", label: "Dar likes" },
    { value: "trade", label: "Completar truekes" },
    { value: "message", label: "Enviar mensajes" },
    { value: "list_product", label: "Publicar productos" },
    { value: "review", label: "Dejar reseñas" },
    { value: "likes_received", label: "Recibir likes" },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Gestión de Misiones
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingMission(null);
                resetForm();
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Misión
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingMission ? "Editar Misión" : "Nueva Misión"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
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
                  <Label>Tipo de Misión</Label>
                  <Select
                    value={formData.mission_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, mission_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diaria</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="special">Especial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo de Acción</Label>
                  <Select
                    value={formData.action_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, action_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {actionTypes.map((action) => (
                        <SelectItem key={action.value} value={action.value}>
                          {action.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Objetivo</Label>
                  <Input
                    type="number"
                    value={formData.target_count}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        target_count: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label>TrueKoins</Label>
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
                <div>
                  <Label>XP</Label>
                  <Input
                    type="number"
                    value={formData.reward_xp}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        reward_xp: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Label>Activa</Label>
              </div>
              <Button onClick={handleSubmit} className="w-full">
                {editingMission ? "Guardar Cambios" : "Crear Misión"}
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
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>Objetivo</TableHead>
                <TableHead>Recompensa</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {missions.map((mission) => (
                <TableRow key={mission.id}>
                  <TableCell className="font-medium">{mission.title}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        mission.mission_type === "daily"
                          ? "bg-blue-100 text-blue-800"
                          : mission.mission_type === "weekly"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {mission.mission_type}
                    </span>
                  </TableCell>
                  <TableCell>{mission.action_type}</TableCell>
                  <TableCell>{mission.target_count}</TableCell>
                  <TableCell>
                    {mission.reward_trukoins} TK + {mission.reward_xp} XP
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        mission.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {mission.is_active ? "Activa" : "Inactiva"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(mission)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(mission.id)}
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
