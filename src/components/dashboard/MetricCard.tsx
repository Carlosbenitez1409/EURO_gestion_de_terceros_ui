import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon: LucideIcon;
    trend?: {
        value: number;
        label: string;
    };
    variant?: "default" | "success" | "warning" | "destructive";
    className?: string;
}

export function MetricCard({
    title,
    value,
    description,
    icon: Icon,
    trend,
    variant = "default",
    className
}: MetricCardProps) {
    const variantStyles = {
        default: "border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 hover:shadow-lg transition-all duration-300",
        success: "border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 hover:shadow-lg transition-all duration-300",
        warning: "border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100/50 hover:shadow-lg transition-all duration-300",
        destructive: "border-red-200 bg-gradient-to-br from-red-50 to-red-100/50 hover:shadow-lg transition-all duration-300"
    };

    const iconContainerStyles = {
        default: "bg-blue-100 border border-blue-200",
        success: "bg-green-100 border border-green-200",
        warning: "bg-yellow-100 border border-yellow-200",
        destructive: "bg-red-100 border border-red-200"
    };

    const iconStyles = {
        default: "text-blue-600",
        success: "text-green-600",
        warning: "text-yellow-600",
        destructive: "text-red-600"
    };

    const trendColors = {
        positive: "bg-green-100 text-green-700 border-green-200",
        negative: "bg-red-100 text-red-700 border-red-200"
    };

    return (
        <Card className={cn(variantStyles[variant], "shadow-sm border-2 hover:scale-105", className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                    {title}
                </CardTitle>
                <div className={cn(
                    "p-3 rounded-xl",
                    iconContainerStyles[variant]
                )}>
                    <Icon className={cn("h-5 w-5", iconStyles[variant])} />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-gray-800 mb-2">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                </div>
                {description && (
                    <p className="text-sm text-gray-600 mb-3">
                        {description}
                    </p>
                )}
                {trend && (
                    <div className="flex items-center gap-2">
                        <Badge
                            variant="outline"
                            className={cn(
                                "text-xs font-medium flex items-center gap-1",
                                trend.value >= 0 ? trendColors.positive : trendColors.negative
                            )}
                        >
                            {trend.value >= 0 ? (
                                <TrendingUp className="h-3 w-3" />
                            ) : (
                                <TrendingDown className="h-3 w-3" />
                            )}
                            {trend.value >= 0 ? "+" : ""}{trend.value}%
                        </Badge>
                        <span className="text-xs text-gray-500">
                            {trend.label}
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}