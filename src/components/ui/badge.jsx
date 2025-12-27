"use client"

import React from "react"
import { cn } from "@/lib/utils"

const badgeVariants = {
  default: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  outline: "text-foreground border border-input bg-transparent",
  destructive: "bg-destructive/15 text-destructive border-destructive/30",
  success: "bg-success/15 text-success border-success/30",
  warning: "bg-warning/15 text-warning border-warning/30",
}

const badgeSizes = {
  default: "px-2.5 py-0.5 text-xs",
  sm: "px-2 py-0.5 text-2xs",
  lg: "px-3 py-1 text-sm",
}

function Badge({ className, variant = "default", size = "default", ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium",
        "transition-colors duration-200",
        "whitespace-nowrap select-none",
        badgeVariants[variant] ?? badgeVariants.default,
        badgeSizes[size] ?? badgeSizes.default,
        className,
      )}
      {...props}
    />
  )
}

export { Badge }
