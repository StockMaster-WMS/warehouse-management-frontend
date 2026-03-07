import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "secondary" | "outline" | "destructive";

const variantClasses: Record<ButtonVariant, string> = {
  default: "bg-zinc-900 text-white hover:bg-zinc-700",
  secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200",
  outline: "border border-zinc-300 bg-transparent hover:bg-zinc-50",
  destructive: "bg-red-600 text-white hover:bg-red-500",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ className, variant = "default", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
