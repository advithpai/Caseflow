"use client"

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
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
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
        "flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm",
        "shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50 ring-offset-background",
        className,
      )}
      {...props}
    >
      <div className="flex-1 text-left">{children}</div>
      <span className={cn("ml-2 text-xs transition-transform", open && "rotate-180")}>▾</span>
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
        "absolute z-50 mt-1 rounded-md border bg-popover text-popover-foreground shadow-md",
        "animate-in fade-in-0 zoom-in-95",
        align === "end" ? "right-0" : "left-0",
        className,
      )}
      style={{ minWidth: width || "100%" }}
      role="listbox"
    >
      <div className="max-h-64 overflow-y-auto p-1">{children}</div>
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
        "flex w-full items-center justify-between rounded-sm px-3 py-2 text-sm transition-colors",
        "hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isSelected && "bg-accent text-accent-foreground",
        className,
      )}
      {...props}
    >
      <span className="truncate">{children}</span>
      {isSelected && <span className="text-xs">✔</span>}
    </button>
  )
}

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }

