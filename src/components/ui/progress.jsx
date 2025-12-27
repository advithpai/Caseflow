

import React from "react"
import { cn } from "@/lib/utils"

function Progress({ value = 0, className, showLabel = false, size = "default", ...props }) {
  const clamped = Math.min(100, Math.max(0, value))

  const sizes = {
    sm: "h-2",
    default: "h-3 sm:h-4",
    lg: "h-4 sm:h-5",
  }

  return (
    <div className="relative">
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-muted",
          sizes[size] ?? sizes.default,
          className
        )}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
        aria-label={`Progress: ${clamped}%`}
        {...props}
      >
        <div
          className={cn(
            "h-full w-full flex-1 bg-primary transition-all duration-500 ease-out",
            clamped === 100 && "bg-success"
          )}
          style={{ transform: `translateX(-${100 - clamped}%)` }}
        />
      </div>
      {showLabel && (
        <span className="absolute right-0 -top-6 text-xs sm:text-sm font-medium text-muted-foreground">
          {clamped}%
        </span>
      )}
    </div>
  )
}

export { Progress }
