import { cn } from "@/lib/utils";

interface CalendarInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

function CalendarInput({ className, ...props }: CalendarInputProps) {
  return (
    <input
      type="date"
      className={cn(
        "h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50",
        "[color-scheme:dark]",
        className,
      )}
      {...props}
    />
  );
}

export { CalendarInput };
