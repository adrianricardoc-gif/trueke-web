import { useState, useEffect } from "react";
import { ArrowLeft, FileText, Building2, UserCircle, Shield, Coins, Trophy, Gavel, MessageCircle, MapPin, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface TermsSection {
  title: string;
  icon: React.ReactNode;
  content: string[];
}

const Terms = () => {
  const navigate = useNavigate();
  const [customTerms, setCustomTerms] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const { data } = await supabase
          .from("admin_settings")
          .select("value, updated_at")
          .eq("key", "terms_and_conditions")
          .maybeSingle();

        if (data?.value) {
          setCustomTerms(data.value);
          setLastUpdated(data.updated_at);
        }
      } catch (error) {
        console.error("Error fetching terms:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTerms();
  }, []);

  const defaultSections: TermsSection[] = [
    {
      title: "1. Aceptación de Términos",
      icon: <FileText className="h-5 w-5" />,
      content: [
        "Al acceder y utilizar Trueke, aceptas estar sujeto a estos términos y condiciones de uso.",
        "Si no estás de acuerdo con alguna parte de estos términos, no debes utilizar la plataforma.",
        "Nos reservamos el derecho de modificar estos términos en cualquier momento."
      ]
    },
    {
      title: "2. Usuarios Persona",
      icon: <UserCircle className="h-5 w-5" />,
      content: [
        "Los usuarios tipo 'Persona' pueden publicar productos físicos para intercambio.",
        "Cada usuario puede tener hasta 10 productos activos en el plan gratuito.",
        "Los productos deben tener imágenes reales y descripciones precisas.",
        "Está prohibido publicar productos ilegales, falsificados o peligrosos.",
        "El valor estimado debe reflejar el precio justo de mercado del producto."
      ]
    },
    {
      title: "3. Usuarios Empresa",
      icon: <Building2 className="h-5 w-5" />,
      content: [
        "Los usuarios tipo 'Empresa' pueden publicar servicios profesionales.",
        "Las empresas tienen acceso a un dashboard de analíticas de rendimiento.",
        "Los servicios deben cumplir con las regulaciones locales aplicables.",
        "Las empresas pueden utilizar respuestas rápidas para atención al cliente.",
        "La información de contacto comercial debe ser verificable."
      ]
    },
    {
      title: "4. Sistema de Intercambio (Swipe)",
      icon: <Star className="h-5 w-5" />,
      content: [
        "El sistema de swipe permite descubrir productos y servicios deslizando.",
        "Deslizar a la derecha indica interés en un intercambio.",
        "Deslizar a la izquierda descarta el producto o servicio.",
        "Un 'match' ocurre cuando dos usuarios muestran interés mutuo.",
        "Los matches permiten iniciar conversaciones para negociar intercambios."
      ]
    },
    {
      title: "5. TruKoins - Moneda Virtual",
      icon: <Coins className="h-5 w-5" />,
      content: [
        "Los TruKoins son la moneda virtual de la plataforma.",
        "Se pueden ganar completando misiones, logros y participando en torneos.",
        "Sirven para destacar productos, impulsar visibilidad y completar intercambios parciales.",
        "Los TruKoins no tienen valor monetario real y no son reembolsables.",
        "El sistema de escrow protege los TruKoins hasta confirmar el intercambio."
      ]
    },
    {
      title: "6. Torneos y Competencias",
      icon: <Trophy className="h-5 w-5" />,
      content: [
        "Los torneos permiten competir con otros usuarios por premios.",
        "Los rankings se basan en cantidad de intercambios, calificaciones y TruKoins.",
        "Los premios pueden incluir TruKoins, insignias especiales y beneficios.",
        "La participación en torneos es voluntaria y gratuita.",
        "Las reglas específicas de cada torneo se publican antes de su inicio."
      ]
    },
    {
      title: "7. Subastas",
      icon: <Gavel className="h-5 w-5" />,
      content: [
        "Las subastas permiten ofertar TruKoins por productos destacados.",
        "Las pujas son vinculantes y no pueden retirarse.",
        "El ganador debe completar el intercambio en el tiempo establecido.",
        "Las subastas tienen un tiempo límite claramente indicado.",
        "Trueke puede cancelar subastas que violen los términos de uso."
      ]
    },
    {
      title: "8. Mensajería y Comunicación",
      icon: <MessageCircle className="h-5 w-5" />,
      content: [
        "La mensajería está disponible solo entre usuarios con match.",
        "Está prohibido el spam, acoso o contenido inapropiado.",
        "Las negociaciones deben realizarse de buena fe.",
        "Trueke puede revisar mensajes reportados por usuarios.",
        "La información de contacto personal debe compartirse con precaución."
      ]
    },
    {
      title: "9. Puntos de Encuentro Seguros",
      icon: <MapPin className="h-5 w-5" />,
      content: [
        "Recomendamos usar puntos de encuentro seguros verificados.",
        "Los intercambios presenciales son responsabilidad de los usuarios.",
        "Se pueden programar citas y enviar recordatorios desde la app.",
        "Trueke no se hace responsable de incidentes durante intercambios.",
        "Reportar cualquier comportamiento sospechoso inmediatamente."
      ]
    },
    {
      title: "10. Verificación y Confianza",
      icon: <Shield className="h-5 w-5" />,
      content: [
        "Los usuarios pueden verificar su identidad para mayor confianza.",
        "El sistema de reseñas permite calificar intercambios completados.",
        "Las insignias y niveles reflejan la experiencia del usuario.",
        "Los productos pueden ser verificados por autenticidad.",
        "Las cuentas con comportamiento fraudulento serán suspendidas."
      ]
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 pb-24">
        <div className="max-w-2xl mx-auto space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Términos y Condiciones</h1>
            {lastUpdated && (
              <p className="text-xs text-muted-foreground">
                Última actualización: {new Date(lastUpdated).toLocaleDateString('es-EC')}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Introduction */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Bienvenido a Trueke, la plataforma de intercambio de productos y servicios. 
              Estos términos y condiciones rigen el uso de nuestra aplicación y servicios. 
              Por favor, léelos cuidadosamente antes de usar la plataforma.
            </p>
          </CardContent>
        </Card>

        {/* Custom Terms (if set by admin) */}
        {customTerms && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Términos Personalizados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {customTerms}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* Default Sections */}
        {defaultSections.map((section, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="pb-2 bg-muted/30">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="text-primary">{section.icon}</span>
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-2">
                {section.content.map((item, itemIndex) => (
                  <li key={itemIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-1.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}

        {/* Footer */}
        <Card className="bg-muted/50">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">
              Al usar Trueke, confirmas que has leído, entendido y aceptado estos términos y condiciones.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Para preguntas o aclaraciones, contáctanos a través del soporte de la aplicación.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Terms;
