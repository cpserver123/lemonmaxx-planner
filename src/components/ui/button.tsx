import * as React from "react";
import { clsx } from "clsx";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          "disabled:pointer-events-none disabled:opacity-50",
          variant === "default" && "bg-primary text-white hover:bg-primary/90",
          variant === "outline" && "border border-[#E6EBF1] dark:border-[#374151] bg-transparent hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332]",
          variant === "ghost" && "hover:bg-[#F3F4F6] dark:hover:bg-[#1a2332]",
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export { Button };
