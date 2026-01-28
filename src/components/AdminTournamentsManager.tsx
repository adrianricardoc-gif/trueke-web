import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Swords, Users } from "lucide-react";
import { format } from "date-fns";

interface Tournament {
  id: string;
  name: string;
  description: string | null;
  tournament_type: string;
  category: string | null;
  start_date: string;
  end_date: string;
  prize_trukoins: number;
  prize_description: string | null;
  min_participants: number;
  max_participants: number | null;
  status: string;
}

export function AdminTournamentsManager() {
  const { toast } = useToast();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    tournament_type: "monthly",
    category: "",
    start_date: "",
    end_date: "",
    prize_trukoins: 1000,
    prize_description: "",
    min_participants: 10,
    max_participants: 100,
    status: "upcoming",
  });

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .order("start_date", { ascending: false });

      if (error) throw error;
      setTournaments(data || []);
    } catch (error) {
      console.error("Error fetching tournaments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        category: formData.category || null,
        max_participants: formData.max_participants || null,
      };

      if (editingTournament) {
        const { error } = await supabase
          .from("tournaments")
          .update(payload)
          .eq("id", editingTournament.id);

        if (error) throw error;
        toast({ title: "Torneo actualizado" });
      } else {
        const { error } = await supabase.from("tournaments").insert(payload);

        if (error) throw error;
        toast({ title: "Torneo creado" });
      }

      setIsDialogOpen(false);
      setEditingTournament(null);
      resetForm();
      fetchTournaments();
    } catch (error) {
      console.error("Error saving tournament:", error);
      toast({ variant: "destructive", title: "Error al guardar" });
    }
  };

  const handleEdit = (tournament: Tournament) => {
    setEditingTournament(tournament);
    setFormData({
      name: tournament.name,
      description: tournament.description || "",
      tournament_type: tournament.tournament_type,
      category: tournament.category || "",
      start_date: tournament.start_date.split("T")[0],
      end_date: tournament.end_date.split("T")[0],
      prize_trukoins: tournament.prize_trukoins,
      prize_description: tournament.prize_description || "",
      min_participants: tournament.min_participants,
      max_participants: tournament.max_participants || 100,
      status: tournament.status,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("tournaments").delete().eq("id", id);

      if (error) throw error;
      toast({ title: "Torneo eliminado" });
      fetchTournaments();
    } catch (error) {
      console.error("Error deleting tournament:", error);
      toast({ variant: "destructive", title: "Error al eliminar" });
    }
  };

  const resetForm = () => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0);

    setFormData({
      name: "",
      description: "",
      tournament_type: "monthly",
      category: "",
      start_date: nextMonth.toISOString().split("T")[0],
      end_date: endOfNextMonth.toISOString().split("T")[0],
      prize_trukoins: 1000,
      prize_description: "",
      min_participants: 10,
      max_participants: 100,
      status: "upcoming",
    });
  };

  const categories = [
    "Electrónica",
    "Ropa",
    "Hogar",
    "Deportes",
    "Juguetes",
    "Libros",
    "Arte",
    "Música",
    "Coleccionables",
  ];

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-100 text-blue-800";
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Swords className="h-5 w-5" />
          Gestión de Torneos
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingTournament(null);
                resetForm();
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Torneo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingTournament ? "Editar Torneo" : "Nuevo Torneo"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <Label>Nombre del Torneo</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Torneo del Mes de Febrero"
                />
              </div>
              <div>
                <Label>Descripción</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Compite con otros usuarios..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo</Label>
                  <Select
                    value={formData.tournament_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, tournament_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensual</SelectItem>
                      <SelectItem value="special">Especial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Categoría (opcional)</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas las categorías</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fecha de Inicio</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Fecha de Fin</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Premio (TrueKoins)</Label>
                  <Input
                    type="number"
                    value={formData.prize_trukoins}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        prize_trukoins: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Estado</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upcoming">Próximo</SelectItem>
                      <SelectItem value="active">Activo</SelectItem>
                      <SelectItem value="completed">Completado</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Descripción del Premio</Label>
                <Input
                  value={formData.prize_description}
                  onChange={(e) =>
                    setFormData({ ...formData, prize_description: e.target.value })
                  }
                  placeholder="1er lugar: 500 TK, 2do: 300 TK..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Mín. Participantes</Label>
                  <Input
                    type="number"
                    value={formData.min_participants}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        min_participants: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Máx. Participantes</Label>
                  <Input
                    type="number"
                    value={formData.max_participants}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_participants: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <Button onClick={handleSubmit} className="w-full">
                {editingTournament ? "Guardar Cambios" : "Crear Torneo"}
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
                <TableHead>Torneo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Fechas</TableHead>
                <TableHead>Premio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tournaments.map((tournament) => (
                <TableRow key={tournament.id}>
                  <TableCell className="font-medium">
                    {tournament.name}
                    {tournament.category && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({tournament.category})
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{tournament.tournament_type}</TableCell>
                  <TableCell>
                    {format(new Date(tournament.start_date), "dd/MM")} -{" "}
                    {format(new Date(tournament.end_date), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>{tournament.prize_trukoins} TK</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs ${getStatusBadgeClass(
                        tournament.status
                      )}`}
                    >
                      {tournament.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(tournament)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(tournament.id)}
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
