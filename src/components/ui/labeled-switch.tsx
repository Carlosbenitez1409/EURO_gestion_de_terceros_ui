import * as React from "react"
import { Switch } from "./switch"
import { Label } from "./label"
import { cn } from "@/lib/utils"

interface LabeledSwitchProps {
    id?: string
    checked?: boolean
    onCheckedChange?: (checked: boolean) => void
    disabled?: boolean
    label?: string
    description?: string
    className?: string
    labelPosition?: "left" | "right"
    size?: "sm" | "default" | "lg"
}

const LabeledSwitch = React.forwardRef<
    React.ElementRef<typeof Switch>,
    LabeledSwitchProps
>(({ 
    id,
    checked = false,
    onCheckedChange,
    disabled = false,
    label,
    description,
    className,
    labelPosition = "right",
    size = "default",
    ...props 
}, ref) => {
    const switchId = id || React.useId()
    
    const sizeClasses = {
        sm: "text-sm",
        default: "",
        lg: "text-lg"
    }
    
    const switchComponent = (
        <Switch
            id={switchId}
            ref={ref}
            checked={checked}
            onCheckedChange={onCheckedChange}
            disabled={disabled}
            aria-checked={checked}
            aria-describedby={description ? `${switchId}-description` : undefined}
            data-state={checked ? "checked" : "unchecked"}
            {...props}
        />
    )
    
    const labelComponent = label && (
        <div className="flex flex-col space-y-1">
            <Label 
                htmlFor={switchId}
                className={cn(
                    "cursor-pointer font-medium text-foreground",
                    disabled && "cursor-not-allowed opacity-50",
                    sizeClasses[size]
                )}
            >
                {label}
            </Label>
            {description && (
                <p 
                    id={`${switchId}-description`}
                    className={cn(
                        "text-sm text-muted-foreground",
                        disabled && "opacity-50"
                    )}
                >
                    {description}
                </p>
            )}
        </div>
    )
    
    if (!label) {
        return switchComponent
    }
    
    return (
        <div className={cn("flex items-center space-x-3", className)}>
            {labelPosition === "left" && labelComponent}
            {switchComponent}
            {labelPosition === "right" && labelComponent}
        </div>
    )
})

LabeledSwitch.displayName = "LabeledSwitch"

export { LabeledSwitch }
export type { LabeledSwitchProps }
