import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/common/LoadingStates";

interface SelectLoadingProps {
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  label?: string;
}

export function SelectLoading({ 
  placeholder = "Cargando opciones...", 
  className = "",
  disabled = true,
  label 
}: SelectLoadingProps) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium mb-2 text-foreground">
          {label}
        </label>
      )}
      <Select disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={
            <div className="flex items-center gap-2 text-muted-foreground">
              <LoadingSpinner size="sm" />
              {placeholder}
            </div>
          } />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="loading" disabled>
            <div className="flex items-center gap-2">
              <LoadingSpinner size="sm" />
              Cargando datos...
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

interface SelectWithOptionsProps {
  options: { value: string; label: string }[];
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  label?: string;
  loading?: boolean;
}

export function SelectWithOptions({
  options,
  placeholder = "Selecciona una opción",
  value,
  onValueChange,
  className = "",
  label,
  loading = false
}: SelectWithOptionsProps) {
  if (loading) {
    return <SelectLoading placeholder="Cargando opciones..." className={className} label={label} />;
  }

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium mb-2 text-foreground">
          {label}
        </label>
      )}
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
