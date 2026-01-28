import { useState, useRef } from "react";
import { Shield, Upload, Camera, CheckCircle, Clock, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useVerification } from "@/hooks/useVerification";

const VerificationDialog = () => {
  const [open, setOpen] = useState(false);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);
  const { request, loading, submitting, submitVerification } = useVerification();

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "document" | "selfie"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (type === "document") {
        setDocumentFile(file);
        setDocumentPreview(reader.result as string);
      } else {
        setSelfieFile(file);
        setSelfiePreview(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!documentFile || !selfieFile) return;

    const success = await submitVerification(documentFile, selfieFile);
    if (success) {
      setDocumentFile(null);
      setSelfieFile(null);
      setDocumentPreview(null);
      setSelfiePreview(null);
    }
  };

  const getStatusDisplay = () => {
    if (!request) return null;

    const statusConfig = {
      pending: {
        icon: Clock,
        text: "En revisión",
        color: "text-yellow-500",
        bgColor: "bg-yellow-500/10",
      },
      approved: {
        icon: CheckCircle,
        text: "Aprobado",
        color: "text-green-500",
        bgColor: "bg-green-500/10",
      },
      rejected: {
        icon: XCircle,
        text: "Rechazado",
        color: "text-red-500",
        bgColor: "bg-red-500/10",
      },
    };

    const config = statusConfig[request.status];
    const Icon = config.icon;

    return (
      <div className={cn("flex items-center gap-2 p-3 rounded-xl", config.bgColor)}>
        <Icon className={cn("h-5 w-5", config.color)} />
        <div className="flex-1">
          <p className={cn("font-medium", config.color)}>{config.text}</p>
          <p className="text-xs text-muted-foreground">
            Enviado el {new Date(request.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Shield className="h-4 w-4" />
          Verificar identidad
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Verificación de identidad
          </DialogTitle>
          <DialogDescription>
            Verifica tu identidad para obtener la insignia de usuario verificado y generar más confianza.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : request ? (
          <div className="space-y-4 pt-4">
            {getStatusDisplay()}
            {request.status === "rejected" && request.admin_notes && (
              <div className="p-3 rounded-xl bg-destructive/10 text-sm">
                <p className="font-medium text-destructive">Motivo:</p>
                <p className="text-muted-foreground">{request.admin_notes}</p>
              </div>
            )}
            {request.status === "rejected" && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  // Reset to allow new submission
                }}
              >
                Intentar de nuevo
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4 pt-4">
            {/* Document Upload */}
            <div className="space-y-2">
              <Label>Documento de identidad</Label>
              <p className="text-xs text-muted-foreground">
                Sube una foto clara de tu documento (INE, pasaporte, etc.)
              </p>
              <input
                ref={documentInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "document")}
                className="hidden"
              />
              <button
                onClick={() => documentInputRef.current?.click()}
                className={cn(
                  "w-full h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors",
                  documentPreview
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/30 hover:border-primary/50"
                )}
              >
                {documentPreview ? (
                  <img
                    src={documentPreview}
                    alt="Documento"
                    className="h-full w-full object-cover rounded-lg"
                  />
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Toca para subir
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Selfie Upload */}
            <div className="space-y-2">
              <Label>Selfie con documento</Label>
              <p className="text-xs text-muted-foreground">
                Toma una foto de ti sosteniendo tu documento
              </p>
              <input
                ref={selfieInputRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={(e) => handleFileChange(e, "selfie")}
                className="hidden"
              />
              <button
                onClick={() => selfieInputRef.current?.click()}
                className={cn(
                  "w-full h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors",
                  selfiePreview
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/30 hover:border-primary/50"
                )}
              >
                {selfiePreview ? (
                  <img
                    src={selfiePreview}
                    alt="Selfie"
                    className="h-full w-full object-cover rounded-lg"
                  />
                ) : (
                  <>
                    <Camera className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Toca para tomar foto
                    </span>
                  </>
                )}
              </button>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!documentFile || !selfieFile || submitting}
              className="w-full"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Enviando...
                </>
              ) : (
                "Enviar solicitud"
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VerificationDialog;
