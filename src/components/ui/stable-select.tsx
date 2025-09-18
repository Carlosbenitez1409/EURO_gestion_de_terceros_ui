import { ReactNode, useEffect, useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface StableSelectProps {
    value?: string;
    onValueChange?: (value: string) => void;
    placeholder?: string;
    children: ReactNode;
    className?: string;
    triggerClassName?: string;
    contentClassName?: string;
    disabled?: boolean;
}

/**
 * Componente Select mejorado que previene problemas de hidratación
 * aplicando estilos inline críticos inmediatamente
 */
export function StableSelect({
    value,
    onValueChange,
    placeholder,
    children,
    className = "",
    triggerClassName = "",
    contentClassName = "",
    disabled = false
}: StableSelectProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Usar requestAnimationFrame para asegurar que el DOM esté listo
        const frame1 = requestAnimationFrame(() => {
            const frame2 = requestAnimationFrame(() => {
                setIsVisible(true);
            });
        });

        return () => {
            cancelAnimationFrame(frame1);
        };
    }, []);

    // Estilos críticos inline para prevenir FOUC
    const triggerStyles: React.CSSProperties = {
        minHeight: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem',
        borderRadius: '0.375rem',
        border: '2px solid #E8F4FD',
        backgroundColor: '#ffffff',
        color: '#0033A0',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        opacity: isVisible ? 1 : 0,
        visibility: isVisible ? 'visible' : 'hidden'
    };

    return (
        <div className={`relative ${className}`}>
            <Select 
                value={value} 
                onValueChange={onValueChange}
                disabled={disabled}
            >
                <SelectTrigger 
                    className={triggerClassName}
                    style={triggerStyles}
                >
                    <SelectValue 
                        placeholder={placeholder} 
                        className="text-[#0033A0]/60" 
                    />
                </SelectTrigger>
                <SelectContent 
                    className={contentClassName}
                    style={{ 
                        backgroundColor: '#ffffff',
                        border: '2px solid #E8F4FD',
                        borderRadius: '0.375rem',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                >
                    {children}
                </SelectContent>
            </Select>
        </div>
    );
}
