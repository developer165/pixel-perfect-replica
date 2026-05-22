import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const sampleData = [
  { week: "W1", revenue: 45000, margin: 32, target: 42000 },
  { week: "W2", revenue: 52000, margin: 35, target: 42000 },
  { week: "W3", revenue: 48000, margin: 30, target: 42000 },
  { week: "W4", revenue: 61000, margin: 38, target: 42000 },
  { week: "W5", revenue: 55000, margin: 34, target: 42000 },
  { week: "W6", revenue: 67000, margin: 40, target: 42000 },
  { week: "W7", revenue: 72000, margin: 42, target: 42000 },
  { week: "W8", revenue: 58000, margin: 36, target: 42000 },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium text-foreground">
            {entry.name === "Margin" ? `${entry.value}%` : formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

export function SalesChart() {
  return (
    <div className="kpi-card animate-slide-up" style={{ animationDelay: "200ms" }}>
      <div className="mb-6">
        <h3 className="text-lg font-display font-semibold text-foreground">
          Weekly Sales Performance
        </h3>
        <p className="text-sm text-muted-foreground">
          Revenue and margin trends over the last 8 weeks
        </p>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={sampleData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="week"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `$${value / 1000}k`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              formatter={(value) => (
                <span className="text-sm text-muted-foreground">{value}</span>
              )}
            />
            <Bar
              yAxisId="left"
              dataKey="revenue"
              name="Revenue"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="target"
              name="Target"
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="5 5"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="margin"
              name="Margin"
              stroke="hsl(var(--accent))"
              strokeWidth={3}
              dot={{ fill: "hsl(var(--accent))", strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
