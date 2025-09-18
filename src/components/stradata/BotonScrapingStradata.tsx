import React from 'react';
import { Button } from "@/components/ui/button";
import { Search, RefreshCw } from "lucide-react";

interface BotonScrapingStratadaProps {
    onEjecutarScraping: () => void;
    loading: boolean;
    disabled?: boolean;
    size?: "sm" | "default" | "lg";
    variant?: "default" | "outline" | "secondary";
    className?: string;
    mostrarTexto?: boolean;
}

const BotonScrapingStradata: React.FC<BotonScrapingStratadaProps> = ({
    onEjecutarScraping,
    loading,
    disabled = false,
    size = "default",
    variant = "default",
    className = "",
    mostrarTexto = true
}) => {
    return (
        <Button
            onClick={onEjecutarScraping}
            disabled={loading || disabled}
            size={size}
            variant={variant}
            className={`bg-[#0052CC] text-white hover:bg-[#003d99] border-[#0052CC] ${className}`}
        >
            {loading ? (
                <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    {mostrarTexto && <span className="ml-2">Consultando...</span>}
                </>
            ) : (
                <>
                    <Search className="h-4 w-4" />
                    {mostrarTexto && <span className="ml-2">Consultar Stradata</span>}
                </>
            )}
        </Button>
    );
};

export default BotonScrapingStradata;
