import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

const categoryData = [
  { name: "Garden Supplies", revenue: 24500, change: 12.5, margin: 34 },
  { name: "Outdoor Furniture", revenue: 18200, change: -3.2, margin: 28 },
  { name: "Plants & Seeds", revenue: 15800, change: 8.7, margin: 42 },
  { name: "Tools & Equipment", revenue: 12400, change: 5.1, margin: 31 },
  { name: "Landscaping", revenue: 9800, change: -1.8, margin: 38 },
  { name: "Irrigation", revenue: 7600, change: 15.3, margin: 26 },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(value);

export function CategoryTable() {
  return (
    <div className="kpi-card animate-slide-up" style={{ animationDelay: "300ms" }}>
      <div className="mb-6">
        <h3 className="text-lg font-display font-semibold text-foreground">
          Category Performance
        </h3>
        <p className="text-sm text-muted-foreground">
          Revenue breakdown by product category
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Category
              </th>
              <th className="text-right py-3 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Revenue
              </th>
              <th className="text-right py-3 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Change
              </th>
              <th className="text-right py-3 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Margin
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {categoryData.map((category, index) => (
              <tr
                key={category.name}
                className="hover:bg-secondary/50 transition-colors"
              >
                <td className="py-4 px-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        index === 0
                          ? "bg-accent"
                          : index === 1
                          ? "bg-primary"
                          : "bg-muted-foreground/40"
                      )}
                    />
                    <span className="font-medium text-foreground">
                      {category.name}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-2 text-right font-semibold text-foreground">
                  {formatCurrency(category.revenue)}
                </td>
                <td className="py-4 px-2 text-right">
                  <div
                    className={cn(
                      "inline-flex items-center gap-1 text-sm font-medium",
                      category.change > 0 ? "text-accent" : "text-destructive"
                    )}
                  >
                    {category.change > 0 ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                    {Math.abs(category.change)}%
                  </div>
                </td>
                <td className="py-4 px-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${category.margin}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8">
                      {category.margin}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
