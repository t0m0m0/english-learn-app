import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "success" | "error" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth = false,
      className = "",
      children,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center";

    const variantStyles = {
      primary: "bg-primary text-white hover:bg-primary-dark",
      secondary:
        "bg-surface text-text-primary border border-border hover:bg-gray-100 dark:hover:bg-gray-700",
      success: "bg-success text-white hover:opacity-90",
      error: "bg-error text-white hover:opacity-90",
      outline:
        "border-2 border-primary text-primary hover:bg-primary hover:text-white",
      ghost: "text-text-secondary hover:bg-surface hover:text-text-primary",
    };

    const sizeStyles = {
      sm: "px-3 py-1.5 text-sm rounded-button",
      md: "px-4 py-2.5 text-base rounded-button",
      lg: "px-6 py-3 text-lg rounded-button",
    };

    const widthStyle = fullWidth ? "w-full" : "";

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
