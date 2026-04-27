"use client";

import { useRef, type ChangeEvent } from "react";
import { cn } from "@/lib/utils";

interface MoneyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value?: number | null;
  onChange?: (value: number | null) => void;
}

function MoneyInput({ value, onChange, className, ...props }: MoneyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function formatDisplay(val: number | null | undefined): string {
    if (val === null || val === undefined || isNaN(val)) return "";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw === "") {
      onChange?.(null);
      return;
    }
    const numeric = parseInt(raw, 10) / 100;
    onChange?.(numeric);
  }

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      value={formatDisplay(value)}
      onChange={handleChange}
      className={cn(
        "h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { MoneyInput };
