import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";

// Loading Spinner Component
export function LoadingSpinner({ size = "default", className = "" }: { size?: "sm" | "default" | "lg", className?: string }) {
    const sizeClasses = {
        sm: "h-4 w-4",
        default: "h-8 w-8",
        lg: "h-12 w-12"
    };

    return (
        <Loader2 className={`animate-spin ${sizeClasses[size]} ${className}`} />
    );
}

// Full Page Loading
export function PageLoading({ message = "Cargando..." }: { message?: string }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6 p-8">
            <div className="relative">
                {/* Círculo de fondo decorativo */}
                <div className="absolute inset-0 bg-[#0033A0]/5 rounded-full animate-pulse"></div>
                <div className="relative bg-white rounded-full p-4 shadow-lg">
                    <LoadingSpinner size="lg" className="text-[#0033A0]" />
                </div>
            </div>
            
            <div className="text-center space-y-2">
                <p className="text-[#0033A0] font-semibold text-lg">{message}</p>
                <div className="flex items-center justify-center space-x-1">
                    <div className="w-2 h-2 bg-[#FFD700] rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-[#FFD700] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-[#FFD700] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
            </div>
        </div>
    );
}

// Table Loading Skeleton
export function TableLoadingSkeleton({ rows = 5, columns = 6 }: { rows?: number, columns?: number }) {
    return (
        <div className="space-y-3">
            {/* Header skeleton */}
            <div className="flex space-x-4">
                {Array.from({ length: columns }).map((_, index) => (
                    <Skeleton key={index} className="h-4 flex-1" />
                ))}
            </div>
            {/* Rows skeleton */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={rowIndex} className="flex space-x-4">
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <Skeleton key={colIndex} className="h-8 flex-1" />
                    ))}
                </div>
            ))}
        </div>
    );
}

// Card Loading Skeleton
export function CardLoadingSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
            </CardContent>
        </Card>
    );
}

// Dashboard Metrics Loading
export function MetricsLoadingSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
                <Card key={index}>
                    <CardHeader className="pb-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-16" />
                    </CardHeader>
                </Card>
            ))}
        </div>
    );
}

// Empty State Component
export function EmptyState({
    title,
    description,
    action,
    icon: Icon = AlertCircle
}: {
    title: string;
    description: string;
    action?: React.ReactNode;
    icon?: React.ComponentType<{ className?: string }>;
}) {
    return (
        <div className="text-center py-12">
            <Icon className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">{description}</p>
            {action}
        </div>
    );
}

// Error State Component
export function ErrorState({
    title = "Error",
    description = "Algo salió mal",
    onRetry,
    className = ""
}: {
    title?: string;
    description?: string;
    onRetry?: () => void;
    className?: string;
}) {
    return (
        <div className={`text-center py-12 ${className}`}>
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">{description}</p>
            {onRetry && (
                <Button onClick={onRetry} variant="outline" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Reintentar
                </Button>
            )}
        </div>
    );
}

// Success State Component
export function SuccessState({
    title,
    description,
    action
}: {
    title: string;
    description: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="text-center py-12">
            <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">{description}</p>
            {action}
        </div>
    );
}

// Inline Loading State
export function InlineLoading({ text = "Cargando..." }: { text?: string }) {
    return (
        <div className="flex items-center gap-2 text-muted-foreground">
            <LoadingSpinner size="sm" />
            <span className="text-sm">{text}</span>
        </div>
    );
}

// Button Loading State
export function ButtonLoading({ children, loading = false, ...props }: {
    children: React.ReactNode;
    loading?: boolean;
    [key: string]: any;
}) {
    return (
        <Button disabled={loading} {...props}>
            {loading && <LoadingSpinner size="sm" className="mr-2" />}
            {children}
        </Button>
    );
}

// Status Badge Component
export function StatusBadge({
    status,
    loading = false
}: {
    status: "success" | "error" | "warning" | "info" | "pending";
    loading?: boolean;
}) {
    if (loading) {
        return (
            <Badge variant="secondary" className="gap-1">
                <LoadingSpinner size="sm" />
                Cargando...
            </Badge>
        );
    }

    const statusConfig = {
        success: { variant: "default" as const, text: "Éxito", className: "bg-success text-success-foreground" },
        error: { variant: "destructive" as const, text: "Error", className: "" },
        warning: { variant: "secondary" as const, text: "Advertencia", className: "bg-warning text-warning-foreground" },
        info: { variant: "secondary" as const, text: "Info", className: "bg-info text-info-foreground" },
        pending: { variant: "secondary" as const, text: "Pendiente", className: "" }
    };

    const config = statusConfig[status];

    return (
        <Badge variant={config.variant} className={config.className}>
            {config.text}
        </Badge>
    );
}

// Progress Loading
export function ProgressLoading({
    progress,
    label = "Progreso"
}: {
    progress: number;
    label?: string;
}) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <span>{label}</span>
                <span>{progress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
                <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}