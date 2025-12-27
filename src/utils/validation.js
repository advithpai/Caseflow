import { z } from "zod"

// Date validation: 1900-01-01 to today
const dateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .refine((dateStr) => {
    const date = new Date(dateStr)
    const minDate = new Date('1900-01-01')
    const today = new Date()
    today.setHours(23, 59, 59, 999) // End of today
    return date >= minDate && date <= today
  }, "Date must be between 1900-01-01 and today")

// Email validation: optional but must be valid if provided
const emailSchema = z.string()
  .optional()
  .nullable()
  .transform(val => val === "" || val === null || val === undefined ? null : val)
  .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), "Invalid email format")

// Phone validation: E.164 format preferred, optional
const phoneSchema = z.string()
  .optional()
  .nullable()
  .transform(val => val === "" || val === null || val === undefined ? null : val)
  .refine((val) => !val || /^\+?[1-9]\d{1,14}$/.test(val.replace(/[\s\-()]/g, '')), "Invalid phone format (expected E.164)")

export const caseRowSchema = z.object({
  case_id: z.string().min(1, "Case ID is required"),
  applicant_name: z.string().min(2, "Applicant name must be at least 2 characters"),
  dob: dateSchema,
  email: emailSchema,
  phone: phoneSchema,
  category: z.string()
    .transform(val => val?.toUpperCase())
    .pipe(z.enum(["TAX", "LICENSE", "PERMIT"], { 
      errorMap: () => ({ message: "Category must be TAX, LICENSE, or PERMIT" }) 
    })),
  priority: z.string()
    .optional()
    .nullable()
    .transform(val => val?.toUpperCase() || "LOW")
    .pipe(z.enum(["LOW", "MEDIUM", "HIGH"], {
      errorMap: () => ({ message: "Priority must be LOW, MEDIUM, or HIGH" }),
    })),
})

export function validateRow(row, rowIndex) {
  // Apply defaults and transformations
  const processedRow = {
    ...row,
    category: row.category?.toUpperCase() || row.category,
    priority: (row.priority?.toUpperCase()) || "LOW",
    email: row.email === "" ? null : row.email,
    phone: row.phone === "" ? null : row.phone,
  }

  const result = caseRowSchema.safeParse(processedRow)

  if (result.success) {
    return []
  }

  return result.error.errors.map((err) => ({
    row: rowIndex,
    field: err.path[0],
    message: err.message,
  }))
}

// Get the validated data with defaults applied
export function getValidatedRow(row) {
  const processedRow = {
    ...row,
    category: row.category?.toUpperCase() || row.category,
    priority: (row.priority?.toUpperCase()) || "LOW",
    email: row.email === "" ? null : row.email,
    phone: row.phone === "" ? null : row.phone,
  }

  const result = caseRowSchema.safeParse(processedRow)
  
  if (result.success) {
    return result.data
  }
  
  return null
}
