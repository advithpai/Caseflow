

import React from "react"
import { cn } from "@/lib/utils"

const buttonVariants = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
  outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  link: "text-primary underline-offset-4 hover:underline",
  success: "bg-success text-success-foreground hover:bg-success/90 shadow-sm",
}

const buttonSizes = {
  default: "h-9 sm:h-10 px-3 sm:px-4 py-2 text-sm",
  sm: "h-8 sm:h-9 px-2.5 sm:px-3 text-xs sm:text-sm",
  lg: "h-10 sm:h-11 px-4 sm:px-6 text-sm sm:text-base",
  xl: "h-11 sm:h-12 px-6 sm:px-8 text-base sm:text-lg",
  icon: "h-9 w-9 sm:h-10 sm:w-10",
  "icon-sm": "h-8 w-8 sm:h-9 sm:w-9",
}

const Button = React.forwardRef(({ className, variant = "default", size = "default", loading = false, children, disabled, ...props }, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium",
        "transition-all duration-200 ease-out active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50 ring-offset-background",
        "select-none touch-manipulation",
        buttonVariants[variant] ?? buttonVariants.default,
        buttonSizes[size] ?? buttonSizes.default,
        className,
      )}
      {...props}
    >
      {loading && (
        <svg
          className="h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  )
})
Button.displayName = "Button"

export { Button }
