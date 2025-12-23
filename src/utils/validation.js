import { z } from "zod"

export const caseRowSchema = z.object({
  case_id: z.string().min(1, "Case ID is required"),
  applicant_name: z.string().min(2, "Name must be at least 2 characters"),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^\+?[\d\s-()]+$/, "Invalid phone number"),
  category: z.enum(["A", "B", "C", "D"], { errorMap: () => ({ message: "Category must be A, B, C, or D" }) }),
  priority: z.enum(["low", "medium", "high", "urgent"], {
    errorMap: () => ({ message: "Priority must be low, medium, high, or urgent" }),
  }),
})

export function validateRow(row, rowIndex) {
  const result = caseRowSchema.safeParse(row)

  if (result.success) {
    return []
  }

  return result.error.errors.map((err) => ({
    row: rowIndex,
    field: err.path[0],
    message: err.message,
  }))
}
