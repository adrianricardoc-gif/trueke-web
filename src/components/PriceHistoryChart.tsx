import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, History } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PriceHistoryEntry {
  id: string;
  estimated_value: number;
  additional_value: number;
  changed_at: string;
}

interface PriceHistoryChartProps {
  productId: string;
}

const PriceHistoryChart = ({ productId }: PriceHistoryChartProps) => {
  const [history, setHistory] = useState<PriceHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from("price_history")
        .select("*")
        .eq("product_id", productId)
        .order("changed_at", { ascending: true });

      if (!error && data) {
        setHistory(data);
      }
      setLoading(false);
    };

    fetchHistory();
  }, [productId]);

  if (loading) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        Cargando historial...
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
        <History className="h-8 w-8 opacity-50" />
        <p>Sin historial de precios</p>
      </div>
    );
  }

  const firstPrice = history[0]?.estimated_value || 0;
  const lastPrice = history[history.length - 1]?.estimated_value || 0;
  const priceChange = lastPrice - firstPrice;
  const percentChange = firstPrice > 0 ? ((priceChange / firstPrice) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
        <div>
          <p className="text-xs text-muted-foreground">Precio actual</p>
          <p className="text-lg font-bold text-foreground">{formatCurrency(lastPrice)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Variación</p>
          <div className="flex items-center gap-1 justify-end">
            {priceChange > 0 ? (
              <TrendingUp className="h-4 w-4 text-trueke-green" />
            ) : priceChange < 0 ? (
              <TrendingDown className="h-4 w-4 text-destructive" />
            ) : (
              <Minus className="h-4 w-4 text-muted-foreground" />
            )}
            <span className={`text-sm font-semibold ${
              priceChange > 0 ? "text-trueke-green" : 
              priceChange < 0 ? "text-destructive" : 
              "text-muted-foreground"
            }`}>
              {priceChange > 0 ? "+" : ""}{percentChange}%
            </span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-2 max-h-[200px] overflow-y-auto">
        {history.map((entry, index) => {
          const prevPrice = index > 0 ? history[index - 1].estimated_value : entry.estimated_value;
          const diff = entry.estimated_value - prevPrice;
          
          return (
            <div 
              key={entry.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors"
            >
              <div className={`w-2 h-2 rounded-full ${
                diff > 0 ? "bg-trueke-green" : 
                diff < 0 ? "bg-destructive" : 
                "bg-muted-foreground"
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {formatCurrency(entry.estimated_value)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(entry.changed_at), "d MMM yyyy, HH:mm", { locale: es })}
                </p>
              </div>
              {index > 0 && diff !== 0 && (
                <span className={`text-xs font-medium ${
                  diff > 0 ? "text-trueke-green" : "text-destructive"
                }`}>
                  {diff > 0 ? "+" : ""}{formatCurrency(diff)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PriceHistoryChart;
