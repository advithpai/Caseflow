"use client"

import React from "react"
import { cn } from "@/lib/utils"

function Progress({ value = 0, className, ...props }) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div
      className={cn("relative h-4 w-full overflow-hidden rounded-full bg-muted", className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      {...props}
    >
      <div
        className="h-full w-full flex-1 bg-primary transition-all"
        style={{ transform: `translateX(-${100 - clamped}%)` }}
      />
    </div>
  )
}

export { Progress }

