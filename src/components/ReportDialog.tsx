import { useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useReports, ReportReason, ReportType } from "@/hooks/useReports";

interface ReportDialogProps {
  type: ReportType;
  productId?: string;
  userId?: string;
  triggerClassName?: string;
}

const reasonLabels: Record<ReportReason, string> = {
  spam: "Spam o publicidad no deseada",
  inappropriate: "Contenido inapropiado",
  fake: "Producto falso o inexistente",
  offensive: "Contenido ofensivo",
  scam: "Posible estafa",
  other: "Otro motivo",
};

const ReportDialog = ({ type, productId, userId, triggerClassName }: ReportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | "">("");
  const [description, setDescription] = useState("");
  const { createReport, loading } = useReports();

  const handleSubmit = async () => {
    if (!reason) return;

    const success = await createReport({
      reportType: type,
      productId,
      userId,
      reason,
      description: description.trim() || undefined,
    });

    if (success) {
      setOpen(false);
      setReason("");
      setDescription("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={triggerClassName}
        >
          <Flag className="h-4 w-4" />
          <span className="sr-only md:not-sr-only md:ml-1">Reportar</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm mx-4">
        <DialogHeader>
          <DialogTitle>Reportar {type === "product" ? "producto" : "usuario"}</DialogTitle>
          <DialogDescription>
            Ayúdanos a mantener la comunidad segura. Tu reporte será revisado por nuestro equipo.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Motivo del reporte</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as ReportReason)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un motivo" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(reasonLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Descripción (opcional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe el problema..."
              rows={3}
              maxLength={500}
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!reason || loading}
            className="w-full"
          >
            {loading ? "Enviando..." : "Enviar reporte"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDialog;
