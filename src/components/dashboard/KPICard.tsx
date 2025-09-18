import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  color: "blue" | "yellow" | "green" | "red" | "gray";
  className?: string;
}

const colorVariants = {
  blue: {
    bg: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/30",
    border: "border-blue-200 dark:border-blue-800",
    icon: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-100 dark:bg-blue-900/50",
    text: "text-blue-900 dark:text-blue-100",
    accent: "text-blue-700 dark:text-blue-300"
  },
  yellow: {
    bg: "bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-950/20 dark:to-amber-900/30",
    border: "border-yellow-200 dark:border-yellow-800",
    icon: "text-yellow-600 dark:text-yellow-400",
    iconBg: "bg-yellow-100 dark:bg-yellow-900/50",
    text: "text-yellow-900 dark:text-yellow-100",
    accent: "text-yellow-700 dark:text-yellow-300"
  },
  green: {
    bg: "bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/20 dark:to-emerald-900/30",
    border: "border-green-200 dark:border-green-800",
    icon: "text-green-600 dark:text-green-400",
    iconBg: "bg-green-100 dark:bg-green-900/50",
    text: "text-green-900 dark:text-green-100",
    accent: "text-green-700 dark:text-green-300"
  },
  red: {
    bg: "bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950/20 dark:to-rose-900/30",
    border: "border-red-200 dark:border-red-800",
    icon: "text-red-600 dark:text-red-400",
    iconBg: "bg-red-100 dark:bg-red-900/50",
    text: "text-red-900 dark:text-red-100",
    accent: "text-red-700 dark:text-red-300"
  },
  gray: {
    bg: "bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-950/20 dark:to-slate-900/30",
    border: "border-gray-200 dark:border-gray-800",
    icon: "text-gray-600 dark:text-gray-400",
    iconBg: "bg-gray-100 dark:bg-gray-900/50",
    text: "text-gray-900 dark:text-gray-100",
    accent: "text-gray-700 dark:text-gray-300"
  }
};

export function KPICard({ title, value, icon: Icon, trend, color, className }: KPICardProps) {
  const variant = colorVariants[color];

  return (
    <Card className={cn(
      "transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-2",
      variant.bg,
      variant.border,
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className={cn("text-sm font-medium", variant.accent)}>
              {title}
            </p>
            <p className={cn("text-3xl font-bold", variant.text)}>
              {value}
            </p>
            {trend && (
              <p className="text-xs text-muted-foreground">
                <span className={trend.value >= 0 ? "text-green-600" : "text-red-600"}>
                  {trend.value >= 0 ? "+" : ""}{trend.value}%
                </span>
                {" "}{trend.label}
              </p>
            )}
          </div>
          <div className={cn("p-3 rounded-full", variant.iconBg)}>
            <Icon className={cn("h-6 w-6", variant.icon)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
