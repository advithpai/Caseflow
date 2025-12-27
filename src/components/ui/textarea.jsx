"use client";

import React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef(({ className, error, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "flex w-full rounded-md border bg-background",
        "px-3 py-2.5 text-sm sm:text-base",
        "ring-offset-background transition-all duration-200",
        "placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "min-h-[100px] sm:min-h-[120px] resize-y",
        "touch-manipulation",
        error ? "border-destructive focus-visible:ring-destructive" : "border-input",
        className
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
