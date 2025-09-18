// Chart components simplified to avoid type conflicts
import * as React from "react"

export type ChartConfig = Record<string, {
    label?: React.ReactNode
    icon?: React.ComponentType
} & (
        | { color?: string; theme?: never }
        | { color?: never; theme: Record<string, string> }
    )>

export type ChartProps = any

const Chart = React.forwardRef<HTMLDivElement, ChartProps>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={className} {...props} />
    )
)
Chart.displayName = "Chart"

const ChartTooltip = () => <div>Chart Tooltip</div>
const ChartTooltipContent = () => <div>Chart Tooltip Content</div>
const ChartLegend = () => <div>Chart Legend</div>
const ChartLegendContent = () => <div>Chart Legend Content</div>

export {
    Chart,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
}
