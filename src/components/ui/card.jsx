

import React from "react"
import { cn } from "@/lib/utils"

function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        "transition-all duration-200",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }) {
  return (
    <div
      className={cn(
        "flex flex-col space-y-1.5 p-4 sm:p-5 lg:p-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, as: Component = "h3", ...props }) {
  return (
    <Component
      className={cn(
        "text-base sm:text-lg font-semibold leading-tight tracking-tight",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }) {
  return (
    <p
      className={cn(
        "text-xs sm:text-sm text-muted-foreground leading-relaxed",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }) {
  return (
    <div
      className={cn(
        "p-4 sm:p-5 lg:p-6 pt-0",
        className
      )}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }) {
  return (
    <div
      className={cn(
        "flex items-center p-4 sm:p-5 lg:p-6 pt-0",
        className
      )}
      {...props}
    />
  )
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
