import { LucideIcon, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  iconColor?: "blue" | "green" | "red" | "navy";
  delay?: number;
}

const iconColorClasses = {
  blue: "bg-kpi-blue/10 text-kpi-blue",
  green: "bg-accent/10 text-accent",
  red: "bg-destructive/10 text-destructive",
  navy: "bg-kpi-navy/10 text-kpi-navy",
};

export function KPICard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconColor = "blue",
  delay = 0,
}: KPICardProps) {
  const getTrendIcon = () => {
    if (change === undefined) return null;
    if (change > 0) return <ArrowUpRight className="h-4 w-4" />;
    if (change < 0) return <ArrowDownRight className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getTrendColor = () => {
    if (change === undefined) return "";
    if (change > 0) return "text-accent";
    if (change < 0) return "text-destructive";
    return "text-muted-foreground";
  };

  return (
    <div
      className="kpi-card animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn("p-3 rounded-xl", iconColorClasses[iconColor])}>
          <Icon className="h-6 w-6" />
        </div>
        {change !== undefined && (
          <div className={cn("flex items-center gap-1 text-sm font-medium", getTrendColor())}>
            {getTrendIcon()}
            <span>{Math.abs(change).toFixed(1)}%</span>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="kpi-label">{title}</p>
        <p className="kpi-value text-foreground">{value}</p>
        {changeLabel && (
          <p className="text-xs text-muted-foreground">{changeLabel}</p>
        )}
      </div>
    </div>
  );
}
