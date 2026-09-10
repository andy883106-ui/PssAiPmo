import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Variant = "default" | "outline" | "ghost";

const variants: Record<Variant, string> = {
  default:
    "bg-primary text-primary-foreground hover:brightness-105 border border-transparent",
  outline:
    "bg-white/80 text-foreground border border-input hover:bg-accent",
  ghost: "bg-transparent hover:bg-accent border border-transparent",
};

export function Button({
  className,
  variant = "default",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type={type}
      data-slot="button"
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold transition disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
