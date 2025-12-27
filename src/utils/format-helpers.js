/**
 * Format date to readable string
 */
export function formatDate(date) {
  if (!date) return "N/A"
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

/**
 * Format date with time
 */
export function formatDateTime(date) {
  if (!date) return "N/A"
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date) {
  if (!date) return "N/A"

  const now = new Date()
  const past = new Date(date)
  const diffMs = now - past
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`

  return formatDate(date)
}

/**
 * Format number with commas
 */
export function formatNumber(num) {
  if (num == null) return "0"
  return num.toLocaleString("en-US")
}

/**
 * Format percentage
 */
export function formatPercent(value, total) {
  if (!total) return "0%"
  return `${Math.round((value / total) * 100)}%`
}

/**
 * Normalize phone number to E.164 format
 * Attempts to convert various phone formats to E.164
 */
export function normalizePhone(phone, defaultCountryCode = "+1") {
  if (!phone) return phone

  // Remove all non-digit and non-plus characters
  let cleaned = phone.replace(/[^\d+]/g, "")

  // If it starts with +, keep it
  if (cleaned.startsWith("+")) {
    return cleaned
  }

  // If it starts with country code (e.g., 91 for India), add +
  if (cleaned.length > 10) {
    return "+" + cleaned
  }

  // Otherwise, add default country code
  return defaultCountryCode + cleaned
}

/**
 * Title case a string (capitalize first letter of each word)
 */
export function toTitleCase(str) {
  if (!str) return str
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

/**
 * Trim whitespace from all string fields in an object
 */
export function trimObjectStrings(obj) {
  const trimmed = {}
  for (const [key, value] of Object.entries(obj)) {
    trimmed[key] = typeof value === "string" ? value.trim() : value
  }
  return trimmed
}

/**
 * Format file size
 */
export function formatFileSize(bytes) {
  if (!bytes) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}
