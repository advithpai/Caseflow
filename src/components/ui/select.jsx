

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"

const SelectContext = createContext(null)

function useSelectContext(component) {
  const ctx = useContext(SelectContext)
  if (!ctx) {
    throw new Error(`${component} must be used within a Select`)
  }
  return ctx
}

function Select({ value, defaultValue = "", onValueChange, children, className }) {
  const [open, setOpen] = useState(false)
  const [internalValue, setInternalValue] = useState(value ?? defaultValue ?? "")
  const [options, setOptions] = useState({})
  const triggerRef = useRef(null)
  const rootRef = useRef(null)

  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value)
    }
  }, [value])

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [open])

  const setValue = useCallback(
    (next) => {
      if (value === undefined) {
        setInternalValue(next)
      }
      onValueChange?.(next)
      setOpen(false)
    },
    [onValueChange, value],
  )

  const registerOption = useCallback((optionValue, label) => {
    setOptions((prev) => ({ ...prev, [optionValue]: label }))
  }, [])

  const selectedLabel = useMemo(() => options[internalValue] ?? internalValue ?? "", [internalValue, options])

  return (
    <SelectContext.Provider value={{ value: internalValue, setValue, open, setOpen, registerOption, selectedLabel, triggerRef }}>
      <div ref={rootRef} className={cn("relative", className)}>
        {children}
      </div>
    </SelectContext.Provider>
  )
}

function SelectTrigger({ className, children, ...props }) {
  const { open, setOpen, triggerRef } = useSelectContext("SelectTrigger")

  return (
    <button
      type="button"
      ref={triggerRef}
      aria-haspopup="listbox"
      aria-expanded={open}
      onClick={() => setOpen((prev) => !prev)}
      className={cn(
        "flex w-full items-center justify-between rounded-md border border-input bg-background",
        "h-9 sm:h-10 px-3 py-2 text-sm sm:text-base",
        "shadow-sm transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "ring-offset-background touch-manipulation",
        open && "ring-2 ring-ring ring-offset-2",
        className,
      )}
      {...props}
    >
      <div className="flex-1 text-left truncate">{children}</div>
      <svg
        className={cn(
          "ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform duration-200",
          open && "rotate-180"
        )}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  )
}

function SelectValue({ placeholder = "Select an option", className }) {
  const { selectedLabel } = useSelectContext("SelectValue")

  return (
    <span className={cn("block truncate", !selectedLabel && "text-muted-foreground", className)}>
      {selectedLabel || placeholder}
    </span>
  )
}

function SelectContent({ className, children, align = "start" }) {
  const { open, triggerRef } = useSelectContext("SelectContent")

  if (!open) return null

  const width = triggerRef.current?.offsetWidth

  return (
    <div
      className={cn(
        "absolute z-50 mt-1 rounded-md border bg-popover text-popover-foreground shadow-lg",
        "animate-in fade-in-0 zoom-in-95 duration-200",
        align === "end" ? "right-0" : "left-0",
        className,
      )}
      style={{ minWidth: width || "100%", maxWidth: "calc(100vw - 2rem)" }}
      role="listbox"
    >
      <div className="max-h-60 sm:max-h-72 overflow-y-auto p-1 scrollbar-thin">{children}</div>
    </div>
  )
}

function SelectItem({ value, children, className, ...props }) {
  const { value: selected, setValue, registerOption } = useSelectContext("SelectItem")

  useEffect(() => {
    const label = typeof children === "string" ? children : React.isValidElement(children) ? children.props.children ?? value : value
    registerOption(value, label)
  }, [children, registerOption, value])

  const isSelected = selected === value

  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      onClick={() => setValue(value)}
      className={cn(
        "flex w-full items-center justify-between rounded-sm",
        "px-3 py-2 sm:py-2.5 text-sm transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "touch-manipulation",
        isSelected && "bg-accent text-accent-foreground font-medium",
        className,
      )}
      {...props}
    >
      <span className="truncate">{children}</span>
      {isSelected && (
        <svg
          className="h-4 w-4 shrink-0 text-primary ml-2"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </button>
  )
}

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
