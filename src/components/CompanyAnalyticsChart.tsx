import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, TrendingDown, Users, CheckCircle, BarChart3 } from "lucide-react";
import { useCompanyAnalytics, AnalyticsPeriod } from "@/hooks/useCompanyAnalytics";
import { Skeleton } from "@/components/ui/skeleton";

const CompanyAnalyticsChart = () => {
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");
  const { chartData, summary, loading } = useCompanyAnalytics(period);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4 text-trueke-green" />;
    if (value < 0) return <TrendingDown className="h-4 w-4 text-destructive" />;
    return null;
  };

  const formatTrendValue = (value: number) => {
    const sign = value > 0 ? "+" : "";
    return `${sign}${value}%`;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-primary" />
            Analytics de Rendimiento
          </CardTitle>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as AnalyticsPeriod)}>
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="7d" className="text-xs">7 días</TabsTrigger>
              <TabsTrigger value="30d" className="text-xs">30 días</TabsTrigger>
              <TabsTrigger value="90d" className="text-xs">90 días</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-secondary/10 rounded-xl p-3 space-y-1">
            <div className="flex items-center justify-between">
              <Users className="h-4 w-4 text-secondary" />
              <div className="flex items-center gap-1 text-xs">
                {getTrendIcon(summary.inquiriesChange)}
                <span className={summary.inquiriesChange >= 0 ? "text-trueke-green" : "text-destructive"}>
                  {formatTrendValue(summary.inquiriesChange)}
                </span>
              </div>
            </div>
            <p className="text-2xl font-bold">{summary.totalInquiries}</p>
            <p className="text-xs text-muted-foreground">Consultas</p>
          </div>

          <div className="bg-trueke-green/10 rounded-xl p-3 space-y-1">
            <div className="flex items-center justify-between">
              <CheckCircle className="h-4 w-4 text-trueke-green" />
              <div className="flex items-center gap-1 text-xs">
                {getTrendIcon(summary.conversionsChange)}
                <span className={summary.conversionsChange >= 0 ? "text-trueke-green" : "text-destructive"}>
                  {formatTrendValue(summary.conversionsChange)}
                </span>
              </div>
            </div>
            <p className="text-2xl font-bold">{summary.totalConversions}</p>
            <p className="text-xs text-muted-foreground">Conversiones</p>
          </div>

          <div className="bg-primary/10 rounded-xl p-3 space-y-1">
            <div className="flex items-center justify-between">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold">{summary.conversionRate}%</p>
            <p className="text-xs text-muted-foreground">Tasa Conv.</p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }}
                className="text-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                className="text-muted-foreground"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px"
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="inquiries"
                name="Consultas"
                stroke="hsl(var(--secondary))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="conversions"
                name="Conversiones"
                stroke="hsl(142 76% 36%)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="likes"
                name="Likes"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompanyAnalyticsChart;
