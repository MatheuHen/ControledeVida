"use client";

import { useRef, useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDateRange, type PeriodPreset, type DateRange } from "@/lib/period";
import { Button } from "@/components/ui/button";
import { CalendarInput } from "@/components/ui/calendar";

interface PeriodFilterProps {
  value: PeriodPreset;
  customRange?: DateRange;
  onChange: (preset: PeriodPreset, range: DateRange) => void;
  className?: string;
}

const PRESETS: { label: string; value: Exclude<PeriodPreset, "custom"> }[] = [
  { label: "Hoje", value: "today" },
  { label: "7 dias", value: "7d" },
  { label: "30 dias", value: "30d" },
  { label: "Este mês", value: "month" },
  { label: "Este ano", value: "year" },
];

export function PeriodFilter({ value, customRange, onChange, className }: PeriodFilterProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [localFrom, setLocalFrom] = useState(
    customRange?.from ? format(customRange.from, "yyyy-MM-dd") : "",
  );
  const [localTo, setLocalTo] = useState(
    customRange?.to ? format(customRange.to, "yyyy-MM-dd") : "",
  );
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setCalendarOpen(false);
      }
    }
    if (calendarOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [calendarOpen]);

  function handlePreset(preset: Exclude<PeriodPreset, "custom">) {
    const range = getDateRange(preset);
    onChange(preset, range);
    setCalendarOpen(false);
  }

  function handleCustomApply() {
    if (localFrom && localTo) {
      onChange("custom", { from: new Date(localFrom), to: new Date(localTo + "T23:59:59") });
      setCalendarOpen(false);
    }
  }

  const currentRange =
    value === "custom" && customRange
      ? customRange
      : value !== "custom"
      ? getDateRange(value)
      : null;

  const customLabel =
    currentRange && value === "custom"
      ? `${format(currentRange.from, "dd/MM/yy", { locale: ptBR })} – ${format(currentRange.to, "dd/MM/yy", { locale: ptBR })}`
      : "Personalizado";

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {PRESETS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => handlePreset(opt.value)}
          className={cn(
            "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
            value === opt.value
              ? "bg-emerald-500 text-white"
              : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
          )}
        >
          {opt.label}
        </button>
      ))}

      <div className="relative" ref={popoverRef}>
        <button
          onClick={() => setCalendarOpen((v) => !v)}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
            value === "custom"
              ? "bg-emerald-500 text-white"
              : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
          )}
        >
          <CalendarIcon className="h-4 w-4" />
          {customLabel}
        </button>

        {calendarOpen && (
          <div className="absolute left-0 top-12 z-50 min-w-[280px] rounded-xl border border-border bg-card p-4 shadow-xl">
            <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Período personalizado</p>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">De</label>
                <CalendarInput value={localFrom} onChange={(e) => setLocalFrom(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Até</label>
                <CalendarInput value={localTo} onChange={(e) => setLocalTo(e.target.value)} />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setCalendarOpen(false)} className="h-9 px-3 text-xs">
                Cancelar
              </Button>
              <Button onClick={handleCustomApply} disabled={!localFrom || !localTo} className="h-9 px-3 text-xs">
                Aplicar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
